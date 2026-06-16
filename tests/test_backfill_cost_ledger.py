from pathlib import Path

import backfill_cost_ledger
import common


def _config(tmp_path):
    config = common.load_config(require_key=False)
    return config.__class__(
        **{
            **config.__dict__,
            "cost_ledger_path": tmp_path / "data" / "wstv_cost_ledger.jsonl",
            "budget_settings_path": tmp_path / "data" / "wstv_budget_settings.json",
        }
    )


def _args():
    return [
        "--output-filename",
        "elephant-mud-test.mp4",
        "--confirm",
        backfill_cost_ledger.CONFIRM_BACKFILL,
    ]


def test_manual_backfill_appends_one_entry(monkeypatch, tmp_path, capsys):
    config = _config(tmp_path)
    monkeypatch.setattr(backfill_cost_ledger, "load_config", lambda require_key=False: config)

    assert backfill_cost_ledger.main(_args()) == 0

    rows = common.read_jsonl(config.cost_ledger_path)
    assert len(rows) == 1
    assert rows[0]["entry_type"] == "manual_usage"
    assert rows[0]["output_filename"] == "elephant-mud-test.mp4"
    assert rows[0]["resolution"] == "720p"
    assert rows[0]["token_source"] == "actual_from_console"
    assert "No BytePlus API request was made." in capsys.readouterr().out


def test_duplicate_manual_backfill_is_blocked(monkeypatch, tmp_path, capsys):
    config = _config(tmp_path)
    monkeypatch.setattr(backfill_cost_ledger, "load_config", lambda require_key=False: config)

    assert backfill_cost_ledger.main(_args()) == 0
    assert backfill_cost_ledger.main(_args()) == 0

    rows = common.read_jsonl(config.cost_ledger_path)
    assert len(rows) == 1
    assert "Already recorded in cost ledger." in capsys.readouterr().out


def test_backfill_cost_formula_for_verified_previous_video():
    entry = backfill_cost_ledger.build_entry(
        backfill_cost_ledger.parse_args(_args())
    )
    assert entry["token_count"] == 324900
    assert entry["rate_usd_per_million_tokens"] == 7.0
    assert entry["calculated_cost_usd"] == 2.2743


def test_manual_backfill_can_record_second_video_with_custom_filename():
    entry = backfill_cost_ledger.build_entry(
        backfill_cost_ledger.parse_args(
            _args()
            + [
                "--output-filename",
                "sea-lion-second.mp4",
                "--tokens",
                "324900",
                "--resolution",
                "720p",
                "--note",
                "second BytePlus Console usage entry",
            ]
        )
    )
    assert entry["output_filename"] == "sea-lion-second.mp4"
    assert entry["token_count"] == 324900
    assert entry["source_note"] == "second BytePlus Console usage entry"


def test_manual_backfill_does_not_make_paid_api_request(monkeypatch, tmp_path):
    config = _config(tmp_path)
    monkeypatch.setattr(backfill_cost_ledger, "load_config", lambda require_key=False: config)

    def forbidden(*args, **kwargs):
        raise AssertionError("network request should not be called")

    monkeypatch.setattr(common, "request_json", forbidden)

    assert backfill_cost_ledger.main(_args()) == 0


def test_backfill_rejects_mismatched_filename():
    args = backfill_cost_ledger.parse_args(
        _args()
        + [
            "--output-filename",
            "wrong.mp4",
            "--output-path",
            "/Users/acharyabimal/Movies/WSTV/SeedanceVideos/elephant-mud-test.mp4",
        ]
    )
    try:
        backfill_cost_ledger.build_entry(args)
    except common.ConfigError as exc:
        assert "basename" in str(exc)
    else:
        raise AssertionError("expected ConfigError")
