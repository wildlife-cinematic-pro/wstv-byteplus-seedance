import json
import subprocess
from pathlib import Path

import pytest

import wstv_server
from common import ConfigError
from generate_video import CONFIRMATION_TOKEN


def _request(**overrides):
    data = {
        "scene_idea": "A sea lion watches the surf",
        "prompt": "Final cinematic sea lion prompt",
        "image_url": "https://images.wildstoriestv.com/sea_lion.png",
        "output_filename": "sea-lion-test.mp4",
        "max_cost_usd": 3,
        "confirm": "",
    }
    data.update(overrides)
    return wstv_server.dashboard_request(data)


def test_server_defaults_to_localhost_only():
    args = wstv_server.parse_args([])
    assert args.host == "127.0.0.1"
    with pytest.raises(SystemExit):
        wstv_server.parse_args(["--host", "0.0.0.0"])


def _server_config(tmp_path):
    config = wstv_server.load_config(require_key=False)
    return config.__class__(
        **{
            **config.__dict__,
            "downloads_dir": tmp_path / "Movies" / "WSTV" / "SeedanceVideos",
            "cost_ledger_path": tmp_path / "data" / "wstv_cost_ledger.jsonl",
            "budget_settings_path": tmp_path / "data" / "wstv_budget_settings.json",
        }
    )


def test_output_filename_is_sanitized_and_kept_in_video_folder(monkeypatch, tmp_path):
    config = _server_config(tmp_path)
    monkeypatch.setattr(wstv_server, "load_config", lambda require_key=False: config)
    request = _request(output_filename="my sea lion!.mp4")
    assert request.output_filename == "my-sea-lion.mp4"
    path = wstv_server.output_path_for(request.output_filename)
    assert path.parent == config.downloads_dir
    assert config.downloads_dir.exists()


def test_output_filename_rejects_path_traversal(monkeypatch, tmp_path):
    config = _server_config(tmp_path)
    monkeypatch.setattr(wstv_server, "load_config", lambda require_key=False: config)
    with pytest.raises(ConfigError):
        _request(output_filename="../../secret")
    with pytest.raises(ConfigError):
        wstv_server.output_path_for("/tmp/outside.mp4")


def test_dry_run_command_has_no_paid_flags(monkeypatch, tmp_path):
    config = _server_config(tmp_path)
    monkeypatch.setattr(wstv_server, "load_config", lambda require_key=False: config)
    monkeypatch.setattr(wstv_server, "DASHBOARD_DATA_DIR", tmp_path / "dashboard")
    request = _request()
    cmd = wstv_server.pipeline_command(request, submit=False)
    assert "--submit" not in cmd
    assert "--allow-duplicate" not in cmd
    assert "--image-url" in cmd


def test_paid_command_keeps_required_gates(monkeypatch, tmp_path):
    config = _server_config(tmp_path)
    monkeypatch.setattr(wstv_server, "load_config", lambda require_key=False: config)
    monkeypatch.setattr(wstv_server, "DASHBOARD_DATA_DIR", tmp_path / "dashboard")
    request = _request(confirm=CONFIRMATION_TOKEN)
    cmd = wstv_server.pipeline_command(request, submit=True)
    assert "--submit" in cmd
    assert "--max-cost-usd" in cmd
    assert "--confirm" in cmd
    assert CONFIRMATION_TOKEN in cmd
    assert "--allow-duplicate" not in cmd


def test_paid_requires_exact_confirmation_before_subprocess(monkeypatch):
    called = False

    def fake_run(*args, **kwargs):
        nonlocal called
        called = True

    monkeypatch.setattr(wstv_server.subprocess, "run", fake_run)
    with pytest.raises(ConfigError, match="Confirmation"):
        wstv_server.run_pipeline_request(_request(confirm="wrong"), submit=True)
    assert called is False


def test_run_pipeline_request_sanitizes_logs_and_history(monkeypatch, tmp_path):
    config = _server_config(tmp_path)
    monkeypatch.setattr(wstv_server, "load_config", lambda require_key=False: config)
    monkeypatch.setattr(wstv_server, "DASHBOARD_DATA_DIR", tmp_path / "dashboard")
    monkeypatch.setattr(wstv_server, "HISTORY_PATH", tmp_path / "history.json")

    completed = subprocess.CompletedProcess(
        args=["pipeline"],
        returncode=0,
        stdout=(
            "Output URL: https://example.com/out.mp4?signature=secret\n"
            "Private completed response saved: /repo/outputs/private-responses/task.json\n"
            "Final MP4: /repo/downloads/sea-lion.mp4\n"
        ),
        stderr="",
    )
    monkeypatch.setattr(wstv_server.subprocess, "run", lambda *args, **kwargs: completed)

    result = wstv_server.run_pipeline_request(_request(confirm=CONFIRMATION_TOKEN), submit=True)

    assert result["ok"] is True
    assert "signature=secret" not in result["log"]
    assert "private-responses/task.json" not in result["log"]
    history = json.loads((tmp_path / "history.json").read_text())
    assert history[0]["mp4_path"].endswith("sea-lion-test.mp4")
    assert "private-responses" not in json.dumps(history).lower()
    assert result["video_folder"] == str(config.downloads_dir)


def test_cost_summary_and_budget_settings_are_local(monkeypatch, tmp_path):
    config = _server_config(tmp_path)
    monkeypatch.setattr(wstv_server, "load_config", lambda require_key=False: config)
    summary = wstv_server.save_budget(
        {
            "total_budget_usd": "12.50",
            "daily_budget_usd": "",
            "monthly_budget_usd": "40",
            "period": "all",
        }
    )
    assert summary["budget_settings"]["total_budget_usd"] == 12.5
    assert config.budget_settings_path.exists()
    reset = wstv_server.reset_budget()
    assert reset["budget_settings"]["total_budget_usd"] == 50.0
    assert not config.budget_settings_path.exists()


def test_ui_requires_dry_run_and_confirmation_for_paid_button():
    html = Path("web/wstv_ui.html").read_text(encoding="utf-8")
    assert "generateButton.disabled = !(dryRunOk && fields.confirm.value === CONFIRM)" in html
    assert "Generate Paid Video" in html
    assert "Dry Run" in html
    assert "Open video folder" in html
    assert "Cost / Budget Tracker" in html
    assert "BytePlus Console Billing remains the final source of truth" in html
