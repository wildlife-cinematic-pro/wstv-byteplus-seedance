import json
import subprocess
import datetime as dt
from pathlib import Path

import pytest

import cost_tracker
import token_pack_tracker
import wstv_server
from common import ConfigError
from generate_video import CONFIRMATION_TOKEN


def _request(**overrides):
    data = {
        "scene_idea": "A sea lion watches the surf",
        "prompt": "Final cinematic sea lion prompt",
        "image_url": "https://images.wildstoriestv.com/sea_lion.png",
        "image_url_2": "",
        "storyboard_ack": False,
        "output_filename": "sea-lion-test.mp4",
        "resolution": "720p",
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
            "token_pack_ledger_path": tmp_path / "data" / "wstv_token_packs.jsonl",
            "budget_settings_path": tmp_path / "data" / "wstv_budget_settings.json",
        }
    )


def _add_7m_pack(config):
    entry = token_pack_tracker.build_pack_entry(
        model="Dreamina-Seedance-2.0",
        package_size="1M",
        quantity=7,
        total_price_usd=30.10,
        purchase_date=dt.date.today().isoformat(),
        validity_days=90,
        note="test token pack",
    )
    assert token_pack_tracker.append_pack_entry(config, entry) is True
    return entry


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
    assert "--resolution" in cmd
    assert "720p" in cmd


def test_dashboard_resolution_selector_passes_1080p_to_pipeline(monkeypatch, tmp_path):
    config = _server_config(tmp_path)
    monkeypatch.setattr(wstv_server, "load_config", lambda require_key=False: config)
    monkeypatch.setattr(wstv_server, "DASHBOARD_DATA_DIR", tmp_path / "dashboard")
    request = _request(resolution="1080p")
    cmd = wstv_server.pipeline_command(request, submit=False)
    assert cmd[cmd.index("--resolution") + 1] == "1080p"


def test_dashboard_rejects_unknown_resolution():
    with pytest.raises(ConfigError, match="Resolution"):
        _request(resolution="4k")


def test_dry_run_command_accepts_second_image(monkeypatch, tmp_path):
    config = _server_config(tmp_path)
    monkeypatch.setattr(wstv_server, "load_config", lambda require_key=False: config)
    monkeypatch.setattr(wstv_server, "DASHBOARD_DATA_DIR", tmp_path / "dashboard")
    request = _request(image_url_2="https://images.wildstoriestv.com/storyboard.png")
    cmd = wstv_server.pipeline_command(request, submit=False)
    assert "--submit" not in cmd
    assert "--image-url" in cmd
    assert "--image-url-2" in cmd
    assert "https://images.wildstoriestv.com/storyboard.png" in cmd


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


def test_paid_command_passes_storyboard_ack_when_checked(monkeypatch, tmp_path):
    config = _server_config(tmp_path)
    monkeypatch.setattr(wstv_server, "load_config", lambda require_key=False: config)
    monkeypatch.setattr(wstv_server, "DASHBOARD_DATA_DIR", tmp_path / "dashboard")
    request = _request(
        image_url_2="https://images.wildstoriestv.com/storyboard.png",
        storyboard_ack=True,
        confirm=CONFIRMATION_TOKEN,
    )
    cmd = wstv_server.pipeline_command(request, submit=True)
    assert "--image-url-2" in cmd
    assert "--ack-storyboard-risk" in cmd


def test_paid_requires_exact_confirmation_before_subprocess(monkeypatch):
    called = False

    def fake_run(*args, **kwargs):
        nonlocal called
        called = True

    monkeypatch.setattr(wstv_server.subprocess, "run", fake_run)
    with pytest.raises(ConfigError, match="Confirmation"):
        wstv_server.run_pipeline_request(_request(confirm="wrong"), submit=True)
    assert called is False


def test_prompt_over_3500_still_hard_blocks_paid_submit(monkeypatch):
    called = False

    def fake_run(*args, **kwargs):
        nonlocal called
        called = True

    monkeypatch.setattr(wstv_server.subprocess, "run", fake_run)
    with pytest.raises(ConfigError, match="3,500-character limit"):
        wstv_server.run_pipeline_request(
            _request(prompt="x" * 3501, confirm=CONFIRMATION_TOKEN),
            submit=True,
        )
    assert called is False


