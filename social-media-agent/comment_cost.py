"""
Cost and usage logging for comment replies.

Pricing changes over time, so the logger stores raw token counts first. If
COMMENT_INPUT_USD_PER_MTOK and COMMENT_OUTPUT_USD_PER_MTOK are configured, it
also writes an estimated USD cost.
"""
from __future__ import annotations

import json
import os
from datetime import datetime
from pathlib import Path
from typing import Any

import config


def usage_log_path() -> Path:
    return Path(config.OUTPUT_DIR) / "comment_reply_usage.jsonl"


def usage_to_dict(usage: Any) -> dict:
    if usage is None:
        return {}
    if isinstance(usage, dict):
        return dict(usage)
    fields = (
        "input_tokens",
        "output_tokens",
        "cache_creation_input_tokens",
        "cache_read_input_tokens",
    )
    return {field: getattr(usage, field) for field in fields if getattr(usage, field, None) is not None}


def merge_usage(usages: list[dict]) -> dict:
    total: dict[str, int] = {}
    for usage in usages:
        for key, value in usage.items():
            if isinstance(value, int):
                total[key] = total.get(key, 0) + value
    return total


def estimate_cost_usd(usage: dict) -> float | None:
    input_price = os.getenv("COMMENT_INPUT_USD_PER_MTOK")
    output_price = os.getenv("COMMENT_OUTPUT_USD_PER_MTOK")
    if not input_price or not output_price:
        return None
    try:
        input_per_mtok = float(input_price)
        output_per_mtok = float(output_price)
    except ValueError:
        return None

    input_tokens = usage.get("input_tokens", 0) + usage.get("cache_creation_input_tokens", 0)
    cache_read_tokens = usage.get("cache_read_input_tokens", 0)
    output_tokens = usage.get("output_tokens", 0)

    cache_read_discount = float(os.getenv("COMMENT_CACHE_READ_DISCOUNT", "0.1"))
    cost = (
        input_tokens / 1_000_000 * input_per_mtok
        + cache_read_tokens / 1_000_000 * input_per_mtok * cache_read_discount
        + output_tokens / 1_000_000 * output_per_mtok
    )
    return round(cost, 8)


def record_comment_reply_usage(
    *,
    comment_id: str,
    route: str,
    model: str | None,
    usage_events: list[dict] | None = None,
    quality_score: int | None = None,
    final_chars: int | None = None,
    template_key: str | None = None,
    regenerated: int = 0,
) -> None:
    usage = merge_usage(usage_events or [])
    event = {
        "created_at": datetime.now().isoformat(),
        "comment_id": comment_id,
        "route": route,
        "model": model,
        "template_key": template_key,
        "usage": usage,
        "estimated_cost_usd": estimate_cost_usd(usage),
        "quality_score": quality_score,
        "final_chars": final_chars,
        "regenerated": regenerated,
    }
    config.OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    with open(usage_log_path(), "a", encoding="utf-8") as f:
        f.write(json.dumps(event, ensure_ascii=False) + "\n")
