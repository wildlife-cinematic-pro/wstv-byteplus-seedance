#!/usr/bin/env python3
"""Check one BytePlus ModelArk Seedance task."""

import argparse
import json
import os
import sys
from typing import Any, Dict, Optional



DEFAULT_BASE_URL = "https://ark.ap-southeast.byteplus.com/api/v3"
DEFAULT_RETRIEVE_TASK_PATH = "/contents/generations/tasks/{task_id}"


class ConfigError(RuntimeError):
    pass


def load_dotenv_file() -> None:
    try:
        from dotenv import load_dotenv
    except ModuleNotFoundError:
        return
    load_dotenv()


def import_requests() -> Any:
    try:
        import requests
    except ModuleNotFoundError as exc:
        raise RuntimeError("Missing dependency requests. Install with: pip install -r requirements.txt") from exc
    return requests


def load_config() -> Dict[str, str]:
    load_dotenv_file()
    api_key = os.getenv("BYTEPLUS_API_KEY", "").strip()
    if not api_key:
        raise ConfigError("BYTEPLUS_API_KEY is missing. Add a real key to .env before calling BytePlus.")
    return {
        "api_key": api_key,
        "base_url": os.getenv("BYTEPLUS_BASE_URL", DEFAULT_BASE_URL).rstrip("/"),
        "retrieve_task_path": os.getenv("BYTEPLUS_RETRIEVE_TASK_PATH", DEFAULT_RETRIEVE_TASK_PATH),
    }


def make_url(base_url: str, path: str, **values: str) -> str:
    return f"{base_url}/{path.format(**values).lstrip('/')}"


def auth_headers(api_key: str) -> Dict[str, str]:
    return {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}


def explain_http_error(response: Any) -> str:
    messages = {
        401: "401 Unauthorized: API key is invalid, expired, or not accepted for this region.",
        403: "403 Forbidden: missing permission for this model/resource.",
        429: "429 Rate limited: wait or check quota/billing.",
        500: "500 Server error: BytePlus service had an internal error. Retry later.",
    }
    detail = response.text.strip()
    base = messages.get(response.status_code, f"HTTP {response.status_code}: BytePlus request failed.")
    return f"{base}\nResponse: {detail}" if detail else base


def request_json(url: str, api_key: str) -> Dict[str, Any]:
    requests = import_requests()
    try:
        response = requests.get(url, headers=auth_headers(api_key), timeout=60)
    except requests.RequestException as exc:
        raise RuntimeError(f"Network request failed: {exc}") from exc
    if response.status_code >= 400:
        raise RuntimeError(explain_http_error(response))
    try:
        return response.json()
    except ValueError as exc:
        raise RuntimeError(f"BytePlus returned non-JSON response: {response.text[:500]}") from exc


def deep_find_first(data: Any, keys: set) -> Optional[Any]:
    if isinstance(data, dict):
        for key, value in data.items():
            if key in keys and value not in (None, ""):
                return value
        for value in data.values():
            found = deep_find_first(value, keys)
            if found is not None:
                return found
    elif isinstance(data, list):
        for item in data:
            found = deep_find_first(item, keys)
            if found is not None:
                return found
    return None


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Check a WSTV BytePlus Seedance task.")
    parser.add_argument("task_id", help="BytePlus task ID.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        config = load_config()
        url = make_url(config["base_url"], config["retrieve_task_path"], task_id=args.task_id)
        data = request_json(url, config["api_key"])
        status = deep_find_first(data, {"status", "state"}) or "unknown"
        usage = deep_find_first(data, {"usage", "token_usage", "tokens"})
        output_url = deep_find_first(data, {"video_url", "videoUrl", "output_url", "outputUrl", "url"})

        print(f"Status: {status}")
        if usage is not None:
            print("Usage/token info:")
            print(json.dumps(usage, indent=2, ensure_ascii=False))
        if output_url is not None:
            print(f"Output URL: {output_url}")
        return 0
    except (ConfigError, RuntimeError) as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
