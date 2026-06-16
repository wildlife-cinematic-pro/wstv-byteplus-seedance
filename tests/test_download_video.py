import pytest

import download_video
import common
from common import ConfigError


def test_download_rejects_html_content_type():
    with pytest.raises(ConfigError):
        download_video.validate_content_type("text/html; charset=utf-8")


def test_verify_video_detects_non_vertical():
    meta = {
        "status": "PASS",
        "data": {
            "streams": [
                {"codec_type": "video", "width": 1280, "height": 720, "duration": "15.0", "codec_name": "h264"}
            ],
            "format": {},
        },
    }
    findings = download_video.verify_video(meta, 15, 720, 1280)
    assert findings


def test_url_from_task_response(tmp_path):
    path = tmp_path / "task.json"
    path.write_text(
        '{"status":"succeeded","content":{"video_url":"https://example.com/out.mp4?sig=redacted"}}',
        encoding="utf-8",
    )
    assert download_video.url_from_task_response(str(path)).startswith("https://example.com/out.mp4")


def test_url_from_sanitized_completed_task_fixture():
    path = "tests/fixtures/completed_task_response.sanitized.json"
    assert download_video.url_from_task_response(path) == "https://example.com/sea-lion-test-001.mp4?signature=redacted"


def test_url_from_task_response_requires_succeeded(tmp_path):
    path = tmp_path / "task.json"
    path.write_text(
        '{"status":"running","content":{"video_url":"https://example.com/out.mp4?sig=redacted"}}',
        encoding="utf-8",
    )
    with pytest.raises(ConfigError, match="not succeeded"):
        download_video.url_from_task_response(str(path))


def test_verified_output_video_url_field_from_schema():
    config = common.load_config(require_key=False)
    assert common.verified_output_video_url_field(config) == {"field": "video_url", "json_path": "$.content.video_url"}


def test_download_cli_supports_required_safe_options(monkeypatch):
    monkeypatch.setattr(
        "sys.argv",
        [
            "download_video.py",
            "--response-json",
            "tests/fixtures/completed_task_response.sanitized.json",
            "--out",
            "downloads/test.mp4",
            "--expect-duration",
            "15",
            "--expect-width",
            "720",
            "--expect-height",
            "1280",
        ],
    )
    args = download_video.parse_args()
    assert args.response_json == "tests/fixtures/completed_task_response.sanitized.json"
    assert args.expect_duration == 15
    assert args.expect_width == 720
    assert args.expect_height == 1280
