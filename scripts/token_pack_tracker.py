#!/usr/bin/env python3
"""Single-source local token resource pack tracking for WSTV Seedance."""

from __future__ import annotations

import datetime as dt
import hashlib
import math
from typing import Any

from common import AppConfig, ConfigError, append_jsonl, read_jsonl, utc_now


ADD_TOKEN_PACK_CONFIRMATION = "ADD_TOKEN_PACK"
PACKAGE_SIZES = {
    "1M": 1_000_000,
    "10M": 10_000_000,
    "100M": 100_000_000,
}
RESOLUTION_PRESETS: dict[str, dict[str, Any]] = {
    "720p": {
        "projected_tokens": 324_000,
        "payg_rate_usd_per_million": 7.0,
        "payg_cost_usd": 2.2680,
    },
    "1080p": {
        # BytePlus UI screenshot showed $5.6133 at $7/M for 1080p, which implies
        # 801,900 tokens. Keep this observed UI value instead of silently using
        # only the raw width * height * fps * duration / 1024 formula.
        "projected_tokens": 801_900,
        "payg_rate_usd_per_million": 7.0,
        "payg_cost_usd": 5.6133,
    },
}


def cost_usd(tokens: int | float, rate_usd_per_million_tokens: int | float) -> float:
    return round(float(tokens) * float(rate_usd_per_million_tokens) / 1_000_000, 4)


def resolution_preset(resolution: str) -> dict[str, Any]:
    try:
        return dict(RESOLUTION_PRESETS[resolution])
    except KeyError as exc:
        raise ConfigError("Resolution must be 720p or 1080p for the token pack tracker.") from exc


def package_size_tokens(package_size: str) -> int:
    try:
        return PACKAGE_SIZES[package_size]
    except KeyError as exc:
        raise ConfigError("Package size must be 1M, 10M, or 100M.") from exc


def build_pack_entry(
    *,
    model: str,
    package_size: str,
    quantity: int,
    total_price_usd: float,
    purchase_date: str,
    validity_days: int = 90,
    note: str = "",
    source: str = "manual_console_entry",
) -> dict[str, Any]:
    if int(quantity) <= 0:
        raise ConfigError("Token pack quantity must be greater than 0.")
    if float(total_price_usd) <= 0:
        raise ConfigError("Token pack total price must be greater than 0.")
    if int(validity_days) <= 0:
        raise ConfigError("Token pack validity days must be greater than 0.")
    purchased = dt.date.fromisoformat(purchase_date)
    size_tokens = package_size_tokens(package_size)
    total_tokens = size_tokens * int(quantity)
    effective_rate = round(float(total_price_usd) / (total_tokens / 1_000_000), 4)
    fingerprint = f"{model}|{package_size}|{quantity}|{total_price_usd}|{purchase_date}|{total_tokens}"
    return {
        "id": "pack-" + hashlib.sha256(fingerprint.encode()).hexdigest()[:16],
        "created_at": utc_now(),
        "purchase_date": purchased.isoformat(),
        "expiry_date": (purchased + dt.timedelta(days=int(validity_days))).isoformat(),
        "model": model,
        "package_size": package_size,
        "package_size_tokens": size_tokens,
        "quantity": int(quantity),
        "total_purchased_tokens": total_tokens,
        "total_price_usd": round(float(total_price_usd), 4),
        "effective_rate_usd_per_million": effective_rate,
        "validity_days": int(validity_days),
        "status": "active",
        "source": source,
        "note": note,
    }


def read_pack_ledger(config: AppConfig) -> list[dict[str, Any]]:
    return read_jsonl(config.token_pack_ledger_path)


def is_duplicate_pack(existing: dict[str, Any], entry: dict[str, Any]) -> bool:
    return (
        existing.get("id") == entry.get("id")
        or (
            existing.get("model") == entry.get("model")
            and existing.get("package_size") == entry.get("package_size")
            and int(existing.get("quantity") or -1) == int(entry.get("quantity") or -2)
            and str(existing.get("purchase_date")) == str(entry.get("purchase_date"))
            and int(existing.get("total_purchased_tokens") or -1) == int(entry.get("total_purchased_tokens") or -2)
        )
    )


def append_pack_entry(config: AppConfig, entry: dict[str, Any]) -> bool:
    for existing in read_pack_ledger(config):
        if is_duplicate_pack(existing, entry):
            return False
    append_jsonl(config.token_pack_ledger_path, entry)
    return True


def active_packs(config: AppConfig) -> list[dict[str, Any]]:
    today = dt.date.today()
    packs = []
    for entry in read_pack_ledger(config):
        if entry.get("status") != "active":
            continue
        try:
            expiry = dt.date.fromisoformat(str(entry.get("expiry_date")))
        except ValueError:
            continue
        if expiry >= today:
            packs.append(entry)
    return packs


def combined_active_pack(config: AppConfig) -> dict[str, Any] | None:
    packs = active_packs(config)
    if not packs:
        return None
    total_tokens = sum(int(pack.get("total_purchased_tokens") or 0) for pack in packs)
    total_price = round(sum(float(pack.get("total_price_usd") or 0) for pack in packs), 4)
    if total_tokens <= 0 or total_price <= 0:
        return None
    return {
        "model": packs[0].get("model", "Dreamina-Seedance-2.0"),
        "package_size": "combined",
        "quantity": len(packs),
        "total_purchased_tokens": total_tokens,
        "total_price_usd": total_price,
        "effective_rate_usd_per_million": round(total_price / (total_tokens / 1_000_000), 4),
        "purchase_date": min(str(pack.get("purchase_date") or "") for pack in packs),
        "expiry_date": max(str(pack.get("expiry_date") or "") for pack in packs),
        "status": "active",
        "packs": packs,
    }


