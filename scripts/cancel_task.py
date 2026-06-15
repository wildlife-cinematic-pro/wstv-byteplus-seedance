#!/usr/bin/env python3
"""Cancel a queued task or delete a terminal task record using the official DELETE API."""

from __future__ import annotations

import argparse
import json
import sys

from common import ConfigError, build_url, load_config, redact_json, request_json


CONFIRM = "DELETE_OR_CANCEL_EXISTING_TASK"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Cancel/delete an existing BytePlus video task.")
    parser.add_argument("task_id", help="Existing BytePlus task ID.")
    parser.add_argument("--confirm", required=True, help=f"Must equal {CONFIRM}.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        if args.confirm != CONFIRM:
            raise ConfigError(f"--confirm must equal {CONFIRM}.")
        config = load_config(require_key=True)
        url = build_url(config, config.cancel_path, id=args.task_id)
        data = request_json("DELETE", url, config.api_key or "", config.timeout_seconds)
        print("DELETE request completed for existing task.")
        print("Official docs: queued tasks become cancelled; succeeded/failed/expired records are deleted.")
        print(json.dumps(redact_json(data), indent=2, ensure_ascii=False))
        return 0
    except (ConfigError, RuntimeError) as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