def test_paid_requires_storyboard_ack_before_subprocess(monkeypatch):
    called = False

    def fake_run(*args, **kwargs):
        nonlocal called
        called = True

    monkeypatch.setattr(wstv_server.subprocess, "run", fake_run)
    with pytest.raises(ConfigError, match="Storyboard acknowledgement"):
        wstv_server.run_pipeline_request(
            _request(
                image_url_2="https://images.wildstoriestv.com/storyboard.png",
                storyboard_ack=False,
                confirm=CONFIRMATION_TOKEN,
            ),
            submit=True,
        )
    assert called is False


def test_dashboard_rejects_comma_and_non_https_second_image():
    with pytest.raises(ConfigError, match="one URL only"):
        _request(image_url_2="https://images.wildstoriestv.com/a.png,https://images.wildstoriestv.com/b.png")
    with pytest.raises(ConfigError, match="https"):
        _request(image_url_2="http://images.wildstoriestv.com/storyboard.png")


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


def test_manual_usage_endpoint_appends_and_blocks_duplicate(monkeypatch, tmp_path):
    config = _server_config(tmp_path)
    _add_7m_pack(config)
    monkeypatch.setattr(wstv_server, "load_config", lambda require_key=False: config)
    data = {
        "filename": "second-video.mp4",
        "date": "2026-06-16",
        "model": "Dreamina-Seedance-2.0",
        "resolution": "720p",
        "tokens": 324900,
        "token_source": "actual_from_console",
        "note": "second BytePlus Console usage entry",
        "confirm": "ADD_CONSOLE_USAGE",
    }
    first = wstv_server.add_manual_usage(data)
    second = wstv_server.add_manual_usage(data)
    assert first["recorded"] is True
    assert second["recorded"] is False
    assert first["summary"]["usage_summary"]["total_used_tokens"] == 324900
    assert "Already recorded" in second["message"]


def test_manual_usage_requires_explicit_confirmation(monkeypatch, tmp_path):
    config = _server_config(tmp_path)
    monkeypatch.setattr(wstv_server, "load_config", lambda require_key=False: config)
    with pytest.raises(ConfigError, match="ADD_CONSOLE_USAGE"):
        wstv_server.add_manual_usage(
            {
                "filename": "second-video.mp4",
                "date": "2026-06-16",
                "model": "Dreamina-Seedance-2.0",
                "resolution": "720p",
                "tokens": 324900,
                "token_source": "actual_from_console",
                "note": "second BytePlus Console usage entry",
            }
        )


def test_switching_resolution_updates_api_summary(monkeypatch, tmp_path):
    config = _server_config(tmp_path)
    _add_7m_pack(config)
    monkeypatch.setattr(wstv_server, "load_config", lambda require_key=False: config)
    summary_720 = wstv_server.cost_summary("all", "720p")
    summary_1080 = wstv_server.cost_summary("all", "1080p")
    assert summary_720["token_pack_tracker"]["selected_projected_tokens"] == 324000
    assert summary_720["token_pack_tracker"]["selected_payg_cost_usd"] == 2.2680
    assert summary_1080["token_pack_tracker"]["selected_projected_tokens"] == 801900
    assert summary_1080["token_pack_tracker"]["selected_payg_cost_usd"] == 5.6133


def test_budget_insufficient_blocks_paid_before_subprocess(monkeypatch, tmp_path):
    config = _server_config(tmp_path)
    monkeypatch.setattr(wstv_server, "load_config", lambda require_key=False: config)
    cost_tracker.save_budget_settings(
        config,
        {"total_budget_usd": 0.01, "daily_budget_usd": "", "monthly_budget_usd": ""},
    )
    called = False

    def fake_run(*args, **kwargs):
        nonlocal called
        called = True

    monkeypatch.setattr(wstv_server.subprocess, "run", fake_run)
    with pytest.raises(ConfigError, match="Budget check blocked"):
        wstv_server.run_pipeline_request(_request(confirm=CONFIRMATION_TOKEN), submit=True)
    assert called is False


