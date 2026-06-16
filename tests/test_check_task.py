import pytest

import check_task
import common


def test_fetch_once_uses_verified_task_id_and_existing_task_only(monkeypatch, tmp_path):
    config = common.load_config(require_key=False)
    patched = config.__class__(
        **{
            **config.__dict__,
            "api_key": "test-key",
            "api_key_source": "ARK_API_KEY",
            "task_log_path": tmp_path / "tasks.jsonl",
            "raw_response_dir": tmp_path / "raw-responses",
        }
    )
    calls = []

    monkeypatch.setattr(check_task, "load_config", lambda require_key=True: patched)

    def fake_request(method, url, api_key, timeout, **kwargs):
        calls.append((method, url, api_key, timeout, kwargs))
        return {"id": "cgt-20260616094522-nflv7", "status": "queued"}

    monkeypatch.setattr(check_task, "request_json", fake_request)

    parsed = check_task.fetch_once("cgt-20260616094522-nflv7")

    assert parsed["id"] == "cgt-20260616094522-nflv7"
    assert parsed["status"] == "queued"
    assert calls[0][0] == "GET"
    assert calls[0][1].endswith("/contents/generations/tasks/cgt-20260616094522-nflv7")


def test_fetch_once_rejects_malformed_task_id_before_network(monkeypatch):
    called = False

    def fake_request(*args, **kwargs):
        nonlocal called
        called = True

    monkeypatch.setattr(check_task, "request_json", fake_request)

    with pytest.raises(common.ConfigError, match="Task ID"):
        check_task.fetch_once("../bad")

    assert called is False


def test_check_task_parse_args_keeps_polling_bounded(monkeypatch):
    monkeypatch.setattr(
        "sys.argv",
        ["check_task.py", "cgt-20260616094522-nflv7", "--poll", "--interval", "2", "--timeout", "5"],
    )
    args = check_task.parse_args()
    assert args.poll is True
    assert args.interval == 2
    assert args.timeout == 5
