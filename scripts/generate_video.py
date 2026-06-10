#!/usr/bin/env python3
"""Submit a BytePlus ModelArk Seedance video generation task for WSTV."""

import argparse
import base64
import json
import os
import sys
import time
from pathlib import Path
from typing import Any, Dict, Optional



DEFAULT_BASE_URL = "https://ark.ap-southeast.byteplus.com/api/v3"
DEFAULT_MODEL_ID = "dreamina-seedance-2-0-260128"

# BytePlus API Explorer is the source of truth. If official docs differ,
# copy/update these paths in .env instead of hardcoding new values in scripts.
DEFAULT_CREATE_TASK_PATH = "/contents/generations/tasks"
DEFAULT_RETRIEVE_TASK_PATH = "/contents/generations/tasks/{task_id}"

SUCCESS_STATUSES = {"succeeded", "success", "completed", "done"}
FAILURE_STATUSES = {"failed", "error"}
CANCELLED_STATUSES = {"cancelled", "canceled"}
TERMINAL_STATUSES = SUCCESS_STATUSES | FAILURE_STATUSES | CANCELLED_STATUSES


class ConfigError(RuntimeError):
    """Raised when local configuration is missing or invalid."""


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
        raise ConfigError(
            "BYTEPLUS_API_KEY is missing. Create .env from .env.example and add a real key before calling BytePlus."
        )

    return {
        "api_key": api_key,
        "base_url": os.getenv("BYTEPLUS_BASE_URL", DEFAULT_BASE_URL).rstrip("/"),
        "model_id": os.getenv("BYTEPLUS_MODEL_ID", DEFAULT_MODEL_ID),
        "create_task_path": os.getenv("BYTEPLUS_CREATE_TASK_PATH", DEFAULT_CREATE_TASK_PATH),
        "retrieve_task_path": os.getenv("BYTEPLUS_RETRIEVE_TASK_PATH", DEFAULT_RETRIEVE_TASK_PATH),
        "image_schema": os.getenv("BYTEPLUS_IMAGE_SCHEMA", "url").strip().lower(),
    }


def read_text_file(path: str) -> str:
    return Path(path).expanduser().read_text(encoding="utf-8").strip()


def load_prompt(args: argparse.Namespace) -> str:
    parts = []
    if args.prompt:
        parts.append(args.prompt.strip())
    if args.prompt_file:
        parts.append(read_text_file(args.prompt_file))
    prompt = "\n\n".join(part for part in parts if part)
    if not prompt:
        raise ConfigError("Provide --prompt or --prompt-file.")
    return prompt


def encode_image_as_base64(image_path: str) -> str:
    path = Path(image_path).expanduser()
    if not path.exists():
        raise ConfigError(f"Image path does not exist: {path}")
    return base64.b64encode(path.read_bytes()).decode("ascii")


def build_image_payload(args: argparse.Namespace, image_schema: str) -> Optional[Dict[str, Any]]:
    """Build the image section.

    BytePlus API Explorer must confirm the exact field names. This function is
    intentionally isolated so the request schema can be updated in one place.
    """
    if args.image_url and args.image_path:
        raise ConfigError("Use only one of --image-url or --image-path.")

    if args.image_url:
        return {"type": "url", "url": args.image_url}

    if args.image_path:
        if image_schema == "base64":
            return {"type": "base64", "data": encode_image_as_base64(args.image_path)}
        print(
            "Warning: local --image-path was provided, but BYTEPLUS_IMAGE_SCHEMA is not 'base64'. "
            "BytePlus API Explorer may require image upload/file_id. Payload will include the local path as a placeholder.",
            file=sys.stderr,
        )
        return {"type": "local_path_requires_api_explorer_update", "path": args.image_path}

    return None


def build_create_payload(args: argparse.Namespace, config: Dict[str, str]) -> Dict[str, Any]:
    """Build the async generation request payload.

    IMPORTANT: This schema is a configurable starter. Copy/update the exact
    endpoint and request fields from BytePlus API Explorer if official docs
    differ for Dreamina Seedance 2.0.
    """
    prompt = load_prompt(args)
    payload: Dict[str, Any] = {
        "model": config["model_id"],
        "prompt": prompt,
        "duration": args.duration,
        "ratio": args.ratio,
        "resolution": args.resolution,
    }

    if args.negative_prompt:
        payload["negative_prompt"] = args.negative_prompt

    image_payload = build_image_payload(args, config["image_schema"])
    if image_payload:
        payload["input_image"] = image_payload

    return payload


