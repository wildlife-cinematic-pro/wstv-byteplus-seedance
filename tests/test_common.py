import argparse
import json
from pathlib import Path

import pytest

import common


def test_base_url_validation_rejects_old_host():
    with pytest.raises(common.ConfigError):
        old_host_url = "https://ark.ap-southeast." + "byteplus.com/api/v3"
        common.validate_base_url(old_host_url)


def test_secret_redaction_removes_bearer_and_signed_query():
    data = {
        "Authorization": "Bearer test-secret-token",
        "content": {"video_url": "https://example.com/out.mp4?X-Amz-Signature=secret"},
    }
    redacted = common.redact_json(data)
    assert redacted["Authorization"] == "[REDACTED]"
    assert redacted["content"]["video_url"] == "https://example.com/out.mp4?..."


def test_request_construction_uses_official_content_schema():
    config = common.load_config(require_key=False)
    args = argparse.Namespace(
        prompt="A clean wildlife video",
        prompt_file=None,
        image_url="https://example.com/eagle.jpg",
        image_path=None,
        image_role="reference_image",
        reference_image_url=None,
        reference_video_url=None,
        reference_audio_url=None,
        duration=15,
        ratio="9:16",
        resolution="720p",
        generate_audio=False,
        watermark=False,
        seed=None,
        frames=None,
        execution_expires_after=None,
        safety_identifier=None,
    )
    payload = common.build_create_payload(args, config)
    assert payload["model"] == "dreamina-seedance-2-0-260128"
    assert payload["content"][0]["type"] == "text"
    assert payload["content"][1]["type"] == "image_url"
    assert payload["content"][1]["role"] == "reference_image"
    assert "input_image" not in payload


def test_submission_schema_gate_blocks_without_verified_fixture(tmp_path):
    config = common.load_config(require_key=False)
    blocked = config.__class__(**{**config.__dict__, "schema_sample_path": tmp_path / "missing.json"})
    with pytest.raises(common.SchemaBlockedError):
        common.require_verified_schema(blocked)


def test_duplicate_blocking_reads_jsonl(tmp_path):
    config = common.load_config(require_key=False)
    task_log = tmp_path / "tasks.jsonl"
    patched = config.__class__(**{**config.__dict__, "task_log_path": task_log})
    fp = "abc123"
    common.append_jsonl(task_log, {"request_fingerprint": fp, "created_at": common.utc_now(), "status": "queued"})
    assert common.find_duplicate_submission(patched, fp) is not None


def test_task_response_unknown_status_is_preserved():
    parsed = common.parse_task_response({"id": "task-1", "status": "mystery", "content": {}})
    assert parsed["status"] == "mystery"
    assert parsed["video_url"] is None


def test_cost_estimate_model_specific():
    config = common.load_config(require_key=False)
    estimate = common.estimate_cost_usd(config, "720p", "9:16", 15)
    assert estimate["status"] == "ESTIMATED"
    assert estimate["rate_usd_per_million_tokens"] == 7.0
    assert estimate["estimated_cost_usd"] > 0


def test_malformed_json_raises(tmp_path):
    path = tmp_path / "bad.json"
    path.write_text("{bad", encoding="utf-8")
    with pytest.raises(common.ConfigError):
        common.read_json(path)


def test_missing_key_behavior(monkeypatch):
    monkeypatch.delenv("ARK_API_KEY", raising=False)
    monkeypatch.delenv("BYTEPLUS_API_KEY", raising=False)
    with pytest.raises(common.ConfigError):
        common.load_config(require_key=True)
