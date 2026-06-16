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
    parser.add_argument("--output-filename", default="elephant-mud-test.mp4")
    parser.add_argument(
        "--output-path",
        default="/Users/acharyabimal/Movies/WSTV/SeedanceVideos/elephant-mud-test.mp4",
    )
    parser.add_argument("--tokens", type=int, default=324900)
    parser.add_argument("--rate-usd-per-million-tokens", type=float, default=7.0)
    parser.add_argument("--source-note", default="BytePlus Console usage screenshot")
    parser.add_argument("--status", default="ok", choices=["ok", "failed", "unknown"])
    parser.add_argument("--confirm", help=f"Required. Must equal {CONFIRM_BACKFILL}.")
    return parser.parse_args(argv)


def build_entry(args: argparse.Namespace) -> dict:
    output_path = Path(args.output_path)
    if output_path.name != args.output_filename:
        raise ConfigError("--output-filename must match the basename of --output-path.")
    if output_path.suffix.lower() != ".mp4":
        raise ConfigError("--output-path must be an .mp4 path.")
    if args.tokens <= 0:
        raise ConfigError("--tokens must be positive.")
    if args.rate_usd_per_million_tokens <= 0:
        raise ConfigError("--rate-usd-per-million-tokens must be positive.")
    return cost_tracker.manual_backfill_entry(
        date=args.date,
        model=args.model,
        output_path=output_path,
        tokens=args.tokens,
        rate_usd_per_million_tokens=args.rate_usd_per_million_tokens,
        source_note=args.source_note,
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
