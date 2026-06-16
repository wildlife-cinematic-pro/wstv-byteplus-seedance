#!/usr/bin/env python3
"""Local-only WSTV cost ledger and budget helpers."""

from __future__ import annotations

import datetime as dt
import math
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

import token_pack_tracker
from common import (
    AppConfig,
    ConfigError,
    append_jsonl,
    estimate_cost_usd,
    read_json,
    read_jsonl,
    utc_now,
    write_json,
)


DEFAULT_BUDGET_SETTINGS = {
    "total_budget_usd": 50.0,
    "daily_budget_usd": None,
    "monthly_budget_usd": None,
}
cost_usd = token_pack_tracker.cost_usd
resolution_preset = token_pack_tracker.resolution_preset


def actual_completion_tokens(response: dict[str, Any]) -> int | None:
    usage = response.get("usage")
    if not isinstance(usage, dict):
        return None
    value = usage.get("completion_tokens")
    if isinstance(value, int) and value >= 0:
        return value
    return None


def image_url_host(payload: dict[str, Any]) -> str:
    for item in payload.get("content", []):
        if not isinstance(item, dict) or item.get("type") != "image_url":
            continue
        image_url = item.get("image_url")
        if isinstance(image_url, dict):
            host = urlparse(str(image_url.get("url", ""))).netloc.lower()
            return host
    return ""


def ledger_entry(
    *,
    config: AppConfig,
    payload: dict[str, Any],
    estimated_cost: dict[str, Any],
    response: dict[str, Any],
    status: str,
    output_path: Path,
    task_id: str | None = None,
    error_category: str | None = None,
) -> dict[str, Any]:
    actual_tokens = actual_completion_tokens(response)
    if actual_tokens is not None:
        tokens = actual_tokens
        token_source = "actual"
    else:
        tokens = int(estimated_cost.get("estimated_tokens") or 0)
        token_source = "estimated" if tokens else "unknown"
    rate = float(estimated_cost.get("rate_usd_per_million_tokens") or 0)
    calculated = cost_usd(tokens, rate) if tokens and rate else None
    return {
        "timestamp": utc_now(),
        "action": "paid",
        "status": status,
        "model": payload.get("model"),
        "duration": payload.get("duration"),
        "resolution": payload.get("resolution"),
        "aspect_ratio": payload.get("ratio"),
        "generate_audio": bool(payload.get("generate_audio")),
        "output_filename": output_path.name,
        "final_downloaded_mp4_path": str(output_path),
        "token_count": tokens,
        "token_source": token_source,
        "rate_usd_per_million_tokens": rate,
        "calculated_cost_usd": calculated,
        "image_url_host": image_url_host(payload),
        "task_id": task_id or response.get("id"),
        "error_category": error_category,
        "billing_note": "Dashboard cost is local; BytePlus Console Billing remains final.",
    }


def manual_backfill_entry(
    *,
    date: str,
    model: str,
    output_path: Path,
    tokens: int,
    rate_usd_per_million_tokens: float,
    source_note: str,
    status: str = "ok",
) -> dict[str, Any]:
    parsed_date = dt.date.fromisoformat(date)
    return {
        "timestamp": f"{parsed_date.isoformat()}T00:00:00+00:00",
        "action": "paid",
        "entry_type": "manual_backfill",
        "status": status,
        "model": model,
        "duration": None,
        "resolution": None,
        "aspect_ratio": None,
        "generate_audio": None,
        "output_filename": output_path.name,
        "final_downloaded_mp4_path": str(output_path),
        "token_count": int(tokens),
        "token_source": "actual_from_console",
        "rate_usd_per_million_tokens": float(rate_usd_per_million_tokens),
        "calculated_cost_usd": cost_usd(tokens, rate_usd_per_million_tokens),
        "image_url_host": "",
        "task_id": None,
        "error_category": None,
        "source_note": source_note,
        "billing_note": "Manual backfill from BytePlus Console usage. Console Billing remains final.",
    }


