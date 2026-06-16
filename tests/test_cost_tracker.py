import json
import subprocess
from pathlib import Path

import common
import cost_tracker


TASK_ID = "cgt-20260616100710-pj5td"


def _config(tmp_path):
    config = common.load_config(require_key=False)
    return config.__class__(
        **{
            **config.__dict__,
            "cost_ledger_path": tmp_path / "data" / "wstv_cost_ledger.jsonl",
            "budget_settings_path": tmp_path / "data" / "wstv_budget_settings.json",
            "downloads_dir": tmp_path / "videos",
        }
    )


def _payload():
    return {
        "model": "dreamina-seedance-2-0-260128",
        "duration": 15,
        "resolution": "720p",
        "ratio": "9:16",
        "generate_audio": True,
        "content": [
            {"type": "text", "text": "safe prompt"},
            {
                "type": "image_url",
                "role": "reference_image",
                "image_url": {"url": "https://images.wildstoriestv.com/elephant.png"},
            },
        ],
    }


def _estimate(config):
    return common.estimate_cost_usd(config, "720p", "9:16", 15)


def test_cost_formula_calculation():
    assert cost_tracker.cost_usd(324_900, 7.0) == 2.2743


def test_actual_tokens_produce_actual_cost(tmp_path):
    config = _config(tmp_path)
    entry = cost_tracker.ledger_entry(
        config=config,
        payload=_payload(),
        estimated_cost=_estimate(config),
        response={"id": TASK_ID, "usage": {"completion_tokens": 324_900}},
        status="ok",
        output_path=tmp_path / "videos" / "elephant.mp4",
        task_id=TASK_ID,
    )
    assert entry["token_source"] == "actual"
    assert entry["token_count"] == 324_900
    assert entry["calculated_cost_usd"] == 2.2743


def test_estimated_tokens_are_labeled_estimated(tmp_path):
    config = _config(tmp_path)
    entry = cost_tracker.ledger_entry(
        config=config,
        payload=_payload(),
        estimated_cost=_estimate(config),
        response={"id": TASK_ID},
        status="ok",
        output_path=tmp_path / "videos" / "elephant.mp4",
        task_id=TASK_ID,
    )
    assert entry["token_source"] == "estimated"
    assert entry["token_count"] == _estimate(config)["estimated_tokens"]


def test_append_ledger_blocks_duplicate(tmp_path):
    config = _config(tmp_path)
    entry = cost_tracker.ledger_entry(
        config=config,
        payload=_payload(),
        estimated_cost=_estimate(config),
        response={"id": TASK_ID, "usage": {"completion_tokens": 324_900}},
        status="ok",
        output_path=tmp_path / "videos" / "elephant.mp4",
        task_id=TASK_ID,
    )
    assert cost_tracker.append_ledger_entry(config, entry) is True
    assert cost_tracker.append_ledger_entry(config, entry) is False
    assert len(common.read_jsonl(config.cost_ledger_path)) == 1


def test_budget_summary_calculates_counts_and_remaining(tmp_path):
    config = _config(tmp_path)
    for filename, tokens, status in (("one.mp4", 324_900, "ok"), ("two.mp4", 324_900, "failed")):
        entry = cost_tracker.ledger_entry(
            config=config,
            payload=_payload(),
            estimated_cost=_estimate(config),
            response={"id": TASK_ID + filename[:1], "usage": {"completion_tokens": tokens}},
            status=status,
            output_path=tmp_path / "videos" / filename,
        )
        assert cost_tracker.append_ledger_entry(config, entry) is True
    summary = cost_tracker.budget_summary(config, budget_settings={"total_budget_usd": 10})
    assert summary["paid_videos_generated"] == 2
    assert summary["successful_paid_videos"] == 1
    assert summary["failed_paid_attempts"] == 1
    assert summary["total_spent_usd"] == 4.5486
    assert summary["remaining_budget_usd"] == 5.4514
    assert summary["average_cost_per_successful_video"] == 2.2743
    assert summary["estimated_more_videos_possible"] == 2


def test_path_and_signed_url_are_not_stored_in_ledger(tmp_path):
    config = _config(tmp_path)
    signed_url = "https://ark-" + "acg.example/out.mp4?secret=yes"
    entry = cost_tracker.ledger_entry(
        config=config,
        payload=_payload(),
        estimated_cost=_estimate(config),
        response={"id": TASK_ID, "content": {"video_url": signed_url}},
        status="ok",
        output_path=tmp_path / "videos" / "elephant.mp4",
        task_id=TASK_ID,
    )
    assert "video_url" not in json.dumps(entry)
    assert "secret=yes" not in json.dumps(entry)
    assert entry["image_url_host"] == "images.wildstoriestv.com"


def test_no_paid_byteplus_request_in_cost_tests():
    files = subprocess.check_output(["git", "ls-files"], text=True).splitlines()
    assert "data/wstv_cost_ledger.jsonl" not in files
    assert not any(path.endswith(".mp4") for path in files)
