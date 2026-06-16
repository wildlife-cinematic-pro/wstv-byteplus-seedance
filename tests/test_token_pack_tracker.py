import datetime as dt
import subprocess

import common
import cost_tracker
import token_pack_tracker
import wstv_server


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


def _pack_entry():
    return token_pack_tracker.build_pack_entry(
        model="Dreamina-Seedance-2.0",
        package_size="1M",
        quantity=7,
        total_price_usd=30.10,
        purchase_date=dt.date.today().isoformat(),
        validity_days=90,
        note="7M BytePlus Console pack",
    )


def _usage(filename):
    return cost_tracker.manual_usage_entry(
        date="2026-06-16",
        filename=filename,
        model="Dreamina-Seedance-2.0",
        resolution="720p",
        tokens=324_900,
        token_source="actual_from_console",
        note="Console usage",
    )


def test_adding_1m_x7_pack_saves_to_local_pack_ledger(tmp_path):
    config = _config(tmp_path)
    entry = _pack_entry()

    assert token_pack_tracker.append_pack_entry(config, entry) is True
    rows = token_pack_tracker.read_pack_ledger(config)

    assert rows[0]["package_size"] == "1M"
    assert rows[0]["quantity"] == 7
    assert rows[0]["total_purchased_tokens"] == 7_000_000
    assert rows[0]["effective_rate_usd_per_million"] == 4.3
    assert config.token_pack_ledger_path.exists()


def test_duplicate_token_pack_entries_are_blocked(tmp_path):
    config = _config(tmp_path)
    entry = _pack_entry()

    assert token_pack_tracker.append_pack_entry(config, entry) is True
    assert token_pack_tracker.append_pack_entry(config, entry) is False
    assert len(token_pack_tracker.read_pack_ledger(config)) == 1


def test_no_active_pack_returns_clear_warning(tmp_path):
    config = _config(tmp_path)

    summary = token_pack_tracker.token_pack_summary(config, resolution="720p", usage_entries=[])

    assert summary["pack_summary"] is None
    assert summary["can_cover_next_video"] is False
    assert "No active token pack recorded." in summary["warnings"]
    assert "Add token resource pack to track remaining videos." in summary["warnings"]


def test_two_usage_entries_total_and_remaining_counts(tmp_path):
    config = _config(tmp_path)
    assert token_pack_tracker.append_pack_entry(config, _pack_entry()) is True
    entries = [_usage("elephant-mud-test.mp4"), _usage("sea-lion-test-001.mp4")]

    summary_720 = token_pack_tracker.token_pack_summary(config, resolution="720p", usage_entries=entries)
    summary_1080 = token_pack_tracker.token_pack_summary(config, resolution="1080p", usage_entries=entries)

    assert summary_720["usage_summary"]["total_used_tokens"] == 649_800
    assert summary_720["usage_summary"]["remaining_tokens"] == 6_350_200
    assert summary_720["token_pack_tracker"]["remaining_videos_possible"] == 19
    assert summary_1080["token_pack_tracker"]["remaining_videos_possible"] == 7


def test_resolution_presets_and_payg_costs():
    preset_720 = token_pack_tracker.resolution_preset("720p")
    preset_1080 = token_pack_tracker.resolution_preset("1080p")

    assert preset_720["projected_tokens"] == 324_000
    assert preset_720["payg_cost_usd"] == 2.2680
    assert token_pack_tracker.cost_usd(324_000, 7.0) == 2.2680
    assert preset_1080["projected_tokens"] == 801_900
    assert preset_1080["payg_cost_usd"] == 5.6133
    assert token_pack_tracker.cost_usd(801_900, 7.0) == 5.6133


def test_server_add_token_pack_endpoint_and_resolution_switch(monkeypatch, tmp_path):
    config = _config(tmp_path)
    monkeypatch.setattr(wstv_server, "load_config", lambda require_key=False: config)

    result = wstv_server.add_token_pack(
        {
            "model": "Dreamina-Seedance-2.0",
            "package_size": "1M",
            "quantity": 7,
            "total_price_usd": 30.10,
            "purchase_date": dt.date.today().isoformat(),
            "validity_days": 90,
            "note": "manual Console pack",
            "confirm": token_pack_tracker.ADD_TOKEN_PACK_CONFIRMATION,
            "resolution": "720p",
        }
    )
    summary_720 = wstv_server.token_pack_summary("720p")
    summary_1080 = wstv_server.token_pack_summary("1080p")

    assert result["recorded"] is True
    assert summary_720["dry_run_estimate"]["projected_tokens"] == 324_000
    assert summary_1080["dry_run_estimate"]["projected_tokens"] == 801_900


def test_token_pack_ledger_is_gitignored():
    check = subprocess.run(
        ["git", "check-ignore", "data/wstv_token_packs.jsonl"],
        text=True,
        capture_output=True,
        check=False,
    )
    assert check.returncode == 0
