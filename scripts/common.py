#!/usr/bin/env python3
"""Shared fail-closed helpers for the WSTV Seedance toolkit."""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import ipaddress
import json
import os
import re
import shutil
import sys
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse


PROJECT_ROOT = Path(__file__).resolve().parents[1]
CONFIG_DIR = PROJECT_ROOT / "config"
DATA_DIR = PROJECT_ROOT / "data"
OUTPUTS_DIR = PROJECT_ROOT / "outputs"
DOWNLOADS_DIR = PROJECT_ROOT / "downloads"
TASK_LOG_PATH = DATA_DIR / "tasks.jsonl"
REQUEST_PREVIEW_DIR = OUTPUTS_DIR / "request-previews"
RAW_RESPONSE_DIR = OUTPUTS_DIR / "raw-responses"
PRIVATE_TASK_RESPONSE_DIR = OUTPUTS_DIR / "private-responses"
OFFICIAL_SAMPLE_PATH = PROJECT_ROOT / "docs" / "official-rest-sample.redacted.json"

OFFICIAL_BASE_URL = "https://ark.ap-southeast.bytepluses.com/api/v3"
OFFICIAL_CREATE_PATH = "/contents/generations/tasks"
OFFICIAL_RETRIEVE_PATH = "/contents/generations/tasks/{id}"
OFFICIAL_LIST_PATH = "/contents/generations/tasks"
OFFICIAL_CANCEL_PATH = "/contents/generations/tasks/{id}"
VERIFIED_CREATE_TASK_ID_FIELD = "id"
VERIFIED_CREATE_TASK_ID_PATH = "$.id"
VERIFIED_OUTPUT_VIDEO_URL_FIELD = "video_url"
VERIFIED_OUTPUT_VIDEO_URL_PATH = "$.content.video_url"

ACTIVE_STATUSES = {"queued", "running", "submitted", "unknown"}
TERMINAL_STATUSES = {"succeeded", "failed", "cancelled", "expired"}
SUCCESS_STATUSES = {"succeeded"}
FAILURE_STATUSES = {"failed", "expired", "cancelled"}
SECRET_KEY_RE = re.compile(r"(api[_-]?key|authorization|bearer|secret|token)", re.IGNORECASE)
SECRET_VALUE_RE = re.compile(r"(?<![A-Za-z0-9_])sk-[A-Za-z0-9_-]{8,}|Bearer\s+[-A-Za-z0-9._~+/=]{8,}", re.IGNORECASE)
TASK_ID_RE = re.compile(r"^cgt-\d{14}-[A-Za-z0-9_-]+$")
CONTROLLED_CAPTURE_SCHEMA_STATUSES = {
    "VERIFIED_OFFICIAL_PLAYGROUND_SAMPLE",
    "VERIFIED_REDACTED_OFFICIAL_SAMPLE_CONTROLLED_CAPTURE",
}
ALLOWED_IMAGE_CONTENT_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
HEAD_FALLBACK_STATUSES = {403, 405, 501}


class ConfigError(RuntimeError):
    """Raised when local configuration is missing or unsafe."""


class SchemaBlockedError(ConfigError):
    """Raised when paid submission is blocked by missing verified schema evidence."""


@dataclass(frozen=True)
class ModelSpec:
    model_id: str
    status: str
    supports_submit: bool
    resolutions: tuple[str, ...]
    ratios: tuple[str, ...]
    duration_min: int
    duration_max: int
    fps: int
    rates_without_video: dict[str, float]
    rates_with_video: dict[str, float]
    dimensions: dict[str, dict[str, list[int]]]


