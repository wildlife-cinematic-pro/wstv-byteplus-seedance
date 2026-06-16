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


def test_request_construction_uses_official_content_schema(monkeypatch):
    monkeypatch.setattr(common, "validate_public_image_url", lambda *args, **kwargs: {"content_type": "image/jpeg"})
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


def test_verified_model_allows_controlled_capture_schema_gate():
    config = common.load_config(require_key=False)
    assert config.model.model_id == "dreamina-seedance-2-0-260128"
    assert config.model.supports_submit is True
    common.require_verified_schema(config)


def test_fast_model_remains_blocked_for_submit():
    config = common.load_config(require_key=False)
    fast = config.models["dreamina-seedance-2-0-fast-260128"]
    patched = config.__class__(**{**config.__dict__, "model_id": fast.model_id})
    with pytest.raises(common.SchemaBlockedError, match="model is not enabled"):
        common.require_verified_schema(patched)


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


def test_captured_create_response_verifies_task_id_field():
    response = json.loads((Path(__file__).parent / "fixtures" / "create_task_response.captured.redacted.json").read_text())
    assert common.extract_task_id(response) == "cgt-20260616094522-nflv7"
    parsed = common.parse_task_response(response)
    assert parsed["id"] == "cgt-20260616094522-nflv7"
    assert common.collect_task_id_candidates(response) == [
        {"path": "$.id", "field": "id", "value": "cgt-20260616094522-nflv7"}
    ]


def test_verified_response_task_id_field_from_schema():
    config = common.load_config(require_key=False)
    assert common.verified_response_task_id_field(config) == {"field": "id", "json_path": "$.id"}


def test_task_id_validation_rejects_non_cgt_id():
    with pytest.raises(common.ConfigError):
        common.validate_task_id("task-1")


def test_collect_task_id_candidates():
    candidates = common.collect_task_id_candidates({"data": {"task_id": "task_redacted_123"}})
    assert candidates == [{"path": "$.data.task_id", "field": "task_id", "value": "task_redacted_123"}]


def test_save_create_response_capture(tmp_path):
    config = common.load_config(require_key=False)
    patched = config.__class__(**{**config.__dict__, "outputs_dir": tmp_path / "outputs"})
    response = json.loads((Path(__file__).parent / "fixtures" / "create_task_response.redacted.json").read_text())
    path = common.save_create_response_capture(
        patched,
        local_request_id="local-test",
        fingerprint="fp-test",
        payload={"model": "dreamina-seedance-2-0-260128", "content": [{"type": "text", "text": "prompt"}]},
        cost={"status": "ESTIMATED", "estimated_cost_usd": 1.23},
        response=response,
    )
    saved = json.loads(path.read_text())
    assert saved["model"] == "dreamina-seedance-2-0-260128"
    assert saved["task_id_field_candidates"][0]["field"] == "id"
    assert saved["no_auto_poll_or_download"] is True


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


def test_default_video_output_dir_is_mac_movies_folder(monkeypatch):
    monkeypatch.delenv("WSTV_VIDEO_OUTPUT_DIR", raising=False)
    config = common.load_config(require_key=False)
    assert config.downloads_dir == Path("/Users/acharyabimal/Movies/WSTV/SeedanceVideos")


def test_video_output_dir_can_be_overridden(monkeypatch, tmp_path):
    monkeypatch.setenv("WSTV_VIDEO_OUTPUT_DIR", str(tmp_path / "videos"))
    config = common.load_config(require_key=False)
    assert config.downloads_dir == tmp_path / "videos"
