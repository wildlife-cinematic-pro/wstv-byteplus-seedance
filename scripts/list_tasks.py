#!/usr/bin/env python3
"""List recent BytePlus ModelArk video tasks with safe redaction."""

from __future__ import annotations

import argparse
import json
import sys

from common import ConfigError, build_url, load_config, redact_json, request_json


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="List recent WSTV BytePlus Seedance tasks.")
    parser.add_argument("--page-num", type=int, default=1)
    parser.add_argument("--page-size", type=int, default=10)
    parser.add_argument("--status", choices=["queued", "running", "cancelled", "succeeded", "failed", "expired"])
    parser.add_argument("--model", help="Filter by model or endpoint ID.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        config = load_config(require_key=True)
        url = build_url(config, config.list_path)
        params: dict[str, object] = {"page_num": args.page_num, "page_size": args.page_size}
        if args.status:
            params["filter.status"] = args.status
        if args.model:
            params["filter.model"] = args.model
        data = request_json("GET", url, config.api_key or "", config.timeout_seconds, params=params)
        print(json.dumps(redact_json(data), indent=2, ensure_ascii=False))
        return 0
    except (ConfigError, RuntimeError) as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