@dataclass(frozen=True)
class AppConfig:
    api_key: str | None
    api_key_source: str | None
    used_deprecated_key: bool
    base_url: str
    model_id: str
    create_path: str
    retrieve_path: str
    list_path: str
    cancel_path: str
    timeout_seconds: float
    task_log_path: Path
    request_preview_dir: Path
    raw_response_dir: Path
    private_task_response_dir: Path
    outputs_dir: Path
    downloads_dir: Path
    schema_sample_path: Path
    defaults: dict[str, Any]
    models: dict[str, ModelSpec]

    @property
    def model(self) -> ModelSpec:
        try:
            return self.models[self.model_id]
        except KeyError as exc:
            raise ConfigError(f"Model is not configured: {self.model_id}") from exc


def utc_now() -> str:
    return dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat()


def load_dotenv_file() -> None:
    try:
        from dotenv import load_dotenv
    except ModuleNotFoundError:
        return
    load_dotenv(PROJECT_ROOT / ".env")


def read_json(path: Path) -> Any:
    try:
        with path.open("r", encoding="utf-8") as fh:
            return json.load(fh)
    except FileNotFoundError as exc:
        raise ConfigError(f"Required JSON file is missing: {path}") from exc
    except json.JSONDecodeError as exc:
        raise ConfigError(f"Malformed JSON in {path}: {exc.msg}") from exc


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp_path = path.with_suffix(path.suffix + ".tmp")
    with tmp_path.open("w", encoding="utf-8") as fh:
        json.dump(data, fh, indent=2, ensure_ascii=False, sort_keys=True)
        fh.write("\n")
    tmp_path.replace(path)


def append_jsonl(path: Path, data: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(data, ensure_ascii=False, sort_keys=True) + "\n")