def manual_usage_entry(
    *,
    date: str,
    filename: str,
    model: str,
    resolution: str,
    tokens: int,
    token_source: str,
    note: str,
    status: str = "ok",
    rate_usd_per_million_tokens: float = 7.0,
) -> dict[str, Any]:
    token_pack_tracker.resolution_preset(resolution)
    if token_source not in {"actual_from_console", "estimated"}:
        raise ConfigError("Manual usage token_source must be actual_from_console or estimated.")
    if status not in {"ok", "failed", "unknown"}:
        raise ConfigError("Manual usage status must be ok, failed, or unknown.")
    parsed_date = dt.date.fromisoformat(date)
    safe_filename = Path(filename).name
    if not safe_filename or safe_filename in {".", ".."} or Path(filename).name != filename:
        raise ConfigError("Manual usage filename must be a simple filename.")
    if not safe_filename.lower().endswith(".mp4"):
        raise ConfigError("Manual usage filename must end with .mp4.")
    if int(tokens) <= 0:
        raise ConfigError("Manual usage tokens must be positive.")
    return {
        "timestamp": f"{parsed_date.isoformat()}T00:00:00+00:00",
        "action": "paid",
        "entry_type": "manual_usage",
        "status": status,
        "model": model,
        "duration": 15,
        "resolution": resolution,
        "aspect_ratio": "9:16",
        "generate_audio": True,
        "output_filename": safe_filename,
        "final_downloaded_mp4_path": "",
        "token_count": int(tokens),
        "token_source": token_source,
        "rate_usd_per_million_tokens": float(rate_usd_per_million_tokens),
        "calculated_cost_usd": cost_usd(tokens, rate_usd_per_million_tokens),
        "image_url_host": "",
        "task_id": None,
        "error_category": None,
        "source_note": note,
        "billing_note": "Manual local usage entry. BytePlus Console Billing remains final.",
    }


def read_ledger(config: AppConfig) -> list[dict[str, Any]]:
    return read_jsonl(config.cost_ledger_path)


def is_duplicate_entry(existing: dict[str, Any], entry: dict[str, Any]) -> bool:
    if existing.get("action") != "paid":
        return False
    if entry.get("task_id") and existing.get("task_id") == entry.get("task_id"):
        return True
    existing_date = str(existing.get("timestamp", ""))[:10]
    entry_date = str(entry.get("timestamp", ""))[:10]
    if (
        existing.get("output_filename") == entry.get("output_filename")
        and existing_date == entry_date
        and int(existing.get("token_count") or -1) == int(entry.get("token_count") or -2)
    ):
        return True
    return (
        existing.get("output_filename") == entry.get("output_filename")
        and existing.get("final_downloaded_mp4_path") == entry.get("final_downloaded_mp4_path")
        and existing.get("status") == entry.get("status")
    )


def append_ledger_entry(config: AppConfig, entry: dict[str, Any]) -> bool:
    for existing in read_ledger(config):
        if is_duplicate_entry(existing, entry):
            return False
    append_jsonl(config.cost_ledger_path, entry)
    return True


def counts_toward_token_pack(entry: dict[str, Any]) -> bool:
    return token_pack_tracker.counts_toward_token_pack(entry)


def usage_summary(entries: list[dict[str, Any]], *, pack_total_tokens: int, pack_rate: float) -> dict[str, Any]:
    return token_pack_tracker.usage_summary(entries, pack_total_tokens=pack_total_tokens, pack_rate=pack_rate)


def load_budget_settings(config: AppConfig) -> dict[str, float | None]:
    if not config.budget_settings_path.exists():
        return dict(DEFAULT_BUDGET_SETTINGS)
    data = read_json(config.budget_settings_path)
    return normalize_budget_settings(data)


def normalize_budget_settings(data: dict[str, Any]) -> dict[str, float | None]:
    out: dict[str, float | None] = {}
    for key in ("total_budget_usd", "daily_budget_usd", "monthly_budget_usd"):
        value = data.get(key)
        if value in (None, ""):
            out[key] = None
        else:
            try:
                parsed = round(float(value), 2)
            except (TypeError, ValueError) as exc:
                raise ConfigError(f"{key} must be a number or blank.") from exc
            if parsed < 0:
                raise ConfigError(f"{key} cannot be negative.")
            out[key] = parsed
    return out


def save_budget_settings(config: AppConfig, data: dict[str, Any]) -> dict[str, float | None]:
    settings = normalize_budget_settings(data)
    write_json(config.budget_settings_path, settings)
    return settings


def reset_budget_settings(config: AppConfig) -> dict[str, float | None]:
    if config.budget_settings_path.exists():
        config.budget_settings_path.unlink()
    return dict(DEFAULT_BUDGET_SETTINGS)


def _parse_timestamp(value: Any) -> dt.datetime | None:
    try:
        parsed = dt.datetime.fromisoformat(str(value))
    except ValueError:
        return None
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=dt.timezone.utc)
    return parsed


def filter_entries(entries: list[dict[str, Any]], period: str) -> list[dict[str, Any]]:
    if period == "all":
        return entries
    now = dt.datetime.now(dt.timezone.utc)
    filtered = []
    for entry in entries:
        timestamp = _parse_timestamp(entry.get("timestamp"))
        if timestamp is None:
            continue
        if period == "today" and timestamp.date() == now.date():
            filtered.append(entry)
        elif period == "month" and timestamp.year == now.year and timestamp.month == now.month:
            filtered.append(entry)
    return filtered


