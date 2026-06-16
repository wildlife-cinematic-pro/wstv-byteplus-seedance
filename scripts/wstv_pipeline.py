#!/usr/bin/env python3
"""One-command safe WSTV Seedance production workflow."""

from __future__ import annotations

import argparse
import sys
import time
from pathlib import Path

import check_task
import download_video
import generate_video
from common import (
    ConfigError,
    FAILURE_STATUSES,
    SUCCESS_STATUSES,
    TERMINAL_STATUSES,
    AppConfig,
    PROJECT_ROOT,
    append_jsonl,
    build_create_payload,
    build_url,
    estimate_cost_usd,
    input_identifier,
    load_config,
    new_local_request_id,
    parse_task_response,
    request_fingerprint,
    request_json,
    save_create_response_capture,
    utc_now,
    validate_task_id,
    verified_output_video_url_field,
    verified_response_task_id_field,
    write_json,
)


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run the safe one-command WSTV Seedance workflow.")
    parser.add_argument("--prompt-file", required=True, help="Prompt text file.")
    parser.add_argument(
        "--out",
        required=True,
        help="Output filename or path under the configured video output directory.",
    )
    parser.add_argument("--image-url", help="Optional approved reference image URL.")
    parser.add_argument("--duration", type=int, default=15)
    parser.add_argument("--ratio", default="9:16")
    parser.add_argument("--resolution", default="720p")
    parser.add_argument("--generate-audio", action=argparse.BooleanOptionalAction, default=True)
    parser.add_argument("--watermark", action=argparse.BooleanOptionalAction, default=False)
    parser.add_argument("--expected-width", type=int, default=720)
    parser.add_argument("--expected-height", type=int, default=1280)
    parser.add_argument("--expected-duration", type=float, default=15.0)
    parser.add_argument("--poll-interval", type=int, default=30)
    parser.add_argument("--poll-timeout", type=int, default=900)
    parser.add_argument("--submit", action="store_true", help="Submit exactly one paid task after all gates pass.")
    parser.add_argument("--max-cost-usd", type=float, help="Required with --submit.")
    parser.add_argument("--confirm", help=f"Required with --submit. Must equal {generate_video.CONFIRMATION_TOKEN}.")
    return parser.parse_args(argv)


def generation_args(args: argparse.Namespace) -> argparse.Namespace:
    return argparse.Namespace(
        prompt=None,
        prompt_file=args.prompt_file,
        image_url=args.image_url,
        image_path=None,
        image_role="reference_image",
        reference_image_url=None,
        reference_video_url=None,
        reference_audio_url=None,
        duration=args.duration,
        ratio=args.ratio,
        resolution=args.resolution,
        generate_audio=args.generate_audio,
        watermark=args.watermark,
        seed=None,
        frames=None,
        execution_expires_after=None,
        safety_identifier=None,
    )


def submit_guard_args(args: argparse.Namespace) -> argparse.Namespace:
    return argparse.Namespace(
        submit=args.submit,
        max_cost_usd=args.max_cost_usd,
        confirm=args.confirm,
        capture_create_response=True,
        allow_duplicate=False,
    )


def validate_output_path(config: AppConfig, out: str) -> Path:
    raw = Path(out)
    if not str(out).strip():
        raise ConfigError("Pipeline --out is required.")
    if raw.is_absolute():
        out_path = raw
    elif raw.parent == Path("."):
        out_path = config.downloads_dir / raw.name
    else:
        raise ConfigError(
            "Pipeline --out must be a simple filename or an absolute path inside the configured video output directory."
        )
    downloads_dir = config.downloads_dir.expanduser().resolve()
    resolved = out_path.resolve()
    if downloads_dir != resolved and downloads_dir not in resolved.parents:
        raise ConfigError("Pipeline --out must stay inside the configured video output directory.")
    if resolved.suffix.lower() != ".mp4":
        raise ConfigError("Pipeline --out must end with .mp4.")
    resolved.parent.mkdir(parents=True, exist_ok=True)
    return resolved


