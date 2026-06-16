#!/usr/bin/env python3
"""Check or bounded-poll one existing BytePlus ModelArk video task."""

from __future__ import annotations

import argparse
import sys
import time

from common import (
    ConfigError,
    FAILURE_STATUSES,
    SUCCESS_STATUSES,
    TERMINAL_STATUSES,
    append_jsonl,
    build_url,
    load_config,
    parse_task_response,
    redact_json,
    request_json,
    safe_url_for_logs,
    save_sanitized_response,
    utc_now,
    validate_task_id,
    verified_response_task_id_field,
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Check an existing WSTV BytePlus Seedance task.")
    parser.add_argument("task_id", help="Existing BytePlus task ID.")
    parser.add_argument("--poll", action="store_true", help="Poll until terminal status or timeout.")
    parser.add_argument("--interval", type=int, default=10, help="Polling interval seconds. Default: 10.")
    parser.add_argument("--timeout", type=int, default=900, help="Polling timeout seconds. Default: 900.")
    return parser.parse_args()


def fetch_once(task_id: str):
    task_id = validate_task_id(task_id)
    config = load_config(require_key=True)
    verified_response_task_id_field(config)
    if config.used_deprecated_key:
        print("Warning: BYTEPLUS_API_KEY fallback is deprecated. Use ARK_API_KEY.", file=sys.stderr)
    url = build_url(config, config.retrieve_path, id=task_id)
    data = request_json("GET", url, config.api_key or "", config.timeout_seconds)
    parsed = parse_task_response(data)
    save_sanitized_response(config, task_id, data)
    append_jsonl(
        config.task_log_path,
        {
            "local_request_id": None,
            "request_fingerprint": None,
            "created_at": utc_now(),
            "model": data.get("model"),
            "safe_input_identifier": None,
            "task_id": task_id,
            "status": parsed["status"],
            "estimated_cost": None,
            "actual_usage": parsed.get("usage"),
            "downloaded_output_path": None,
            "error_category": parsed.get("error", {}).get("code") if isinstance(parsed.get("error"), dict) else None,
        },
    )
    return parsed


def print_status(parsed: dict) -> None:
    status = parsed["status"]
    print(f"Status: {status}")
    if status not in TERMINAL_STATUSES and status not in {"queued", "running"}:
        print("Warning: unknown status. Treating as non-terminal and unsafe to infer success.")
    if parsed.get("usage"):
        print(f"Usage: {redact_json(parsed['usage'])}")
    if parsed.get("video_url"):
        print(f"Output URL: {safe_url_for_logs(parsed['video_url'])}")
        print("Note: signed output URLs are redacted in logs and expire/delete after 24 hours per docs.")
    if parsed.get("error"):
        print(f"Error: {redact_json(parsed['error'])}")


def main() -> int:
    args = parse_args()
    try:
        args.task_id = validate_task_id(args.task_id)
        started = time.monotonic()
        while True:
            parsed = fetch_once(args.task_id)
            print_status(parsed)
            status = parsed["status"]
            if not args.poll or status in TERMINAL_STATUSES:
                return 0 if status in SUCCESS_STATUSES or not args.poll else 1 if status in FAILURE_STATUSES else 0
            if time.monotonic() - started >= args.timeout:
                print(f"Timed out after {args.timeout}s without terminal status.", file=sys.stderr)
                return 2
            time.sleep(max(1, args.interval))
    except (ConfigError, RuntimeError) as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
