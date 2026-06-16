#!/usr/bin/env python3
"""Local-only browser dashboard for the safe WSTV Seedance pipeline."""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
import uuid
from dataclasses import dataclass
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any

from common import PROJECT_ROOT, ConfigError, redact_text, safe_url_for_logs, utc_now, write_json
from generate_video import CONFIRMATION_TOKEN


HOST = "127.0.0.1"
DEFAULT_PORT = 8765
WEB_ROOT = PROJECT_ROOT / "web"
UI_PATH = WEB_ROOT / "wstv_ui.html"
DASHBOARD_DATA_DIR = PROJECT_ROOT / "data" / "dashboard"
HISTORY_PATH = PROJECT_ROOT / "data" / "dashboard_history.json"
DOWNLOADS_DIR = PROJECT_ROOT / "downloads"
MAX_BODY_BYTES = 64 * 1024
SAFE_FILENAME_RE = re.compile(r"[^A-Za-z0-9._-]+")
URL_RE = re.compile(r"https?://[^\s\"'<>]+")


@dataclass(frozen=True)
class DashboardRequest:
    scene_idea: str
    prompt: str
    image_url: str
    output_filename: str
    max_cost_usd: float
    confirm: str


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run the local-only WSTV browser dashboard.")
    parser.add_argument("--host", default=HOST, choices=[HOST], help="Bind host. Only 127.0.0.1 is allowed.")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT)
    return parser.parse_args(argv)


def sanitize_output_filename(value: str) -> str:
    raw = (value or "").strip()
    if "/" in raw or "\\" in raw:
        raise ConfigError("Output filename must be a simple file name.")
    name = SAFE_FILENAME_RE.sub("-", raw).strip(".-")
    if not name:
        name = "wstv-output.mp4"
    name = name.replace("-.", ".")
    if not name.lower().endswith(".mp4"):
        name += ".mp4"
    if name in {".", ".."}:
        raise ConfigError("Output filename must be a simple file name.")
    return name


def output_path_for(filename: str) -> Path:
    safe_name = sanitize_output_filename(filename)
    path = (DOWNLOADS_DIR / safe_name).resolve()
    downloads = DOWNLOADS_DIR.resolve()
    if downloads != path and downloads not in path.parents:
        raise ConfigError("Output path must stay under downloads/.")
    return path


def dashboard_request(data: dict[str, Any]) -> DashboardRequest:
    try:
        max_cost = float(data.get("max_cost_usd", 3))
    except (TypeError, ValueError) as exc:
        raise ConfigError("Max cost must be a number.") from exc
    prompt = str(data.get("prompt") or "").strip()
    scene_idea = str(data.get("scene_idea") or "").strip()
    if not prompt and not scene_idea:
        raise ConfigError("Enter a final prompt or scene idea.")
    return DashboardRequest(
        scene_idea=scene_idea,
        prompt=prompt or scene_idea,
        image_url=str(data.get("image_url") or "").strip(),
        output_filename=sanitize_output_filename(str(data.get("output_filename") or "wstv-output.mp4")),
        max_cost_usd=max_cost,
        confirm=str(data.get("confirm") or "").strip(),
    )


def write_prompt_file(request: DashboardRequest) -> Path:
    DASHBOARD_DATA_DIR.mkdir(parents=True, exist_ok=True)
    path = DASHBOARD_DATA_DIR / f"prompt-{uuid.uuid4().hex[:12]}.txt"
    path.write_text(request.prompt + "\n", encoding="utf-8")
    return path


def pipeline_command(request: DashboardRequest, *, submit: bool) -> list[str]:
    prompt_path = write_prompt_file(request)
    out_path = output_path_for(request.output_filename)
    cmd = [
        sys.executable,
        str(PROJECT_ROOT / "scripts" / "wstv_pipeline.py"),
        "--prompt-file",
        str(prompt_path),
        "--out",
        str(out_path),
    ]
    if request.image_url:
        cmd.extend(["--image-url", request.image_url])
    if submit:
        cmd.extend(
            [
                "--submit",
                "--max-cost-usd",
                str(request.max_cost_usd),
                "--confirm",
                CONFIRMATION_TOKEN,
            ]
        )
    return cmd