def next_video_estimate(config: AppConfig, resolution: str = "720p") -> dict[str, Any]:
    return estimate_cost_usd(config, resolution, "9:16", 15)


def budget_summary(
    config: AppConfig,
    *,
    period: str = "all",
    budget_settings: dict[str, Any] | None = None,
    resolution: str = "720p",
) -> dict[str, Any]:
    resolution_preset(resolution)
    settings = normalize_budget_settings(budget_settings or load_budget_settings(config))
    entries = filter_entries(read_ledger(config), period)
    paid = [entry for entry in entries if entry.get("action") == "paid"]
    billable = [entry for entry in paid if counts_toward_token_pack(entry)]
    successes = [entry for entry in paid if entry.get("status") == "ok"]
    failed = [entry for entry in paid if entry.get("status") == "failed"]
    spent = round(sum(float(entry.get("calculated_cost_usd") or 0) for entry in billable), 4)
    success_spent = round(sum(float(entry.get("calculated_cost_usd") or 0) for entry in successes), 4)
    token_summary = token_pack_tracker.token_pack_summary(config, resolution=resolution, usage_entries=paid)
    usage = token_summary["usage_summary"]
    total_tokens = usage["total_used_tokens"]
    average = round(success_spent / len(successes), 4) if successes else None
    estimate = next_video_estimate(config, resolution)
    next_cost = estimate.get("estimated_cost_usd")
    total_budget = settings.get("total_budget_usd")
    remaining = round(total_budget - spent, 4) if total_budget is not None else None
    basis = average or next_cost
    estimated_more = None
    if remaining is not None and basis:
        estimated_more = max(0, math.floor(remaining / float(basis)))
    warnings: list[str] = []
    blocking_warnings: list[str] = []
    if remaining is not None and next_cost is not None and float(next_cost) > remaining:
        message = "Next estimated video cost is higher than remaining total budget."
        warnings.append(message)
        blocking_warnings.append(message)
    today_spent = round(
        sum(
            float(entry.get("calculated_cost_usd") or 0)
            for entry in filter_entries(read_ledger(config), "today")
            if counts_toward_token_pack(entry)
        ),
        4,
    )
    month_spent = round(
        sum(
            float(entry.get("calculated_cost_usd") or 0)
            for entry in filter_entries(read_ledger(config), "month")
            if counts_toward_token_pack(entry)
        ),
        4,
    )
    if settings.get("daily_budget_usd") is not None and today_spent > float(settings["daily_budget_usd"]):
        message = "Daily budget is exceeded."
        warnings.append(message)
        blocking_warnings.append(message)
    if settings.get("monthly_budget_usd") is not None and month_spent > float(settings["monthly_budget_usd"]):
        message = "Monthly budget is exceeded."
        warnings.append(message)
        blocking_warnings.append(message)
    warnings.extend(token_summary["warnings"])
    blocking_warnings.extend(token_summary["blocking_warnings"])
    if usage["videos_recorded"] == 1:
        warnings.append("Only 1 paid video is recorded locally. Add missing Console usage if you already made more videos.")
    out = {
        "period": period,
        "selected_resolution": resolution,
        "budget_settings": settings,
        "total_spent_usd": spent,
        "remaining_budget_usd": remaining,
        "paid_videos_generated": len(paid),
        "successful_paid_videos": len(successes),
        "failed_paid_attempts": len(failed),
        "total_tokens_used": total_tokens,
        "usage_summary": usage,
        "average_cost_per_successful_video": average,
        "next_video_estimated_cost_usd": next_cost,
        "next_video_estimate": estimate,
        "estimated_more_videos_possible": estimated_more,
        "today_spent_usd": today_spent,
        "month_spent_usd": month_spent,
        "warnings": warnings,
        "blocking_warnings": blocking_warnings,
        "ledger_path": str(config.cost_ledger_path),
        "ledger_folder": str(config.cost_ledger_path.parent),
        "token_pack_ledger_path": str(config.token_pack_ledger_path),
        "video_folder": str(config.downloads_dir),
        "helper_text": "Dashboard cost is calculated from local ledger and verified token rate. BytePlus Console Billing remains the final source of truth.",
    }
    out.update(token_summary)
    out["warnings"] = warnings
    out["blocking_warnings"] = blocking_warnings
    out["recent_paid_history"] = token_summary["recent_usage"]
    return out