def make_url(base_url: str, path: str, **values: str) -> str:
    rendered_path = path.format(**values)
    return f"{base_url}/{rendered_path.lstrip('/')}"


def auth_headers(api_key: str) -> Dict[str, str]:
    return {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }


def explain_http_error(response: Any) -> str:
    messages = {
        401: "401 Unauthorized: API key is missing, invalid, expired, or not accepted for this region.",
        403: "403 Forbidden: your account/key does not have permission for this model or ModelArk resource.",
        429: "429 Rate limited: too many requests or quota exceeded. Wait, reduce attempts, or check billing/quota.",
        500: "500 Server error: BytePlus service returned an internal error. Retry later or check API Explorer/status.",
    }
    base = messages.get(response.status_code, f"HTTP {response.status_code}: BytePlus request failed.")
    detail = response.text.strip()
    return f"{base}\nResponse: {detail}" if detail else base


def request_json(method: str, url: str, api_key: str, **kwargs: Any) -> Dict[str, Any]:
    requests = import_requests()
    try:
        response = requests.request(method, url, headers=auth_headers(api_key), timeout=60, **kwargs)
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


def extract_task_id(data: Dict[str, Any]) -> Optional[str]:
    value = deep_find_first(data, {"task_id", "taskId", "id"})
    return str(value) if value is not None else None


def extract_status(data: Dict[str, Any]) -> str:
    value = deep_find_first(data, {"status", "state"})
    return str(value).lower() if value is not None else "unknown"


def extract_output_url(data: Dict[str, Any]) -> Optional[str]:
    value = deep_find_first(data, {"video_url", "videoUrl", "output_url", "outputUrl", "url"})
    return str(value) if value is not None else None


def submit_task(args: argparse.Namespace, config: Dict[str, str]) -> Dict[str, Any]:
    url = make_url(config["base_url"], config["create_task_path"])
    payload = build_create_payload(args, config)
    print("Submitting Seedance task...")
    return request_json("POST", url, config["api_key"], json=payload)


def retrieve_task(task_id: str, config: Dict[str, str]) -> Dict[str, Any]:
    url = make_url(config["base_url"], config["retrieve_task_path"], task_id=task_id)
    return request_json("GET", url, config["api_key"])


def poll_task(task_id: str, config: Dict[str, str], timeout: int) -> Dict[str, Any]:
    started = time.monotonic()
    while True:
        data = retrieve_task(task_id, config)
        status = extract_status(data)
        print(f"Status: {status}")
        if status in TERMINAL_STATUSES:
            return data
        if time.monotonic() - started >= timeout:
            raise TimeoutError(f"Timed out after {timeout} seconds while waiting for task {task_id}.")
        time.sleep(10)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate a WSTV Seedance wildlife video with BytePlus ModelArk.")
    parser.add_argument("--prompt", help="Prompt text.")
    parser.add_argument("--prompt-file", help="Path to a prompt text file.")
    parser.add_argument("--image-url", help="Public URL for the approved master image.")
    parser.add_argument("--image-path", help="Local path for the approved master image.")
    parser.add_argument("--duration", type=int, default=15, help="Video duration in seconds. Default: 15.")
    parser.add_argument("--ratio", default="9:16", help="Aspect ratio. Default: 9:16.")
    parser.add_argument("--resolution", default="720p", help="Output resolution. Default: 720p.")
    parser.add_argument("--negative-prompt", help="Negative prompt text.")
    parser.add_argument("--poll", action="store_true", help="Poll until the task succeeds, fails, is cancelled, or times out.")
    parser.add_argument("--timeout", type=int, default=900, help="Polling timeout in seconds. Default: 900.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        config = load_config()
        data = submit_task(args, config)
        task_id = extract_task_id(data)
        if not task_id:
            print(json.dumps(data, indent=2, ensure_ascii=False))
            raise RuntimeError("Could not find task ID in response. Update extract_task_id/schema from API Explorer.")

        print(f"Task ID: {task_id}")
        if not args.poll:
            return 0

        final_data = poll_task(task_id, config, args.timeout)
        output_url = extract_output_url(final_data)
        if output_url:
            print(f"Output URL: {output_url}")
        else:
            print("No output URL found. Check the full task response or update schema extraction from API Explorer.")
        return 0
    except (ConfigError, RuntimeError, TimeoutError) as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
