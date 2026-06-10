#!/usr/bin/env python3
"""Estimate WSTV Seedance token costs."""

import argparse


DEFAULT_PRICE_PER_MILLION_TOKENS = 7.0


def calculate_cost(total_tokens: float, price_per_million_tokens: float) -> float:
    return total_tokens / 1_000_000 * price_per_million_tokens


def money(value: float) -> str:
    return f"${value:.4f}"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Calculate BytePlus token-based video generation cost.")
    parser.add_argument("--tokens", type=float, required=True, help="Total tokens for one video attempt.")
    parser.add_argument(
        "--price",
        type=float,
        default=DEFAULT_PRICE_PER_MILLION_TOKENS,
        help="USD price per 1M tokens. Default: 7.0.",
    )
    parser.add_argument("--attempts", type=int, default=1, help="Custom attempts per video. Default: 1.")
    parser.add_argument("--daily-reels", type=int, default=1, help="Custom daily reels projection. Default: 1.")
    parser.add_argument("--days", type=int, default=30, help="Custom projection days. Default: 30.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    one_attempt = calculate_cost(args.tokens, args.price)
    three_attempts = one_attempt * 3
    thirty_day_cost = one_attempt * args.daily_reels * 30
    sixty_videos_cost = one_attempt * 60
    custom_attempts = one_attempt * args.attempts
    custom_projection = one_attempt * args.daily_reels * args.days

    print("WSTV BytePlus Seedance Cost Estimate")
    print(f"Formula: cost = total_tokens / 1_000_000 * price_per_million_tokens")
    print(f"Tokens per attempt: {args.tokens:g}")
    print(f"Price per 1M tokens: ${args.price:g}")
    print(f"Cost for 1 attempt: {money(one_attempt)}")
    print(f"Cost for 3 attempts: {money(three_attempts)}")
    print(f"30-day cost ({args.daily_reels} daily reel(s)): {money(thirty_day_cost)}")
    print(f"60 videos/month cost: {money(sixty_videos_cost)}")
    print(f"Custom attempts ({args.attempts}): {money(custom_attempts)}")
    print(f"Custom projection ({args.daily_reels} daily reel(s) for {args.days} day(s)): {money(custom_projection)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
