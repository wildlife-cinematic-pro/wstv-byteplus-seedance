import argparse

import pytest

import common
import generate_video


def test_cli_defaults_match_wstv_production_defaults():
    args = generate_video.parse_args([])
    assert args.duration == 15
    assert args.ratio == "9:16"
    assert args.generate_audio is True
    assert args.watermark is False


def _args(**overrides):
    base = {
        "submit": False,
        "max_cost_usd": None,
        "confirm": None,
        "capture_create_response": False,
        "allow_duplicate": False,
    }
    base.update(overrides)
    return argparse.Namespace(**base)


def _submit_ready_config(tmp_path):
    config = common.load_config(require_key=False)
    return config.__class__(
        **{
            **config.__dict__,
            "api_key": "test-key",
            "api_key_source": "ARK_API_KEY",
            "task_log_path": tmp_path / "tasks.jsonl",
        }
    )


def test_guard_submit_dry_run_allows_no_network(monkeypatch):
    called = False

    def fake_request(*args, **kwargs):
        nonlocal called
        called = True

    monkeypatch.setattr(generate_video, "request_json", fake_request)
    config = common.load_config(require_key=False)
    generate_video.guard_submit(_args(submit=False), config, {}, {"estimated_cost_usd": 1}, "fp")
    assert called is False


def test_submit_allowed_only_when_all_required_gates_present(tmp_path):
    config = _submit_ready_config(tmp_path)
    generate_video.guard_submit(
        _args(
            submit=True,
            max_cost_usd=2.0,
            confirm=generate_video.CONFIRMATION_TOKEN,
            capture_create_response=True,
        ),
        config,
        {},
        {"estimated_cost_usd": 1.0},
        "fp",
    )


def test_submit_requires_max_cost(tmp_path):
    config = _submit_ready_config(tmp_path)
    with pytest.raises(common.ConfigError, match="max-cost-usd"):
        generate_video.guard_submit(_args(submit=True), config, {}, {"estimated_cost_usd": 1}, "fp")


def test_submit_rejects_cost_above_limit(tmp_path):
    submit_ready = _submit_ready_config(tmp_path)
    with pytest.raises(common.ConfigError, match="exceeds"):
        generate_video.guard_submit(
            _args(
                submit=True,
                max_cost_usd=1.0,
                confirm=generate_video.CONFIRMATION_TOKEN,
                capture_create_response=True,
            ),
            submit_ready,
            {},
            {"estimated_cost_usd": 2.0},
            "fp",
        )


def test_submit_requires_confirmation_token(tmp_path):
    submit_ready = _submit_ready_config(tmp_path)
    with pytest.raises(common.ConfigError, match="confirm"):
        generate_video.guard_submit(
            _args(submit=True, max_cost_usd=2.0, confirm="wrong-token", capture_create_response=True),
            submit_ready,
            {},
            {"estimated_cost_usd": 1.0},
            "fp",
        )


def test_submit_requires_capture_response_flag(tmp_path):
    submit_ready = _submit_ready_config(tmp_path)
    with pytest.raises(common.ConfigError, match="capture-create-response"):
        generate_video.guard_submit(
            _args(submit=True, max_cost_usd=2.0, confirm=generate_video.CONFIRMATION_TOKEN),
            submit_ready,
            {},
            {"estimated_cost_usd": 1.0},
            "fp",
        )


def test_submit_keeps_duplicate_blocking_enabled(tmp_path):
    submit_ready = _submit_ready_config(tmp_path)
    common.append_jsonl(
        submit_ready.task_log_path,
        {"request_fingerprint": "fp", "created_at": common.utc_now(), "status": "submitted"},
    )
    with pytest.raises(common.ConfigError, match="Duplicate"):
        generate_video.guard_submit(
            _args(
                submit=True,
                max_cost_usd=2.0,
                confirm=generate_video.CONFIRMATION_TOKEN,
                capture_create_response=True,
            ),
            submit_ready,
            {},
            {"estimated_cost_usd": 1.0},
            "fp",
        )