def counts_toward_token_pack(entry: dict[str, Any]) -> bool:
    if entry.get("action") != "paid":
        return False
    if entry.get("status") == "ok":
        return True
    return entry.get("token_source") in {"actual", "actual_from_console"}


def usage_summary(entries: list[dict[str, Any]], *, pack_total_tokens: int, pack_rate: float | None) -> dict[str, Any]:
    usage_entries = [entry for entry in entries if counts_toward_token_pack(entry)]
    actual_tokens = sum(
        int(entry.get("token_count") or 0)
        for entry in usage_entries
        if str(entry.get("token_source")) in {"actual", "actual_from_console"}
    )
    estimated_tokens = sum(
        int(entry.get("token_count") or 0)
        for entry in usage_entries
        if str(entry.get("token_source")) == "estimated"
    )
    total_used = actual_tokens + estimated_tokens
    remaining = max(0, int(pack_total_tokens) - total_used)
    rate = float(pack_rate or 0)
    return {
        "videos_recorded": len(usage_entries),
        "actual_tokens_used": actual_tokens,
        "estimated_tokens_used": estimated_tokens,
        "total_used_tokens": total_used,
        "remaining_tokens": remaining,
        "used_value_usd": cost_usd(total_used, rate) if rate else None,
        "remaining_value_usd": cost_usd(remaining, rate) if rate else None,
    }


def resolution_comparison(*, pack_total_tokens: int, remaining_tokens: int, pack_rate: float | None) -> list[dict[str, Any]]:
    rows = []
    rate = float(pack_rate or 0)
    for resolution in ("720p", "1080p"):
        preset = resolution_preset(resolution)
        tokens = int(preset["projected_tokens"])
        rows.append(
            {
                "resolution": resolution,
                "tokens": tokens,
                "payg_cost_usd": preset["payg_cost_usd"],
                "pack_cost_per_video_usd": cost_usd(tokens, rate) if rate else None,
                "total_videos_possible": math.floor(int(pack_total_tokens) / tokens) if pack_total_tokens else 0,
                "remaining_videos_possible": math.floor(int(remaining_tokens) / tokens) if remaining_tokens else 0,
                "tokens_after_next": int(remaining_tokens) - tokens,
                "warning": "Not enough active tokens for next selected resolution." if remaining_tokens < tokens else "",
            }
        )
    return rows


def token_pack_summary(
    config: AppConfig,
    *,
    resolution: str,
    usage_entries: list[dict[str, Any]],
) -> dict[str, Any]:
    selected = resolution_preset(resolution)
    active = combined_active_pack(config)
    pack_total = int(active.get("total_purchased_tokens") or 0) if active else 0
    pack_rate = float(active.get("effective_rate_usd_per_million") or 0) if active else None
    usage = usage_summary(usage_entries, pack_total_tokens=pack_total, pack_rate=pack_rate)
    comparison = resolution_comparison(
        pack_total_tokens=pack_total,
        remaining_tokens=int(usage["remaining_tokens"]),
        pack_rate=pack_rate,
    )
    selected_tokens = int(selected["projected_tokens"])
    selected_row = next(row for row in comparison if row["resolution"] == resolution)
    warnings: list[str] = []
    blocking_warnings: list[str] = []
    if not active:
        message = "Add token resource pack to track remaining videos."
        warnings.extend(["No active token pack recorded.", message])
    if resolution == "1080p":
        warnings.append("1080p uses more than 2x 720p tokens. Use 720p for testing.")
    if active and usage["remaining_tokens"] < selected_tokens:
        message = "Not enough active tokens for next selected resolution."
        warnings.append(message)
        blocking_warnings.append(message)
    return {
        "selected_resolution": resolution,
        "pack_summary": active,
        "pack_summary_table": active["packs"] if active else [],
        "usage_summary": usage,
        "resolution_comparison": comparison,
        "recent_usage": list(reversed([entry for entry in usage_entries if entry.get("action") == "paid"]))[:25],
        "warnings": warnings,
        "blocking_warnings": blocking_warnings,
        "can_cover_next_video": bool(active) and usage["remaining_tokens"] >= selected_tokens,
        "dry_run_estimate": {
            "resolution": resolution,
            "projected_tokens": selected_tokens,
            "payg_rate_usd_per_million": selected["payg_rate_usd_per_million"],
            "payg_cost_usd": selected["payg_cost_usd"],
            "pack_cost_per_video_usd": selected_row["pack_cost_per_video_usd"],
        },
        # Backward-compatible shape for existing dashboard rendering.
        "token_pack_tracker": {
            "selected_resolution": resolution,
            "selected_projected_tokens": selected_tokens,
            "selected_payg_cost_usd": selected["payg_cost_usd"],
            "selected_pack_cost_per_video_usd": selected_row["pack_cost_per_video_usd"],
            "remaining_tokens": usage["remaining_tokens"],
            "tokens_after_next_video": usage["remaining_tokens"] - selected_tokens,
            "remaining_videos_possible": selected_row["remaining_videos_possible"],
            "effective_pack_rate_usd_per_million": pack_rate,
            "comparison": comparison,
            "insufficient_tokens": bool(active) and usage["remaining_tokens"] < selected_tokens,
        },
    }
