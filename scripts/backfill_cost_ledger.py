#!/usr/bin/env python3
"""Safely backfill a previous paid WSTV Seedance cost ledger entry."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import cost_tracker
from common import ConfigError, load_config


CONFIRM_BACKFILL = "BACKFILL_VERIFIED_CONSOLE_COST"


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Append one verified manual cost ledger backfill entry.")
    parser.add_argument("--date", default="2026-06-16", help="Console usage date in YYYY-MM-DD format.")
    parser.add_argument("--model", default="Dreamina-Seedance-2.0")
    parser.add_argument("--output-filename", required=True, help="Simple MP4 filename to record.")
    parser.add_argument(
        "--output-path",
        help="Optional local MP4 path; only the basename is used for duplicate safety checks.",
    )
    parser.add_argument("--resolution", default="720p", choices=["720p", "1080p"])
    parser.add_argument("--tokens", type=int, default=324900)
    parser.add_argument("--token-source", default="actual_from_console", choices=["actual_from_console", "estimated"])
    parser.add_argument("--rate-usd-per-million-tokens", type=float, default=7.0)
    parser.add_argument("--note", default="BytePlus Console usage entry")
    parser.add_argument("--source-note", help="Deprecated alias for --note.")
    parser.add_argument("--status", default="ok", choices=["ok", "failed", "unknown"])
    parser.add_argument("--confirm", help=f"Required. Must equal {CONFIRM_BACKFILL}.")
    return parser.parse_args(argv)


def build_entry(args: argparse.Namespace) -> dict:
    if args.output_path:
        output_path = Path(args.output_path)
        if output_path.name != args.output_filename:
            raise ConfigError("--output-filename must match the basename of --output-path.")
        if output_path.suffix.lower() != ".mp4":
            raise ConfigError("--output-path must be an .mp4 path.")
    if args.tokens <= 0:
        raise ConfigError("--tokens must be positive.")
    if args.rate_usd_per_million_tokens <= 0:
        raise ConfigError("--rate-usd-per-million-tokens must be positive.")
    return cost_tracker.manual_usage_entry(
        date=args.date,
        filename=args.output_filename,
        model=args.model,
        resolution=args.resolution,
        tokens=args.tokens,
        token_source=args.token_source,
        rate_usd_per_million_tokens=args.rate_usd_per_million_tokens,
        note=args.source_note or args.note,
        status=args.status,
    )


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    try:
        if args.confirm != CONFIRM_BACKFILL:
            raise ConfigError(f"Manual backfill requires --confirm {CONFIRM_BACKFILL}.")
        config = load_config(require_key=False)
        entry = build_entry(args)
        recorded = cost_tracker.append_ledger_entry(config, entry)
        if not recorded:
            print("Already recorded in cost ledger.")
            return 0
        print(f"Backfilled cost ledger: {config.cost_ledger_path}")
        print(f"Cost USD: {entry['calculated_cost_usd']:.4f}")
        print("No BytePlus API request was made.")
        return 0
    except (ConfigError, RuntimeError, OSError) as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
