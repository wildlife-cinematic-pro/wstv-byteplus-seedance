import json
import re
from pathlib import Path

import common


ROOT = Path(__file__).resolve().parents[1]
SAMPLE_PATH = ROOT / "docs" / "official-rest-sample.redacted.txt"


def load_sample_body():
    sample = SAMPLE_PATH.read_text(encoding="utf-8")
    match = re.search(r"-d '(\{.*\})'", sample, flags=re.S)
    assert match, "redacted sample must contain a curl -d JSON body"
    return sample, json.loads(match.group(1))


def test_official_sample_endpoint_and_model():
    sample, body = load_sample_body()
    assert "POST https://ark.ap-southeast.bytepluses.com/api/v3/contents/generations/tasks" in sample
    assert body["model"] == "dreamina-seedance-2-0-260128"
    assert body["ratio"] == "16:9"
    assert body["duration"] == 11
    assert body["generate_audio"] is True
    assert body["watermark"] is False


def test_official_sample_content_items():
    _, body = load_sample_body()
    content = body["content"]
    assert isinstance(content, list)
    assert content[0]["type"] == "text"
    assert isinstance(content[0]["text"], str)
    image_items = [item for item in content if item["type"] == "image_url"]
    assert image_items
    for item in image_items:
        assert item["image_url"]["url"].startswith("https://")
        assert item["role"] == "reference_image"
    assert any(item["type"] == "video_url" and item["role"] == "reference_video" for item in content)
    assert any(item["type"] == "audio_url" and item["role"] == "reference_audio" for item in content)


def test_builder_matches_official_image_url_shape():
    content = common.build_content(
        "Prompt",
        "https://example.com/image-1.jpg",
        None,
        reference_image_urls=["https://example.com/image-2.jpg"],
        reference_video_urls=["https://example.com/video-1.mp4"],
        reference_audio_urls=["https://example.com/audio-1.wav"],
    )
    assert content[1] == {
        "type": "image_url",
        "image_url": {"url": "https://example.com/image-1.jpg"},
        "role": "reference_image",
    }
    assert content[2]["role"] == "reference_image"
    assert content[3]["role"] == "reference_video"
    assert content[4]["role"] == "reference_audio"