def read_jsonl(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    rows: list[dict[str, Any]] = []
    with path.open("r", encoding="utf-8") as fh:
        for line_no, line in enumerate(fh, 1):
            line = line.strip()
            if not line:
                continue
            try:
                value = json.loads(line)
            except json.JSONDecodeError as exc:
                raise ConfigError(f"Malformed JSONL at {path}:{line_no}: {exc.msg}") from exc
            if isinstance(value, dict):
                rows.append(value)
    return rows


def normalize_url(value: str) -> str:
    parsed = urlparse(value)
    query = urlencode(sorted(parse_qsl(parsed.query, keep_blank_values=True)))
    return urlunparse((parsed.scheme.lower(), parsed.netloc.lower(), parsed.path, "", query, ""))


def safe_url_for_logs(value: str) -> str:
    parsed = urlparse(value)
    if not parsed.scheme or not parsed.netloc:
        return redact_text(value)
    query = "..." if parsed.query else ""
    return urlunparse((parsed.scheme, parsed.netloc, parsed.path, "", query, ""))


def redact_text(value: str) -> str:
    return SECRET_VALUE_RE.sub("[REDACTED]", value)


def redact_json(value: Any) -> Any:
    if isinstance(value, dict):
        out: dict[str, Any] = {}
        for key, item in value.items():
            if SECRET_KEY_RE.search(str(key)):
                out[key] = "[REDACTED]"
            elif str(key).lower() in {"url", "video_url", "output_url"} and isinstance(item, str):
                out[key] = safe_url_for_logs(item)
            else:
                out[key] = redact_json(item)
        return out
    if isinstance(value, list):
        return [redact_json(item) for item in value]
    if isinstance(value, str):
        return redact_text(value)
    return value


def load_models() -> dict[str, ModelSpec]:
    raw = read_json(CONFIG_DIR / "models.json")
    models: dict[str, ModelSpec] = {}
    for item in raw.get("models", []):
        model = ModelSpec(
            model_id=item["id"],
            status=item["status"],
            supports_submit=bool(item.get("supports_submit", False)),
            resolutions=tuple(item["resolutions"]),
            ratios=tuple(item["ratios"]),
            duration_min=int(item["duration_min"]),
            duration_max=int(item["duration_max"]),
            fps=int(item["fps"]),
            rates_without_video={k: float(v) for k, v in item.get("rates_without_video", {}).items()},
            rates_with_video={k: float(v) for k, v in item.get("rates_with_video", {}).items()},
            dimensions=item["dimensions"],
        )
        models[model.model_id] = model
    return models


def load_config(require_key: bool = False) -> AppConfig:
    load_dotenv_file()
    defaults = read_json(CONFIG_DIR / "defaults.json")
    models = load_models()
    api_key = os.getenv("ARK_API_KEY", "").strip() or None
    used_deprecated = False
    source = "ARK_API_KEY" if api_key else None
    if not api_key:
        legacy = os.getenv("BYTEPLUS_API_KEY", "").strip()
        if legacy:
            api_key = legacy
            source = "BYTEPLUS_API_KEY"
            used_deprecated = True

    if require_key and not api_key:
        raise ConfigError("ARK_API_KEY is missing. Paid/API actions require a local environment key.")

    base_url = os.getenv("BYTEPLUS_BASE_URL", defaults["base_url"]).rstrip("/")
    validate_base_url(base_url)
    model_id = os.getenv("BYTEPLUS_MODEL_ID", defaults["model_id"]).strip()
    if model_id not in models:
        raise ConfigError(f"Unsupported model ID: {model_id}")

    return AppConfig(
        api_key=api_key,
        api_key_source=source,
        used_deprecated_key=used_deprecated,
        base_url=base_url,
        model_id=model_id,
        create_path=os.getenv("BYTEPLUS_CREATE_TASK_PATH", defaults["create_path"]),
        retrieve_path=os.getenv("BYTEPLUS_RETRIEVE_TASK_PATH", defaults["retrieve_path"]),
        list_path=os.getenv("BYTEPLUS_LIST_TASKS_PATH", defaults["list_path"]),
        cancel_path=os.getenv("BYTEPLUS_CANCEL_TASK_PATH", defaults["cancel_path"]),
        timeout_seconds=float(defaults.get("timeout_seconds", 60)),
        task_log_path=PROJECT_ROOT / defaults.get("task_log_path", "data/tasks.jsonl"),
        request_preview_dir=PROJECT_ROOT / defaults.get("request_preview_dir", "outputs/request-previews"),
        raw_response_dir=PROJECT_ROOT / defaults.get("raw_response_dir", "outputs/raw-responses"),
        private_task_response_dir=PROJECT_ROOT / defaults.get(
            "private_task_response_dir",
            "outputs/private-responses",
        ),
        outputs_dir=PROJECT_ROOT / defaults.get("outputs_dir", "outputs"),
        downloads_dir=PROJECT_ROOT / defaults.get("downloads_dir", "downloads"),
        schema_sample_path=PROJECT_ROOT / defaults.get("schema_sample_path", "docs/official-rest-sample.redacted.json"),
        defaults=defaults,
        models=models,
    )


def validate_base_url(base_url: str) -> None:
    parsed = urlparse(base_url)
    if parsed.scheme != "https":
        raise ConfigError("BYTEPLUS_BASE_URL must use https.")
    if not parsed.netloc:
        raise ConfigError("BYTEPLUS_BASE_URL must include a host.")
    if parsed.netloc != "ark.ap-southeast.bytepluses.com":
        raise ConfigError(
            "BYTEPLUS_BASE_URL is not the currently verified AP-Southeast ModelArk data-plane host."
        )
    if not parsed.path.rstrip("/").endswith("/api/v3"):
        raise ConfigError("BYTEPLUS_BASE_URL must end with /api/v3.")


def build_url(config: AppConfig, path: str, **values: str) -> str:
    rendered = path.format(**values)
    return f"{config.base_url}/{rendered.lstrip('/')}"


def auth_headers(api_key: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}


def import_requests() -> Any:
    try:
        import requests
    except ModuleNotFoundError as exc:
        raise RuntimeError("Missing dependency requests. Install with: pip install -r requirements.txt") from exc
    return requests


def request_public_url(method: str, url: str, timeout: float, **kwargs: Any) -> Any:
    requests = import_requests()
    return requests.request(method, url, timeout=timeout, **kwargs)


def request_json(method: str, url: str, api_key: str, timeout: float, **kwargs: Any) -> dict[str, Any]:
    requests = import_requests()
    try:
        response = requests.request(method, url, headers=auth_headers(api_key), timeout=timeout, **kwargs)
    except requests.RequestException as exc:
        raise RuntimeError(f"Network request failed: {redact_text(str(exc))}") from exc
    if response.status_code >= 400:
        detail = redact_text(response.text[:1000])
        raise RuntimeError(f"HTTP {response.status_code}: BytePlus request failed. Response: {detail}")
    try:
        data = response.json()
    except ValueError as exc:
        raise RuntimeError("BytePlus returned a non-JSON response.") from exc
    if not isinstance(data, dict):
        raise RuntimeError("BytePlus returned JSON that is not an object.")
    return data


def contains_authorization_key(value: Any) -> bool:
    if isinstance(value, dict):
        return any(
            str(key).lower() == "authorization" or contains_authorization_key(item)
            for key, item in value.items()
        )
    if isinstance(value, list):
        return any(contains_authorization_key(item) for item in value)
    return False


def require_verified_schema(config: AppConfig) -> None:
    if not config.model.supports_submit:
        raise SchemaBlockedError(
            "Paid submission is blocked: model is not enabled for submit until official Playground sample is reviewed."
        )
    if not config.schema_sample_path.exists():
        raise SchemaBlockedError(
            "Paid submission is blocked: docs/official-rest-sample.redacted.json is missing."
        )
    sample = read_json(config.schema_sample_path)
    if sample.get("schema_status") not in CONTROLLED_CAPTURE_SCHEMA_STATUSES:
        raise SchemaBlockedError(
            "Paid submission is blocked: official REST sample is not approved for controlled response capture."
        )
    serialized = json.dumps(sample, ensure_ascii=False)
    if SECRET_VALUE_RE.search(serialized) or contains_authorization_key(sample):
        raise SchemaBlockedError("Paid submission is blocked: official sample appears to contain a secret.")


def verified_response_task_id_field(config: AppConfig) -> dict[str, str]:
    sample = read_json(config.schema_sample_path)
    verified_fields = sample.get("verified_fields", {}) if isinstance(sample, dict) else {}
    value = verified_fields.get("response_task_id_field")
    if not isinstance(value, dict) or value.get("status") != "VERIFIED_CAPTURED_RESPONSE":
        raise SchemaBlockedError("Task status checking is blocked: response task ID field is not verified.")
    if value.get("field") != VERIFIED_CREATE_TASK_ID_FIELD or value.get("json_path") != VERIFIED_CREATE_TASK_ID_PATH:
        raise SchemaBlockedError("Task status checking is blocked: response task ID field does not match verified $.id.")
    return {"field": VERIFIED_CREATE_TASK_ID_FIELD, "json_path": VERIFIED_CREATE_TASK_ID_PATH}


def verified_output_video_url_field(config: AppConfig) -> dict[str, str]:
    sample = read_json(config.schema_sample_path)
    verified_fields = sample.get("verified_fields", {}) if isinstance(sample, dict) else {}
    value = verified_fields.get("output_video_url_field")
    if not isinstance(value, dict) or value.get("status") != "VERIFIED_SUCCEEDED_TASK_RESPONSE":
        raise SchemaBlockedError("Download workflow is blocked: output video URL field is not verified.")
    if value.get("field") != VERIFIED_OUTPUT_VIDEO_URL_FIELD or value.get("json_path") != VERIFIED_OUTPUT_VIDEO_URL_PATH:
        raise SchemaBlockedError(
            "Download workflow is blocked: output video URL field does not match verified $.content.video_url."
        )
    return {"field": VERIFIED_OUTPUT_VIDEO_URL_FIELD, "json_path": VERIFIED_OUTPUT_VIDEO_URL_PATH}


def ensure_writable_directory(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)
    test_path = path / ".write-test"
    test_path.write_text("ok", encoding="utf-8")
    test_path.unlink()


def validate_public_url(value: str, label: str) -> None:
    parsed = urlparse(value)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise ConfigError(f"{label} must be an http(s) URL.")


def _normalized_hostname(parsed: Any, label: str) -> str:
    host = (parsed.hostname or "").strip().lower().rstrip(".")
    if not host:
        raise ConfigError(f"{label} must include a public hostname.")
    return host


def validate_public_image_url_structure(value: str, label: str = "--image-url") -> str:
    if not value or not value.strip():
        raise ConfigError(f"{label} is empty. Use a public HTTPS direct image URL.")
    parsed = urlparse(value.strip())
    if parsed.scheme != "https":
        raise ConfigError(f"{label} must use https.")
    if not parsed.netloc:
        raise ConfigError(f"{label} is malformed. Use a public HTTPS direct image URL.")
    if parsed.username or parsed.password:
        raise ConfigError(f"{label} must not contain embedded credentials.")
    host = _normalized_hostname(parsed, label)
    if host == "localhost" or host.endswith(".localhost") or host.endswith(".local"):
        raise ConfigError(f"{label} must not point to localhost or local-only hosts.")
    try:
        address = ipaddress.ip_address(host)
    except ValueError:
        address = None
    if address and (
        address.is_private
        or address.is_loopback
        or address.is_link_local
        or address.is_reserved
        or address.is_unspecified
        or address.is_multicast
    ):
        raise ConfigError(f"{label} must not point to private or internal IP ranges.")
    if host in {"github.com", "www.github.com"} and "/blob/" in parsed.path:
        raise ConfigError(f"{label} must be a direct image URL, not a GitHub blob page.")
    if host in {"drive.google.com", "docs.google.com"} or host.endswith(".drive.google.com"):
        raise ConfigError(f"{label} must be a direct image URL, not a Google Drive preview page.")
    if host in {"facebook.com", "www.facebook.com", "m.facebook.com", "instagram.com", "www.instagram.com"}:
        raise ConfigError(f"{label} must be a direct image URL, not a social media page URL.")
    return value.strip()


def _close_response(response: Any) -> None:
    close = getattr(response, "close", None)
    if callable(close):
        close()


def _validate_image_response(response: Any, label: str) -> dict[str, Any]:
    status_code = int(getattr(response, "status_code", 0) or 0)
    if status_code != 200:
        raise ConfigError(f"{label} returned HTTP {status_code}; expected 200.")
    final_url = getattr(response, "url", None)
    if final_url:
        validate_public_image_url_structure(str(final_url), label)
    headers = getattr(response, "headers", {}) or {}
    content_type = str(headers.get("content-type") or headers.get("Content-Type") or "").split(";", 1)[0].strip().lower()
    if content_type == "text/html":
        raise ConfigError(f"{label} points to an HTML page, not a direct image.")
    if content_type in {"application/json", "text/plain"}:
        raise ConfigError(f"{label} points to a non-image response: {content_type}.")
    if not content_type.startswith("image/"):
        raise ConfigError(f"{label} must return an image/* Content-Type.")
    if content_type not in ALLOWED_IMAGE_CONTENT_TYPES:
        allowed = ", ".join(sorted(ALLOWED_IMAGE_CONTENT_TYPES))
        raise ConfigError(f"{label} returned unsupported image type {content_type}; allowed: {allowed}.")
    return {"status_code": status_code, "content_type": content_type}


def validate_public_image_url(
    value: str,
    label: str = "--image-url",
    timeout: float = 10,
    requester: Any | None = None,
) -> dict[str, Any]:
    url = validate_public_image_url_structure(value, label)
    requester = requester or request_public_url
    try:
        response = requester("HEAD", url, allow_redirects=True, timeout=timeout)
    except Exception:
        response = None
    else:
        try:
            if int(getattr(response, "status_code", 0) or 0) not in HEAD_FALLBACK_STATUSES:
                result = _validate_image_response(response, label)
                print(f"Reference image URL validation passed for {label}: {result['content_type']}")
                return result
        finally:
            _close_response(response)

    try:
        response = requester(
            "GET",
            url,
            allow_redirects=True,
            timeout=timeout,
            stream=True,
            headers={"Range": "bytes=0-1023"},
        )
    except Exception as exc:
        raise ConfigError(f"{label} could not be validated as a public image URL.") from exc
    try:
        result = _validate_image_response(response, label)
        print(f"Reference image URL validation passed for {label}: {result['content_type']}")
        return result
    finally:
        _close_response(response)


def build_content(
    prompt: str,
    image_url: str | None,
    image_path: str | None,
    image_role: str = "reference_image",
    reference_image_urls: list[str] | None = None,
    reference_video_urls: list[str] | None = None,
    reference_audio_urls: list[str] | None = None,
) -> list[dict[str, Any]]:
    content: list[dict[str, Any]] = [{"type": "text", "text": prompt}]
    if image_url and image_path:
        raise ConfigError("Use only one of --image-url or --image-path.")
    if image_url:
        validate_public_image_url(image_url, "--image-url")
        image_item: dict[str, Any] = {"type": "image_url", "image_url": {"url": image_url}}
        if image_role:
            image_item["role"] = image_role
        content.append(image_item)
    if image_path:
        path = Path(image_path).expanduser()
        if not path.exists():
            raise ConfigError(f"Image path does not exist: {path}")
        raise ConfigError("Local image upload is blocked until the official upload/base64 flow is verified.")
    for url in reference_image_urls or []:
        validate_public_image_url(url, "--reference-image-url")
        content.append({"type": "image_url", "image_url": {"url": url}, "role": "reference_image"})
    for url in reference_video_urls or []:
        validate_public_url(url, "--reference-video-url")
        content.append({"type": "video_url", "video_url": {"url": url}, "role": "reference_video"})
    for url in reference_audio_urls or []:
        validate_public_url(url, "--reference-audio-url")
        content.append({"type": "audio_url", "audio_url": {"url": url}, "role": "reference_audio"})
    return content


def validate_generation_args(args: argparse.Namespace, config: AppConfig) -> None:
    model = config.model
    if args.resolution not in model.resolutions:
        raise ConfigError(f"Unsupported resolution for {model.model_id}: {args.resolution}")
    if args.ratio not in model.ratios:
        raise ConfigError(f"Unsupported ratio for {model.model_id}: {args.ratio}")
    if args.duration < model.duration_min or args.duration > model.duration_max:
        raise ConfigError(
            f"Unsupported duration for {model.model_id}: {args.duration}. "
            f"Allowed range is {model.duration_min}-{model.duration_max} seconds."
        )
    if args.frames is not None and args.duration is not None:
        raise ConfigError("Use duration for this toolkit; frames is intentionally blocked for cost clarity.")


def load_prompt(prompt: str | None, prompt_file: str | None) -> str:
    parts: list[str] = []
    if prompt:
        parts.append(prompt.strip())
    if prompt_file:
        parts.append(Path(prompt_file).expanduser().read_text(encoding="utf-8").strip())
    value = "\n\n".join(part for part in parts if part)
    if not value:
        raise ConfigError("Provide --prompt or --prompt-file.")
    return value


def build_create_payload(args: argparse.Namespace, config: AppConfig) -> dict[str, Any]:
    prompt = load_prompt(args.prompt, args.prompt_file)
    validate_generation_args(args, config)
    payload: dict[str, Any] = {
        "model": config.model_id,
        "content": build_content(
            prompt,
            args.image_url,
            args.image_path,
            image_role=getattr(args, "image_role", "reference_image"),
            reference_image_urls=getattr(args, "reference_image_url", None),
            reference_video_urls=getattr(args, "reference_video_url", None),
            reference_audio_urls=getattr(args, "reference_audio_url", None),
        ),
        "resolution": args.resolution,
        "ratio": args.ratio,
        "duration": args.duration,
        "generate_audio": bool(args.generate_audio),
        "watermark": bool(args.watermark),
    }
    if args.seed is not None:
        payload["seed"] = args.seed
    if args.execution_expires_after is not None:
        payload["execution_expires_after"] = args.execution_expires_after
    if args.safety_identifier:
        payload["safety_identifier"] = args.safety_identifier
    return payload


def prompt_hash(payload: dict[str, Any]) -> str:
    text_parts = [
        item.get("text", "")
        for item in payload.get("content", [])
        if isinstance(item, dict) and item.get("type") == "text"
    ]
    return hashlib.sha256("\n".join(text_parts).encode("utf-8")).hexdigest()


def input_identifier(payload: dict[str, Any]) -> str:
    ids: list[str] = []
    for item in payload.get("content", []):
        if item.get("type") == "image_url":
            ids.append("image:" + hashlib.sha256(normalize_url(item["image_url"]["url"]).encode()).hexdigest())
        elif item.get("type") == "video_url":
            ids.append("video:" + hashlib.sha256(normalize_url(item["video_url"]["url"]).encode()).hexdigest())
        elif item.get("type") == "audio_url":
            ids.append("audio:" + hashlib.sha256(normalize_url(item["audio_url"]["url"]).encode()).hexdigest())
    return ",".join(ids) if ids else "text-only"


def request_fingerprint(payload: dict[str, Any]) -> str:
    safe = {
        "model": payload.get("model"),
        "prompt_hash": prompt_hash(payload),
        "input_identifier": input_identifier(payload),
        "duration": payload.get("duration"),
        "resolution": payload.get("resolution"),
        "ratio": payload.get("ratio"),
        "generate_audio": payload.get("generate_audio"),
        "watermark": payload.get("watermark"),
    }
    encoded = json.dumps(safe, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(encoded.encode("utf-8")).hexdigest()


def estimate_tokens(config: AppConfig, resolution: str, ratio: str, duration: int, input_video_seconds: int = 0) -> int:
    model = config.model
    try:
        width, height = model.dimensions[resolution][ratio]
    except KeyError as exc:
        raise ConfigError(f"No dimensions configured for {resolution} {ratio}") from exc
    seconds = input_video_seconds + duration
    return int(round(seconds * width * height * model.fps / 1024))


def estimate_cost_usd(
    config: AppConfig,
    resolution: str,
    ratio: str,
    duration: int,
    input_has_video: bool = False,
    input_video_seconds: int = 0,
) -> dict[str, Any]:
    model = config.model
    rates = model.rates_with_video if input_has_video else model.rates_without_video
    if resolution not in rates:
        return {"status": "UNVERIFIED", "estimated_cost_usd": None, "reason": "No verified rate for this resolution."}
    tokens = estimate_tokens(config, resolution, ratio, duration, input_video_seconds)
    cost = tokens / 1_000_000 * rates[resolution]
    return {
        "status": "ESTIMATED",
        "rate_status": "VERIFIED",
        "token_formula_status": "VERIFIED",
        "estimated_tokens": tokens,
        "rate_usd_per_million_tokens": rates[resolution],
        "estimated_cost_usd": round(cost, 4),
        "billing_note": "Console billing and returned usage.completion_tokens are final.",
    }


def find_duplicate_submission(config: AppConfig, fingerprint: str, recent_hours: int = 24) -> dict[str, Any] | None:
    cutoff = dt.datetime.now(dt.timezone.utc) - dt.timedelta(hours=recent_hours)
    for row in reversed(read_jsonl(config.task_log_path)):
        if row.get("request_fingerprint") != fingerprint:
            continue
        status = str(row.get("status", "unknown")).lower()
        created_raw = row.get("created_at")
        try:
            created = dt.datetime.fromisoformat(str(created_raw))
        except ValueError:
            created = dt.datetime.now(dt.timezone.utc)
        if status in ACTIVE_STATUSES or created >= cutoff:
            return row
    return None


def extract_task_id(data: dict[str, Any]) -> str | None:
    value = data.get(VERIFIED_CREATE_TASK_ID_FIELD)
    return str(value) if value else None


def validate_task_id(task_id: str) -> str:
    normalized = task_id.strip()
    if not TASK_ID_RE.fullmatch(normalized):
        raise ConfigError("Task ID must match the verified BytePlus create-task ID format cgt-YYYYMMDDHHMMSS-suffix.")
    return normalized


def collect_task_id_candidates(data: Any, path: str = "$", _depth: int = 0) -> list[dict[str, str]]:
    if _depth > 20:
        return []
    candidates: list[dict[str, str]] = []
    if isinstance(data, dict):
        for key, value in data.items():
            child_path = f"{path}.{key}"
            if key in {"id", "task_id", "taskId"} and value not in (None, ""):
                candidates.append({"path": child_path, "field": key, "value": str(value)})
            candidates.extend(collect_task_id_candidates(value, child_path, _depth + 1))
    elif isinstance(data, list):
        for index, item in enumerate(data):
            candidates.extend(collect_task_id_candidates(item, f"{path}[{index}]", _depth + 1))
    return candidates


def parse_task_response(data: dict[str, Any]) -> dict[str, Any]:
    status = str(data.get("status", "unknown")).lower()
    content = data.get("content") if isinstance(data.get("content"), dict) else {}
    usage = data.get("usage") if isinstance(data.get("usage"), dict) else None
    return {
        "id": extract_task_id(data),
        "status": status,
        "video_url": content.get("video_url") if isinstance(content, dict) else None,
        "last_frame_url": content.get("last_frame_url") if isinstance(content, dict) else None,
        "resolution": data.get("resolution"),
        "ratio": data.get("ratio"),
        "duration": data.get("duration"),
        "frames": data.get("frames"),
        "fps": data.get("fps"),
        "generate_audio": data.get("generate_audio"),
        "usage": usage,
        "error": data.get("error"),
    }


def save_sanitized_response(config: AppConfig, task_id: str, data: dict[str, Any]) -> Path:
    path = config.raw_response_dir / f"{task_id}.sanitized.json"
    write_json(path, redact_json(data))
    return path


def save_create_response_capture(
    config: AppConfig,
    *,
    local_request_id: str,
    fingerprint: str,
    payload: dict[str, Any],
    cost: dict[str, Any],
    response: dict[str, Any],
) -> Path:
    capture = {
        "capture_type": "create_task_response",
        "captured_at": utc_now(),
        "local_request_id": local_request_id,
        "request_fingerprint": fingerprint,
        "model": payload.get("model"),
        "estimated_cost": cost,
        "redacted_request_preview": redact_json(payload),
        "redacted_create_task_response": redact_json(response),
        "task_id_field_candidates": collect_task_id_candidates(response),
        "response_task_id_status": "VERIFIED_CAPTURED_RESPONSE_FIELD_ID",
        "no_auto_poll_or_download": True,
    }
    path = config.outputs_dir / "create-response-captures" / f"{local_request_id}.json"
    write_json(path, capture)
    return path


def check_secret_patterns(paths: Iterable[Path]) -> list[str]:
    findings: list[str] = []
    for path in paths:
        text = path.read_text(encoding="utf-8", errors="ignore")
        if SECRET_VALUE_RE.search(text):
            findings.append(str(path.relative_to(PROJECT_ROOT)))
    return findings


def ffprobe_path() -> str | None:
    return shutil.which("ffprobe")


def new_local_request_id() -> str:
    return f"local-{uuid.uuid4().hex[:12]}"
