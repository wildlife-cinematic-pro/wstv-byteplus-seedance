import json
import subprocess
import datetime as dt
from pathlib import Path

import common
import cost_tracker
import token_pack_tracker


TASK_ID = "cgt-20260616100710-pj5td"


def _config(tmp_path):
    config = common.load_config(require_key=False)
    return config.__class__(
        **{
            **config.__dict__,
            "cost_ledger_path": tmp_path / "data" / "wstv_cost_ledger.jsonl",
            "token_pack_ledger_path": tmp_path / "data" / "wstv_token_packs.jsonl",
            "budget_settings_path": tmp_path / "data" / "wstv_budget_settings.json",
            "downloads_dir": tmp_path / "videos",
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


def test_720p_pack_preset_calculation():
    preset = cost_tracker.resolution_preset("720p")
    assert preset["projected_tokens"] == 324_000
    assert cost_tracker.cost_usd(preset["projected_tokens"], 7.0) == 2.2680
    assert cost_tracker.cost_usd(preset["projected_tokens"], 4.30) == 1.3932


def test_1080p_pack_preset_uses_observed_byteplus_ui_tokens():
    preset = cost_tracker.resolution_preset("1080p")
    assert preset["projected_tokens"] == 801_900
    assert cost_tracker.cost_usd(preset["projected_tokens"], 7.0) == 5.6133
    assert cost_tracker.cost_usd(preset["projected_tokens"], 4.30) == 3.4482


def test_7m_pack_video_counts_by_resolution(tmp_path):
    config = _config(tmp_path)
    _add_7m_pack(config)
    summary_720 = token_pack_tracker.token_pack_summary(config, resolution="720p", usage_entries=[])
    summary_1080 = token_pack_tracker.token_pack_summary(config, resolution="1080p", usage_entries=[])
    assert summary_720["token_pack_tracker"]["comparison"][0]["total_videos_possible"] == 21
    assert summary_1080["token_pack_tracker"]["comparison"][1]["total_videos_possible"] == 8


def test_7m_pack_remaining_counts_after_two_720p_console_videos(tmp_path):
    config = _config(tmp_path)
    _add_7m_pack(config)
    used_tokens = 649_800
    entries = [
        cost_tracker.manual_usage_entry(
            date="2026-06-16",
            filename=f"video-{index}.mp4",
            model="Dreamina-Seedance-2.0",
            resolution="720p",
            tokens=324_900,
            token_source="actual_from_console",
            note="Console usage",
        )
        for index in (1, 2)
    ]
    assert sum(entry["token_count"] for entry in entries) == used_tokens
    summary_720 = token_pack_tracker.token_pack_summary(config, resolution="720p", usage_entries=entries)
    summary_1080 = token_pack_tracker.token_pack_summary(config, resolution="1080p", usage_entries=entries)
    assert summary_720["usage_summary"]["remaining_tokens"] == 6_350_200
    assert summary_720["token_pack_tracker"]["remaining_videos_possible"] == 19
    assert summary_1080["token_pack_tracker"]["remaining_videos_possible"] == 7


def test_7m_pack_remaining_counts_after_one_720p_console_video(tmp_path):
    config = _config(tmp_path)
    _add_7m_pack(config)
    entries = [
        cost_tracker.manual_usage_entry(
            date="2026-06-16",
            filename="video-1.mp4",
            model="Dreamina-Seedance-2.0",
            resolution="720p",
            tokens=324_900,
            token_source="actual_from_console",
            note="Console usage",
        )
    ]
    summary_720 = token_pack_tracker.token_pack_summary(config, resolution="720p", usage_entries=entries)
    summary_1080 = token_pack_tracker.token_pack_summary(config, resolution="1080p", usage_entries=entries)
    assert summary_720["usage_summary"]["remaining_tokens"] == 6_675_100
    assert summary_720["token_pack_tracker"]["remaining_videos_possible"] == 20
    assert summary_1080["token_pack_tracker"]["remaining_videos_possible"] == 8


def test_manual_usage_entry_can_add_second_video_safely(tmp_path):
    config = _config(tmp_path)
    _add_7m_pack(config)
    first = cost_tracker.manual_usage_entry(
        date="2026-06-16",
        filename="first.mp4",
        model="Dreamina-Seedance-2.0",
        resolution="720p",
        tokens=324_900,
        token_source="actual_from_console",
        note="first Console usage",
    )
    second = cost_tracker.manual_usage_entry(
        date="2026-06-16",
        filename="second.mp4",
        model="Dreamina-Seedance-2.0",
        resolution="720p",
        tokens=324_900,
        token_source="actual_from_console",
        note="second BytePlus Console usage entry",
    )
    assert cost_tracker.append_ledger_entry(config, first) is True
    assert cost_tracker.append_ledger_entry(config, second) is True
    summary = cost_tracker.budget_summary(config, resolution="720p")
    assert summary["usage_summary"]["videos_recorded"] == 2
    assert summary["usage_summary"]["total_used_tokens"] == 649_800
    assert summary["usage_summary"]["remaining_tokens"] == 6_350_200
    assert summary["token_pack_tracker"]["remaining_videos_possible"] == 19


def test_duplicate_manual_usage_is_blocked(tmp_path):
    config = _config(tmp_path)
    entry = cost_tracker.manual_usage_entry(
        date="2026-06-16",
        filename="duplicate.mp4",
        model="Dreamina-Seedance-2.0",
        resolution="720p",
        tokens=324_900,
        token_source="actual_from_console",
        note="Console usage",
    )
    assert cost_tracker.append_ledger_entry(config, entry) is True
    assert cost_tracker.append_ledger_entry(config, entry) is False


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
    _add_7m_pack(config)
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
    assert summary["usage_summary"]["total_used_tokens"] == 649_800
    assert summary["token_pack_tracker"]["remaining_tokens"] == 6_350_200


def test_budget_summary_warns_when_only_one_video_is_recorded(tmp_path):
    config = _config(tmp_path)
    _add_7m_pack(config)
    assert cost_tracker.append_ledger_entry(
        config,
        cost_tracker.manual_usage_entry(
            date="2026-06-16",
            filename="only-one.mp4",
            model="Dreamina-Seedance-2.0",
            resolution="720p",
            tokens=324_900,
            token_source="actual_from_console",
            note="Console usage",
        ),
    )
    summary = cost_tracker.budget_summary(config, resolution="720p")
    assert "Only 1 paid video is recorded locally" in " ".join(summary["warnings"])
    assert summary["blocking_warnings"] == []


def test_failed_estimated_attempt_does_not_count_as_pack_usage(tmp_path):
    config = _config(tmp_path)
    _add_7m_pack(config)
    entry = cost_tracker.ledger_entry(
        config=config,
        payload=_payload(),
        estimated_cost=_estimate(config),
        response={"id": TASK_ID},
        status="failed",
        output_path=tmp_path / "videos" / "failed.mp4",
    )
    assert cost_tracker.append_ledger_entry(config, entry) is True
    summary = cost_tracker.budget_summary(config, resolution="720p")
    assert summary["failed_paid_attempts"] == 1
    assert summary["usage_summary"]["videos_recorded"] == 0
    assert summary["usage_summary"]["total_used_tokens"] == 0


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
    assert "data/wstv_token_packs.jsonl" not in files
    assert not any(path.endswith(".mp4") for path in files)
