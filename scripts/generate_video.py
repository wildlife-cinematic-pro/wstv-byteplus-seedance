#!/usr/bin/env python3
"""Build or submit one BytePlus ModelArk Seedance video generation task."""

from __future__ import annotations

import argparse
import json
import sys

from common import (
    AppConfig,
    ConfigError,
    SchemaBlockedError,
    append_jsonl,
    build_create_payload,
    build_url,
    estimate_cost_usd,
    find_duplicate_submission,
    input_identifier,
    load_config,
    new_local_request_id,
    parse_task_response,
    redact_json,
    request_fingerprint,
    request_json,
    require_verified_schema,
    save_create_response_capture,
    save_sanitized_response,
    utc_now,
    write_json,
)


CONFIRMATION_TOKEN = "SUBMIT_ONE_PAID_TASK"


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Dry-run or submit one WSTV Seedance video task.")
    parser.add_argument("--prompt", help="Prompt text.")
    parser.add_argument("--prompt-file", help="Path to a prompt text file.")
    parser.add_argument("--image-url", help="Public URL for the approved master image.")
    parser.add_argument("--image-path", help="Local image path. Blocked until official upload/base64 flow is verified.")
    parser.add_argument("--image-role", default="reference_image", help="Official role for --image-url. Default: reference_image.")
    parser.add_argument("--reference-image-url", action="append", help="Additional official reference image URL. Repeatable.")
    parser.add_argument("--reference-video-url", action="append", help="Official reference video URL. Repeatable.")
    parser.add_argument("--reference-audio-url", action="append", help="Official reference audio URL. Repeatable.")
    parser.add_argument("--duration", type=int, default=15, help="Video duration in seconds. Default: 15.")
    parser.add_argument("--ratio", default="9:16", help="Aspect ratio. Default: 9:16.")
    parser.add_argument("--resolution", default="720p", help="Output resolution. Default: 720p.")
    parser.add_argument("--generate-audio", action=argparse.BooleanOptionalAction, default=True)
    parser.add_argument("--watermark", action=argparse.BooleanOptionalAction, default=False)
    parser.add_argument("--seed", type=int, help="Optional deterministic seed. Omit or use -1 for model-selected randomness.")
    parser.add_argument("--frames", type=int, help="Blocked by this toolkit; use --duration for cost clarity.")
    parser.add_argument("--execution-expires-after", type=int, help="Task expiration seconds, official range 3600-259200.")
    parser.add_argument("--safety-identifier", help="Hashed stable end-user identifier; never pass raw private data.")
    parser.add_argument("--preview-out", help="Where to save the redacted dry-run request preview.")
    parser.add_argument("--submit", action="store_true", help="Actually submit one paid task. Default is dry-run only.")
    parser.add_argument("--max-cost-usd", type=float, help="Required with --submit. Blocks submission above this estimate.")
    parser.add_argument("--confirm", help=f"Required with --submit. Must equal {CONFIRMATION_TOKEN}.")
    parser.add_argument(
        "--capture-create-response",
        action="store_true",
        help="Required with --submit for the controlled one-task response capture flow.",
    )
    parser.add_argument("--allow-duplicate", action="store_true", help="Override duplicate fingerprint blocking.")
    return parser.parse_args(argv)


def save_preview(config: AppConfig, payload: dict, cost: dict, fingerprint: str, preview_out: str | None) -> str:
    preview = {
        "dry_run": True,
        "submit_locked_by_default": True,
        "request_fingerprint": fingerprint,
        "request": redact_json(payload),
        "cost": cost,
    }
    path = config.request_preview_dir / f"{fingerprint[:16]}.json"
    if preview_out:
        from pathlib import Path

        path = Path(preview_out)
    write_json(path, preview)
    return str(path)


def print_summary(payload: dict, cost: dict, preview_path: str) -> None:
    print("Dry run: no network request was made.")
    print(f"Model: {payload['model']}")
    print(f"Duration: {payload['duration']}s")
    print(f"Resolution: {payload['resolution']}")
    print(f"Aspect ratio: {payload['ratio']}")
    print(f"Generate audio: {payload['generate_audio']}")
    print(f"Estimated maximum cost: {json.dumps(cost, ensure_ascii=False)}")
    print(f"Redacted request preview: {preview_path}")


