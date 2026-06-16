#!/usr/bin/env python3
"""Safely download and verify a completed Seedance output video URL."""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path
from urllib.parse import urlparse

from common import (
    ConfigError,
    ffprobe_path,
    load_config,
    read_json,
    safe_url_for_logs,
    verified_output_video_url_field,
    write_json,
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Download an existing completed Seedance video URL safely.")
    source = parser.add_mutually_exclusive_group(required=True)
    source.add_argument("--url", help="Verified output video URL from an existing completed task.")
    source.add_argument("--response-json", help="Path to a completed task response JSON containing content.video_url.")
    parser.add_argument("--out", required=True, help="Output .mp4 path.")
    parser.add_argument("--expect-duration", type=float, default=15.0)
    parser.add_argument("--expect-width", type=int, default=720)
    parser.add_argument("--expect-height", type=int, default=1280)
    parser.add_argument("--skip-ffprobe", action="store_true")
    return parser.parse_args()


def url_from_task_response(path: str) -> str:
    data = read_json(Path(path))
    status = str(data.get("status", "")).lower()
    if status and status != "succeeded":
        raise ConfigError(f"Task response status is not succeeded: {status}")
    content = data.get("content")
    if not isinstance(content, dict) or not content.get("video_url"):
        raise ConfigError("Task response does not contain content.video_url.")
    return str(content["video_url"])


def validate_content_type(content_type: str) -> None:
    lower = content_type.lower()
    if "text/html" in lower or "application/json" in lower:
        raise ConfigError(f"Refusing to save non-video response: {content_type}")
    if lower and not any(kind in lower for kind in ("video/", "application/octet-stream", "binary/octet-stream")):
        raise ConfigError(f"Unexpected content type for MP4 download: {content_type}")


def download(url: str, out_path: Path, timeout: float) -> int:
    requests = __import__("requests")
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"}:
        raise ConfigError("--url must be http(s).")
    out_path.parent.mkdir(parents=True, exist_ok=True)
    tmp_path = out_path.with_suffix(out_path.suffix + ".tmp")
    try:
        response_ctx = requests.get(url, stream=True, timeout=timeout)
    except requests.RequestException as exc:
        raise ConfigError(f"Download request failed: {type(exc).__name__}") from exc
    with response_ctx as response:
        if response.status_code >= 400:
            raise ConfigError(f"Download failed with HTTP {response.status_code}.")
        validate_content_type(response.headers.get("content-type", ""))
        size = 0
        with tmp_path.open("wb") as fh:
            for chunk in response.iter_content(chunk_size=1024 * 1024):
                if chunk:
                    size += len(chunk)
                    fh.write(chunk)
    if size <= 0:
        tmp_path.unlink(missing_ok=True)
        raise ConfigError("Downloaded file is empty.")
    with tmp_path.open("rb") as fh:
        first = fh.read(64).lower()
    if first.startswith(b"<!doctype html") or first.startswith(b"<html"):
        tmp_path.unlink(missing_ok=True)
        raise ConfigError("Refusing to save an HTML error page as MP4.")
    tmp_path.replace(out_path)
    return size


def ffprobe_metadata(path: Path) -> dict:
    probe = ffprobe_path()
    if not probe:
        return {"status": "BLOCKED", "reason": "ffprobe not found"}
    cmd = [
        probe,
        "-v",
        "error",
        "-print_format",
        "json",
        "-show_streams",
        "-show_format",
        str(path),
    ]
    completed = subprocess.run(cmd, text=True, capture_output=True, check=False)
    if completed.returncode != 0:
        return {"status": "FAIL", "error": completed.stderr.strip()}
    return {"status": "PASS", "data": json.loads(completed.stdout)}


def verify_video(meta: dict, expect_duration: float, expect_width: int, expect_height: int) -> list[str]:
    findings: list[str] = []
    if meta.get("status") != "PASS":
        return findings
    data = meta["data"]
    streams = data.get("streams", [])
    video_stream = next((s for s in streams if s.get("codec_type") == "video"), None)
    if not video_stream:
        findings.append("No video stream found.")
        return findings
    width = int(video_stream.get("width", 0))
    height = int(video_stream.get("height", 0))
    duration = float(video_stream.get("duration") or data.get("format", {}).get("duration") or 0)
    if width != expect_width or height != expect_height:
        findings.append(f"Unexpected dimensions {width}x{height}; expected {expect_width}x{expect_height}.")
    if not (expect_duration - 1.0 <= duration <= expect_duration + 1.0):
        findings.append(f"Unexpected duration {duration:.2f}s; expected about {expect_duration:.2f}s.")
    if height <= width:
        findings.append("Video is not vertical 9:16 orientation.")
    if not video_stream.get("codec_name"):
        findings.append("Missing video codec name.")
    return findings


def main() -> int:
    args = parse_args()
    try:
        config = load_config(require_key=False)
        verified_output_video_url_field(config)
        out_path = Path(args.out)
        url = args.url or url_from_task_response(args.response_json)
        print(f"Downloading: {safe_url_for_logs(url)}")
        size = download(url, out_path, config.timeout_seconds)
        meta = ffprobe_metadata(out_path) if not args.skip_ffprobe else {"status": "SKIPPED"}
        findings = verify_video(meta, args.expect_duration, args.expect_width, args.expect_height)
        verification = {
            "path": str(out_path),
            "size_bytes": size,
            "ffprobe": meta,
            "findings": findings,
        }
        write_json(out_path.with_suffix(out_path.suffix + ".verification.json"), verification)
        if findings:
            print("Download completed, but verification found issues:")
            for finding in findings:
                print(f"- {finding}")
            return 2
        print("Download and verification completed.")
        return 0
    except (ConfigError, RuntimeError, OSError) as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
