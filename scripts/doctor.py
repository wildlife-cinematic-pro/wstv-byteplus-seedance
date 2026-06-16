#!/usr/bin/env python3
"""Local-only safety doctor for the WSTV Seedance toolkit."""

from __future__ import annotations

import argparse
import importlib.util
import os
import subprocess
import sys
from pathlib import Path

from common import ConfigError, PROJECT_ROOT, ensure_writable_directory, ffprobe_path, load_config, read_json


def result(status: str, name: str, evidence: str, action: str = "") -> tuple[str, str, str, str]:
    return status, name, evidence, action


def git_output(*args: str) -> str:
    completed = subprocess.run(["git", *args], cwd=PROJECT_ROOT, text=True, capture_output=True, check=False)
    return completed.stdout.strip()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run local-only safety checks for the WSTV Seedance toolkit.")
    return parser.parse_args()


def main() -> int:
    parse_args()
    checks: list[tuple[str, str, str, str]] = []
    blocked = False
    failed = False

    py_ok = sys.version_info >= (3, 9)
    checks.append(result("PASS" if py_ok else "FAIL", "Python version", sys.version.split()[0], "" if py_ok else "Use Python 3.9+."))
    for dep in ("requests", "dotenv"):
        installed = importlib.util.find_spec(dep) is not None
        checks.append(
            result(
                "PASS" if installed else "FAIL",
                f"Dependency {dep}",
                "installed" if installed else "missing",
                "" if installed else "Run pip install -r requirements.txt.",
            )
        )

    gitignore = PROJECT_ROOT / ".gitignore"
    ignored_env = ".env" in gitignore.read_text(encoding="utf-8") if gitignore.exists() else False
    checks.append(result("PASS" if ignored_env else "FAIL", ".env ignored", ".gitignore contains .env" if ignored_env else "missing .env ignore"))
    tracked_env = git_output("ls-files", ".env")
    checks.append(result("PASS" if not tracked_env else "FAIL", ".env not tracked", "not tracked" if not tracked_env else "tracked"))

    try:
        config = load_config(require_key=False)
        checks.append(result("PASS", "Base URL", config.base_url))
        checks.append(result("PASS", "Model ID", config.model_id))
        key_status = "configured" if config.api_key else "missing"
        checks.append(result("PASS" if config.api_key else "BLOCKED", "API key variable", key_status, "Set ARK_API_KEY locally only when ready."))
        if config.used_deprecated_key:
            checks.append(result("BLOCKED", "Deprecated key fallback", "BYTEPLUS_API_KEY present", "Migrate to ARK_API_KEY."))
            blocked = True
    except ConfigError as exc:
        checks.append(result("FAIL", "Configuration", str(exc)))
        failed = True
        config = None

    for folder in ("config", "docs", "examples", "prompts", "scripts"):
        path = PROJECT_ROOT / folder
        checks.append(result("PASS" if path.is_dir() else "FAIL", f"Folder {folder}", str(path)))

    if config:
        for name, path in (
            ("Task log directory", config.task_log_path.parent),
            ("Output directory", config.outputs_dir),
            ("Download directory", config.downloads_dir),
        ):
            try:
                ensure_writable_directory(path)
                checks.append(result("PASS", name, str(path)))
            except OSError as exc:
                checks.append(result("FAIL", name, str(exc)))
                failed = True
        if config.schema_sample_path.exists():
            try:
                sample = read_json(config.schema_sample_path)
                if sample.get("schema_status") == "VERIFIED_OFFICIAL_PLAYGROUND_SAMPLE":
                    checks.append(result("PASS", "Official schema fixture", str(config.schema_sample_path)))
                else:
                    action = "Keep paid submission blocked until schema and billing gates are manually approved."
                    if not str(sample.get("schema_status", "")).startswith("VERIFIED_REDACTED_"):
                        action = "Replace placeholder with a redacted verified Playground REST sample."
                    checks.append(
                        result(
                            "BLOCKED",
                            "Official schema fixture",
                            str(sample.get("schema_status", "missing schema_status")),
                            action,
                        )
                    )
                    blocked = True
            except ConfigError as exc:
                checks.append(result("FAIL", "Official schema fixture", str(exc)))
                failed = True
        else:
            checks.append(
                result(
                    "BLOCKED",
                    "Official schema fixture",
                    "docs/official-rest-sample.redacted.json is missing",
                    "Copy and redact the Playground REST sample before paid submission.",
                )
            )
            blocked = True

    probe = ffprobe_path()
    checks.append(result("PASS" if probe else "BLOCKED", "ffprobe", probe or "not found", "Install ffmpeg for stronger video verification."))
    checks.append(result("PASS", "Paid submission default", "locked unless --submit plus all gates pass"))

    print("WSTV Seedance Doctor")
    for status, name, evidence, action in checks:
        print(f"{status}: {name} - {evidence}" + (f" | {action}" if action else ""))
        if status == "FAIL":
            failed = True
        if status == "BLOCKED":
            blocked = True
    if failed:
        print("Overall: FAIL")
        return 1
    if blocked:
        print("Overall: BLOCKED")
        return 2
    print("Overall: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