def guard_submit(args: argparse.Namespace, config: AppConfig, payload: dict, cost: dict, fingerprint: str) -> None:
    if not args.submit:
        return
    require_verified_schema(config)
    if not config.api_key:
        raise ConfigError("ARK_API_KEY is missing. Submission is blocked.")
    if config.used_deprecated_key:
        print("Warning: BYTEPLUS_API_KEY fallback is deprecated. Use ARK_API_KEY.", file=sys.stderr)
    if args.max_cost_usd is None:
        raise ConfigError("--max-cost-usd is required with --submit.")
    estimated = cost.get("estimated_cost_usd")
    if estimated is None:
        raise ConfigError("Cost is UNVERIFIED. Submission is blocked.")
    if estimated > args.max_cost_usd:
        raise ConfigError(f"Estimated cost ${estimated:.4f} exceeds --max-cost-usd ${args.max_cost_usd:.4f}.")
    if args.confirm != CONFIRMATION_TOKEN:
        raise ConfigError(f"--confirm must equal {CONFIRMATION_TOKEN}.")
    if not args.capture_create_response:
        raise ConfigError("--capture-create-response is required for the controlled one-task response capture flow.")
    duplicate = find_duplicate_submission(config, fingerprint)
    if duplicate and not args.allow_duplicate:
        raise ConfigError("Duplicate active/recent request fingerprint found. Use --allow-duplicate only after review.")


def main() -> int:
    args = parse_args()
    try:
        config = load_config(require_key=args.submit)
        payload = build_create_payload(args, config)
        fingerprint = request_fingerprint(payload)
        input_has_video = any(item.get("type") == "video_url" for item in payload.get("content", []))
        cost = estimate_cost_usd(
            config,
            payload["resolution"],
            payload["ratio"],
            payload["duration"],
            input_has_video=input_has_video,
        )
        preview_path = save_preview(config, payload, cost, fingerprint, args.preview_out)
        print_summary(payload, cost, preview_path)
        guard_submit(args, config, payload, cost, fingerprint)
        if not args.submit:
            return 0

        local_request_id = new_local_request_id()
        append_jsonl(
            config.task_log_path,
            {
                "local_request_id": local_request_id,
                "request_fingerprint": fingerprint,
                "created_at": utc_now(),
                "model": payload["model"],
                "safe_input_identifier": input_identifier(payload),
                "task_id": None,
                "status": "submitted",
                "estimated_cost": cost,
                "actual_usage": None,
                "downloaded_output_path": None,
                "error_category": None,
            },
        )
        url = build_url(config, config.create_path)
        data = request_json("POST", url, config.api_key or "", config.timeout_seconds, json=payload)
        capture_path = save_create_response_capture(
            config,
            local_request_id=local_request_id,
            fingerprint=fingerprint,
            payload=payload,
            cost=cost,
            response=data,
        )
        parsed = parse_task_response(data)
        task_id = parsed.get("id")
        if not task_id:
            append_jsonl(
                config.task_log_path,
                {
                    "local_request_id": local_request_id,
                    "request_fingerprint": fingerprint,
                    "created_at": utc_now(),
                    "model": payload["model"],
                    "safe_input_identifier": input_identifier(payload),
                    "task_id": None,
                    "status": "response_captured_task_id_missing",
                    "estimated_cost": cost,
                    "actual_usage": None,
                    "downloaded_output_path": None,
                    "error_category": "verified_task_id_field_missing",
                    "capture_path": str(capture_path),
                },
            )
            print(f"Create-task response captured for review: {capture_path}")
            print("Verified task ID field $.id was missing. No polling or download was started.")
            return 0
        save_sanitized_response(config, str(task_id), data)
        append_jsonl(
            config.task_log_path,
            {
                "local_request_id": local_request_id,
                "request_fingerprint": fingerprint,
                "created_at": utc_now(),
                "model": payload["model"],
                "safe_input_identifier": input_identifier(payload),
                "task_id": task_id,
                "status": parsed["status"],
                "estimated_cost": cost,
                "actual_usage": parsed.get("usage"),
                "downloaded_output_path": None,
                "error_category": None,
                "capture_path": str(capture_path),
            },
        )
        print(f"Create-task response captured for review: {capture_path}")
        print(f"Task ID candidate: {task_id}")
        print("No polling or download was started.")
        return 0
    except (ConfigError, SchemaBlockedError, RuntimeError) as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
