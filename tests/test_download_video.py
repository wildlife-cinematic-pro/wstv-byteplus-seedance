import pytest

import download_video
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