def sanitize_log(text: str) -> str:
    text = redact_text(text or "")
    lines: list[str] = []
    for line in text.splitlines():
        if "Private completed response saved:" in line:
            lines.append("Private completed response saved under gitignored outputs/private-responses/.")
            continue
        if "Create response capture:" in line:
            lines.append("Create response capture saved under gitignored outputs/create-response-captures/.")
            continue
        lines.append(URL_RE.sub(lambda m: safe_url_for_logs(m.group(0)), line))
    return "\n".join(lines)


def run_pipeline_request(request: DashboardRequest, *, submit: bool) -> dict[str, Any]:
    if submit and request.confirm != CONFIRMATION_TOKEN:
        raise ConfigError(f"Confirmation must equal {CONFIRMATION_TOKEN}.")
    cmd = pipeline_command(request, submit=submit)
    completed = subprocess.run(
        cmd,
        cwd=PROJECT_ROOT,
        text=True,
        capture_output=True,
        check=False,
        timeout=1200 if submit else 120,
    )
    log = sanitize_log(completed.stdout + ("\n" + completed.stderr if completed.stderr else ""))
    ok = completed.returncode == 0
    result = {
        "ok": ok,
        "returncode": completed.returncode,
        "submitted": submit,
        "log": log,
        "mp4_path": str(output_path_for(request.output_filename)) if ok and submit else "",
        "timestamp": utc_now(),
    }
    append_history(request, result)
    return result


def read_history() -> list[dict[str, Any]]:
    if not HISTORY_PATH.exists():
        return []
    try:
        data = json.loads(HISTORY_PATH.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return []
    return data if isinstance(data, list) else []


def append_history(request: DashboardRequest, result: dict[str, Any]) -> None:
    history = read_history()
    entry = {
        "timestamp": result["timestamp"],
        "ok": result["ok"],
        "submitted": result["submitted"],
        "output_filename": request.output_filename,
        "mp4_path": result.get("mp4_path", ""),
        "image_url_host": safe_url_for_logs(request.image_url) if request.image_url else "",
    }
    history.insert(0, entry)
    write_json(HISTORY_PATH, history[:25])


class DashboardHandler(BaseHTTPRequestHandler):
    server_version = "WSTVDashboard/1.0"

    def log_message(self, format: str, *args: Any) -> None:
        return

    def _send_json(self, data: dict[str, Any], status: HTTPStatus = HTTPStatus.OK) -> None:
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _send_file(self, path: Path, content_type: str) -> None:
        body = path.read_bytes()
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", content_type)
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _read_json_body(self) -> dict[str, Any]:
        length = int(self.headers.get("content-length", "0"))
        if length <= 0 or length > MAX_BODY_BYTES:
            raise ConfigError("Invalid request body.")
        data = json.loads(self.rfile.read(length).decode("utf-8"))
        if not isinstance(data, dict):
            raise ConfigError("Request body must be a JSON object.")
        return data

    def do_GET(self) -> None:
        if self.path in {"/", "/index.html"}:
            self._send_file(UI_PATH, "text/html; charset=utf-8")
            return
        if self.path == "/api/history":
            self._send_json({"ok": True, "history": read_history()})
            return
        self._send_json({"ok": False, "error": "Not found."}, HTTPStatus.NOT_FOUND)

    def do_POST(self) -> None:
        try:
            data = self._read_json_body()
            request = dashboard_request(data)
            if self.path == "/api/dry-run":
                self._send_json(run_pipeline_request(request, submit=False))
                return
            if self.path == "/api/generate":
                self._send_json(run_pipeline_request(request, submit=True))
                return
            self._send_json({"ok": False, "error": "Not found."}, HTTPStatus.NOT_FOUND)
        except (ConfigError, json.JSONDecodeError, subprocess.TimeoutExpired) as exc:
            self._send_json({"ok": False, "error": sanitize_log(str(exc))}, HTTPStatus.BAD_REQUEST)


def run_server(host: str = HOST, port: int = DEFAULT_PORT) -> None:
    if host != HOST:
        raise ConfigError("Dashboard may only bind to 127.0.0.1.")
    DASHBOARD_DATA_DIR.mkdir(parents=True, exist_ok=True)
    HISTORY_PATH.parent.mkdir(parents=True, exist_ok=True)
    server = ThreadingHTTPServer((host, port), DashboardHandler)
    print(f"WSTV dashboard: http://{host}:{port}")
    server.serve_forever()


def main() -> int:
    args = parse_args()
    try:
        run_server(args.host, args.port)
        return 0
    except (ConfigError, OSError) as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