def test_token_pack_insufficient_blocks_paid_before_subprocess(monkeypatch, tmp_path):
    config = _server_config(tmp_path)
    _add_7m_pack(config)
    monkeypatch.setattr(wstv_server, "load_config", lambda require_key=False: config)
    entry = cost_tracker.manual_backfill_entry(
        date="2026-06-16",
        model="Dreamina-Seedance-2.0",
        output_path=tmp_path / "videos" / "already-used.mp4",
        tokens=6_500_000,
        rate_usd_per_million_tokens=7.0,
        source_note="test fixture",
    )
    assert cost_tracker.append_ledger_entry(config, entry) is True
    called = False

    def fake_run(*args, **kwargs):
        nonlocal called
        called = True

    monkeypatch.setattr(wstv_server.subprocess, "run", fake_run)
    with pytest.raises(ConfigError, match="selected resolution"):
        wstv_server.run_pipeline_request(
            _request(resolution="1080p", confirm=CONFIRMATION_TOKEN),
            submit=True,
        )
    assert called is False


def test_open_video_folder_and_latest_video_are_local_safe(monkeypatch, tmp_path):
    config = _server_config(tmp_path)
    monkeypatch.setattr(wstv_server, "load_config", lambda require_key=False: config)
    opened = []
    monkeypatch.setattr(wstv_server, "open_path", lambda path: opened.append(path) or {"opened": str(path)})

    result = wstv_server.open_video_folder()
    assert result["opened"] == str(config.downloads_dir.resolve())

    with pytest.raises(ConfigError, match="No generated video"):
        wstv_server.open_latest_video()

    video = config.downloads_dir / "latest.mp4"
    video.parent.mkdir(parents=True, exist_ok=True)
    video.write_bytes(b"fake")
    result = wstv_server.open_latest_video()
    assert result["opened"].endswith("latest.mp4")


def test_open_endpoint_rejects_non_local_client():
    handler = object.__new__(wstv_server.DashboardHandler)
    handler.client_address = ("192.0.2.10", 12345)
    with pytest.raises(ConfigError, match="127.0.0.1"):
        handler._require_local_client()


def test_ui_requires_dry_run_and_confirmation_for_paid_button():
    html = Path("web/wstv_ui.html").read_text(encoding="utf-8")
    assert 'id="paidZone" class="paid-zone" style="display:none"' in html
    assert 'paidZone.style.display = safeMode ? "none" : "block"' in html
    assert "Safe Mode ON: paid generation disabled. Dry-runs still allowed." in html
    assert "generateButton.disabled = true;" in html
    assert 'generateButton.textContent = "Submitting..."' in html
    assert 'if (result.ok) fields.confirm.value = "";' in html
    assert "promptTooLong()" in html
    assert "Prompt exceeds 3,500-character limit. Shorten before paid generation." in html
    assert "SUBMIT PAID TASK" in html
    assert "Dry Run (no cost)" in html
    assert "Open video folder" in html
    assert "Cost / Budget Tracker" in html
    assert "Reference image host:" in html
    assert "imagePreview" in html
    assert "Reference Image URL 1" in html
    assert "Reference Image URL 2" in html
    assert "imagePreview2" in html
    assert "I understand storyboard text/grid may be copied." in html
    assert "Use Image 1 as the master identity" in html
    assert "Reference images:" in html
    assert 'id="resolution"' in html
    assert "1080p uses more than 2x the tokens of 720p" in html
    assert "Resolution Comparison" in html
    assert "Pack Summary" in html
    assert "Usage Summary" in html
    assert "Resolution Comparison" in html
    assert "Recent Usage" in html
    assert "Add Console Usage Manually" in html
    assert "ADD_CONSOLE_USAGE" in html
    assert "packComparison" in html
    assert "packSummary" in html
    assert "usageSummary" in html
    assert "Add Token Pack" in html
    assert "ADD_TOKEN_PACK" in html
    assert "/api/manual-usage" in html
    assert "/api/token-pack" in html
    assert "/api/token-pack-summary" in html
    assert "function refreshTokenPackSummary()" in html
    assert "/api/cost-summary?period=" in html
    assert "resolution=" in html
    assert "Characters:" in html
    assert "Loop ending clean" in html
    assert 'id="qaDuration"> Duration verified' in html
    assert '<input type="checkbox" checked' not in html
    assert "max-height: 200px; overflow-y: auto" in html
    assert "Est. videos left" in html
    assert "Token source" in html
    assert "/api/budget_status" in html
    assert "/api/open-video-folder" in html
    assert "/api/open-latest-video" in html
    assert "Prompt copied." in html
    assert "BytePlus Console Billing remains the final source of truth" in html