def save_private_task_response(config: AppConfig, task_id: str, data: dict) -> Path:
    task_id = validate_task_id(task_id)
    path = config.private_task_response_dir / f"{task_id}.json"
    write_json(path, data)
    return path


def submit_one_task(config: AppConfig, payload: dict, cost: dict, fingerprint: str) -> tuple[str, Path]:
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
    data = request_json(
        "POST",
        build_url(config, config.create_path),
        config.api_key or "",
        config.timeout_seconds,
        json=payload,
    )
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
        raise ConfigError("Create response did not include verified task ID field $.id.")
    task_id = validate_task_id(task_id)
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
    return task_id, capture_path


def poll_until_succeeded(
    config: AppConfig,
    task_id: str,
    *,
    interval: int,
    timeout: int,
    sleep=time.sleep,
    fetch=check_task.fetch_task_response,
) -> dict:
    task_id = validate_task_id(task_id)
    started = time.monotonic()
    while True:
        data = fetch(config, task_id)
        parsed = parse_task_response(data)
        status = parsed["status"]
        check_task.print_status(parsed)
        if status in SUCCESS_STATUSES:
            return data
        if status in FAILURE_STATUSES:
            raise ConfigError(f"Task ended with failure status: {status}")
        if status not in TERMINAL_STATUSES and status not in {"queued", "running"}:
            raise ConfigError(f"Unknown task status from existing task: {status}")
        if time.monotonic() - started >= timeout:
            raise ConfigError(f"Timed out after {timeout}s without succeeded status.")
        sleep(max(1, interval))


def download_completed_video(config: AppConfig, response_path: Path, out_path: Path, args: argparse.Namespace) -> None:
    verified_output_video_url_field(config)
    url = download_video.url_from_task_response(str(response_path))
    size = download_video.download(url, out_path, config.timeout_seconds)
    meta = download_video.ffprobe_metadata(out_path)
    if meta.get("status") != "PASS":
        raise ConfigError("ffprobe verification is required for the production pipeline.")
    findings = download_video.verify_video(meta, args.expected_duration, args.expected_width, args.expected_height)
    write_json(
        out_path.with_suffix(out_path.suffix + ".verification.json"),
        {
            "path": str(out_path),
            "size_bytes": size,
            "ffprobe": meta,
            "findings": findings,
        },
    )
    if findings:
        raise ConfigError("Downloaded video failed verification: " + "; ".join(findings))


def run_pipeline(args: argparse.Namespace) -> int:
    config = load_config(require_key=args.submit)
    out_path = validate_output_path(config, args.out)
    payload = build_create_payload(generation_args(args), config)
    fingerprint = request_fingerprint(payload)
    cost = estimate_cost_usd(config, payload["resolution"], payload["ratio"], payload["duration"])
    preview_path = generate_video.save_preview(config, payload, cost, fingerprint, None)
    generate_video.print_summary(payload, cost, preview_path)
    generate_video.guard_submit(submit_guard_args(args), config, payload, cost, fingerprint)
    if not args.submit:
        print("No network request was made.")
        return 0

    verified_response_task_id_field(config)
    task_id, capture_path = submit_one_task(config, payload, cost, fingerprint)
    print(f"Submitted one task: {task_id}")
    print(f"Create response capture: {capture_path}")
    completed = poll_until_succeeded(
        config,
        task_id,
        interval=args.poll_interval,
        timeout=args.poll_timeout,
    )
    private_response_path = save_private_task_response(config, task_id, completed)
    print(f"Private completed response saved: {private_response_path}")
    download_completed_video(config, private_response_path, out_path, args)
    print(f"Final MP4: {out_path}")
    return 0


def main() -> int:
    try:
        return run_pipeline(parse_args())
    except (ConfigError, RuntimeError, OSError) as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
