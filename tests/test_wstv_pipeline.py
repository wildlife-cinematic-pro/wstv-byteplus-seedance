import json
import subprocess
from pathlib import Path

import pytest

import common
import generate_video
import wstv_pipeline


TASK_ID = "cgt-20260616100710-pj5td"


def _config(tmp_path, api_key=None):
    config = common.load_config(require_key=False)
    return config.__class__(
        **{
            **config.__dict__,
            "api_key": api_key,
            "api_key_source": "ARK_API_KEY" if api_key else None,
            "task_log_path": tmp_path / "data" / "tasks.jsonl",
            "request_preview_dir": tmp_path / "outputs" / "request-previews",
            "raw_response_dir": tmp_path / "outputs" / "raw-responses",
            "private_task_response_dir": tmp_path / "outputs" / "private-responses",
            "outputs_dir": tmp_path / "outputs",
            "downloads_dir": tmp_path / "downloads",
        }
    )


def _args(tmp_path, **overrides):
    prompt = tmp_path / "prompt.txt"
    prompt.write_text("A safe WSTV wildlife prompt", encoding="utf-8")
    base = {
        "prompt_file": str(prompt),
        "out": str(tmp_path / "downloads" / "example.mp4"),
        "image_url": None,
        "duration": 15,
        "ratio": "9:16",
        "resolution": "720p",
        "generate_audio": True,
        "watermark": False,
        "expected_width": 720,
        "expected_height": 1280,
        "expected_duration": 15.0,
        "poll_interval": 30,
        "poll_timeout": 900,
        "submit": False,
        "max_cost_usd": None,
        "confirm": None,
    }
    base.update(overrides)
    return type("Args", (), base)()


def test_dry_run_does_not_call_network(monkeypatch, tmp_path, capsys):
    config = _config(tmp_path)
    called = False

    def fake_request(*args, **kwargs):
        nonlocal called
        called = True

    monkeypatch.setattr(wstv_pipeline, "load_config", lambda require_key=False: config)
    monkeypatch.setattr(wstv_pipeline, "request_json", fake_request)

    assert wstv_pipeline.run_pipeline(_args(tmp_path)) == 0

    output = capsys.readouterr().out
    assert "No network request was made." in output
    assert called is False


def test_dry_run_with_valid_image_url_does_not_call_byteplus(monkeypatch, tmp_path, capsys):
    config = _config(tmp_path)
    byteplus_called = False

    def fake_image_validator(*args, **kwargs):
        return {"content_type": "image/png"}

    def fake_request(*args, **kwargs):
        nonlocal byteplus_called
        byteplus_called = True

    monkeypatch.setattr(common, "validate_public_image_url", fake_image_validator)
    monkeypatch.setattr(wstv_pipeline, "load_config", lambda require_key=False: config)
    monkeypatch.setattr(wstv_pipeline, "request_json", fake_request)

    assert wstv_pipeline.run_pipeline(
        _args(tmp_path, image_url="https://images.wildstoriestv.com/elephant_mud_master.png")
    ) == 0

    assert "No network request was made." in capsys.readouterr().out
    assert byteplus_called is False


def test_paid_submit_invalid_image_url_blocks_before_paid_call(monkeypatch, tmp_path):
    config = _config(tmp_path, api_key="test-key")
    byteplus_called = False

    def fake_request(*args, **kwargs):
        nonlocal byteplus_called
        byteplus_called = True

    monkeypatch.setattr(wstv_pipeline, "load_config", lambda require_key=False: config)
    monkeypatch.setattr(wstv_pipeline, "request_json", fake_request)

    with pytest.raises(common.ConfigError, match="https"):
        wstv_pipeline.run_pipeline(
            _args(
                tmp_path,
                image_url="http://images.wildstoriestv.com/bear_cub_falling.png",
                submit=True,
                max_cost_usd=3.0,
                confirm=generate_video.CONFIRMATION_TOKEN,
            )
        )

    assert byteplus_called is False


def test_submit_requires_max_cost(monkeypatch, tmp_path):
    config = _config(tmp_path, api_key="test-key")
    monkeypatch.setattr(wstv_pipeline, "load_config", lambda require_key=False: config)

    with pytest.raises(common.ConfigError, match="max-cost-usd"):
        wstv_pipeline.run_pipeline(
            _args(tmp_path, submit=True, confirm=generate_video.CONFIRMATION_TOKEN)
        )


