#!/usr/bin/env python3
"""Estimate Seedance 2.0 token and USD cost from verified model-specific docs."""

from __future__ import annotations

import argparse
import json
import sys

from common import ConfigError, estimate_cost_usd, estimate_tokens, load_config


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Estimate BytePlus Seedance video generation cost.")
    parser.add_argument("--model", default=None, help="Model ID. Defaults to configured model.")
    parser.add_argument("--duration", type=int, default=15)
    parser.add_argument("--resolution", default="720p")
    parser.add_argument("--ratio", default="9:16")
    parser.add_argument("--input-has-video", action="store_true")
    parser.add_argument("--input-video-seconds", type=int, default=0)
    parser.add_argument("--max-cost-usd", type=float, help="Optional threshold check.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        config = load_config(require_key=False)
        if args.model:
            config = config.__class__(**{**config.__dict__, "model_id": args.model})
        estimate = estimate_cost_usd(
            config,
            args.resolution,
            args.ratio,
            args.duration,
            input_has_video=args.input_has_video,
            input_video_seconds=args.input_video_seconds,
        )
        output = {
            "model": config.model_id,
            "resolution": args.resolution,
            "ratio": args.ratio,
            "duration": args.duration,
            "input_has_video": args.input_has_video,
            "estimate": estimate,
            "assumptions": [
                "Token estimate = (input video seconds + output seconds) * width * height * fps / 1024.",
                "For video models, official docs say input tokens are 0 and total_tokens = completion_tokens after the call.",
                "Console billing and returned usage are final.",
            ],
        }
        if args.max_cost_usd is not None and estimate.get("estimated_cost_usd") is not None:
            output["max_cost_check"] = {
                "max_cost_usd": args.max_cost_usd,
                "passes": estimate["estimated_cost_usd"] <= args.max_cost_usd,
            }
        print(json.dumps(output, indent=2, ensure_ascii=False))
        if output.get("max_cost_check", {}).get("passes") is False:
            return 2
        return 0
    except (ConfigError, RuntimeError) as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