def test_submit_requires_confirmation(monkeypatch, tmp_path):
    config = _config(tmp_path, api_key="test-key")
    monkeypatch.setattr(wstv_pipeline, "load_config", lambda require_key=False: config)

    with pytest.raises(common.ConfigError, match="confirm"):
        wstv_pipeline.run_pipeline(_args(tmp_path, submit=True, max_cost_usd=3.0))


def test_cost_cap_blocks_high_estimate(monkeypatch, tmp_path):
    config = _config(tmp_path, api_key="test-key")
    monkeypatch.setattr(wstv_pipeline, "load_config", lambda require_key=False: config)

    with pytest.raises(common.ConfigError, match="exceeds"):
        wstv_pipeline.run_pipeline(
            _args(
                tmp_path,
                submit=True,
                max_cost_usd=0.01,
                confirm=generate_video.CONFIRMATION_TOKEN,
            )
        )


def test_polling_uses_existing_task_id_only(tmp_path):
    config = _config(tmp_path, api_key="test-key")
    seen = []

    def fake_fetch(_config, task_id):
        seen.append(task_id)
        return {"id": task_id, "status": "succeeded", "content": {"video_url": "https://example.com/out.mp4"}}

    data = wstv_pipeline.poll_until_succeeded(
        config,
        TASK_ID,
        interval=1,
        timeout=1,
        sleep=lambda _seconds: None,
        fetch=fake_fetch,
    )

    assert data["id"] == TASK_ID
    assert seen == [TASK_ID]


def test_download_path_must_use_downloads(tmp_path):
    config = _config(tmp_path)
    with pytest.raises(common.ConfigError, match="downloads"):
        wstv_pipeline.validate_output_path(config, str(tmp_path / "outside.mp4"))
    assert wstv_pipeline.validate_output_path(config, str(tmp_path / "downloads" / "ok.mp4")).name == "ok.mp4"


def test_private_response_path_stays_under_private_responses(tmp_path):
    config = _config(tmp_path)
    path = wstv_pipeline.save_private_task_response(config, TASK_ID, {"id": TASK_ID, "status": "succeeded"})
    assert path.parent == tmp_path / "outputs" / "private-responses"
    assert json.loads(path.read_text())["id"] == TASK_ID


def test_full_submit_flow_is_offline_with_mocks(monkeypatch, tmp_path):
    config = _config(tmp_path, api_key="test-key")
    requests = []

    def fake_create(method, url, api_key, timeout, **kwargs):
        requests.append((method, url))
        return {"id": TASK_ID, "status": "queued"}

    def fake_poll(_config, task_id, **kwargs):
        assert task_id == TASK_ID
        return {"id": TASK_ID, "status": "succeeded", "content": {"video_url": "https://example.com/out.mp4"}}

    downloaded = {}

    def fake_download(_config, response_path, out_path, args):
        downloaded["response_path"] = response_path
        downloaded["out_path"] = out_path

    monkeypatch.setattr(wstv_pipeline, "load_config", lambda require_key=False: config)
    monkeypatch.setattr(wstv_pipeline, "request_json", fake_create)
    monkeypatch.setattr(wstv_pipeline, "poll_until_succeeded", fake_poll)
    monkeypatch.setattr(wstv_pipeline, "download_completed_video", fake_download)

    result = wstv_pipeline.run_pipeline(
        _args(
            tmp_path,
            submit=True,
            max_cost_usd=3.0,
            confirm=generate_video.CONFIRMATION_TOKEN,
        )
    )

    assert result == 0
    assert requests == [("POST", "https://ark.ap-southeast.bytepluses.com/api/v3/contents/generations/tasks")]
    assert downloaded["response_path"].parent == tmp_path / "outputs" / "private-responses"
    assert downloaded["out_path"].parent == tmp_path / "downloads"


def test_no_signed_urls_or_mp4_files_are_tracked():
    files = subprocess.check_output(["git", "ls-files"], text=True).splitlines()
    assert not any(path.endswith(".mp4") for path in files)
    assert not any(path.startswith("downloads/") for path in files)
    signed_output_prefix = "https://ark-" + "acg"
    for path in files:
        text = Path(path).read_text(encoding="utf-8", errors="ignore")
        assert signed_output_prefix not in text
