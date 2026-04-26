"""
Reply strategy for social comments.

This module decides how expensive the reply path should be before any AI call.
Simple comments can use deterministic templates, sensitive comments get richer
AI handling, and low-signal comments can be skipped.
"""
from __future__ import annotations

import os
import re
from dataclasses import asdict, dataclass

from comment_policy import should_offer_comment_link


@dataclass(frozen=True)
class ReplyStrategy:
    route: str              # no_reply | template | ai_cheap | ai_sensitive | human_review
    context_type: str
    tone: str
    max_chars: int
    max_tokens: int
    model_tier: str         # none | fast | standard | pro
    allow_link: bool
    allowed_url: str | None
    tool_name: str | None
    template_key: str
    quality_threshold: int
    reason: str
    brief: str

    def to_dict(self) -> dict:
        return asdict(self)


ZODIAC_WORDS = {
    "beran", "býk", "byk", "blíženci", "blizenci", "rak", "lev", "panna",
    "váhy", "vahy", "štír", "stir", "střelec", "strelec", "kozoroh",
    "vodnář", "vodnar", "ryby",
}

QUESTION_HINTS = (
    "jak", "co", "kdy", "kde", "proč", "proc", "může", "muze", "můžu",
    "muzu", "porad", "poraď", "znamená", "znamena", "vyklad", "výklad",
)

PRAISE_HINTS = (
    "děkuji", "dekuji", "díky", "diky", "super", "krásn", "krasn",
    "skvěl", "skvel", "úžas", "uzas", "pravda", "přesn", "presn",
)

HUMOR_HINTS = ("haha", "hehe", "lol", ":d")


def _clean(text: str) -> str:
    return re.sub(r"\s+", " ", (text or "").strip())


def classify_comment_context(message: str, db_sentiment: str = "") -> str:
    """Small deterministic classifier used before deciding the cost path."""
    text = _clean(message).lower()
    if not text:
        return "empty"
    if db_sentiment in {"spam", "low_signal", "off_topic", "emotional", "crisis", "rude", "skeptical"}:
        return db_sentiment
    if len(text) <= 3:
        return "low_signal"
    if any(h in text for h in HUMOR_HINTS) or "😂" in text or "🤣" in text:
        return "humor"
    if any(h in text for h in PRAISE_HINTS):
        return "pochvala"
    if "?" in text or any(text.startswith(h + " ") for h in QUESTION_HINTS):
        return "otazka"
    tokens = {t.strip(".,!?;:()[]{}") for t in text.split()}
    if tokens & ZODIAC_WORDS:
        return "identifikace_znameni" if len(text) <= 40 else "prinos_znameni"
    return "neutral"


def _tone_for(context_type: str) -> str:
    return {
        "emotional": "empathetic",
        "crisis": "empathetic",
        "rude": "calm",
        "skeptical": "calm",
        "otazka": "educational",
        "pochvala": "warm",
        "humor": "light",
    }.get(context_type, "friendly")


def _route_for(context_type: str, message: str, db_sentiment: str) -> tuple[str, str, int, int, int]:
    """Return route, template_key, max_chars, max_tokens, quality_threshold."""
    if context_type in {"empty", "low_signal"}:
        return "no_reply", "", 0, 0, 100
    if db_sentiment == "off_topic" and "?" not in message:
        return "no_reply", "", 0, 0, 100
    if context_type == "crisis":
        return "template", "crisis", 680, 0, 96
    if context_type == "rude":
        return "template", "rude", 300, 0, 90
    if context_type == "pochvala":
        return "template", "praise", 260, 0, 82
    if context_type == "humor":
        return "template", "humor", 220, 0, 82
    if context_type == "skeptical":
        return "template", "skeptic", 320, 0, 88
    if context_type == "emotional":
        return "ai_sensitive", "", 700, 220, 88
    if context_type in {"otazka", "identifikace_znameni", "prinos_znameni"}:
        return "ai_cheap", "", 460, 160, 82
    return "ai_cheap", "", 320, 130, 80


def _model_tier_for(route: str, context_type: str) -> str:
    if route in {"no_reply", "template", "human_review"}:
        return "none"
    if route == "ai_sensitive":
        return os.getenv("COMMENT_SENSITIVE_MODEL_TIER", "fast").strip().lower() or "fast"
    return os.getenv("COMMENT_CHEAP_MODEL_TIER", "fast").strip().lower() or "fast"


def build_context_brief(
    comment: dict,
    context_type: str,
    route: str,
    allowed_url: str | None,
    tool_name: str | None,
    thread_memory: dict | None = None,
) -> str:
    """Build a compact context boost instead of sending large thread history."""
    post_topic = _clean(comment.get("post_message", ""))[:180]
    thread_memory = thread_memory or {}
    lines = [
        f"Strategie: {route}; typ komentáře: {context_type}.",
        f"Téma postu v jedné větě: {post_topic or 'mystika / osobní vhled'}.",
    ]

    previous_reply = _clean(thread_memory.get("last_bot_reply", ""))[:160]
    if previous_reply:
        lines.append(f"Poslední naše odpověď ve vlákně: {previous_reply}")

    previous_cta = thread_memory.get("last_cta_type")
    if previous_cta:
        lines.append(f"Nenavazuj stejnou CTA jako minule: {previous_cta}.")

    if allowed_url and tool_name:
        lines.append(f"Povolený jemný odkaz pouze pokud přirozeně sedí: {tool_name} ({allowed_url}).")
    else:
        lines.append("Bez odkazu na web v této odpovědi.")

    return "\n".join(lines)


def decide_reply_strategy(
    comment: dict,
    website_url: str,
    thread_memory: dict | None = None,
) -> ReplyStrategy:
    """Choose the cheapest acceptable reply path for a comment."""
    message = _clean(comment.get("message", ""))
    db_sentiment = comment.get("sentiment", "") or ""
    context_type = classify_comment_context(message, db_sentiment)

    if comment.get("should_hide"):
        context_type = "hidden"
        route, template_key, max_chars, max_tokens, threshold = "no_reply", "", 0, 0, 100
    elif not comment.get("needs_reply", True):
        route, template_key, max_chars, max_tokens, threshold = "no_reply", "", 0, 0, 100
    else:
        route, template_key, max_chars, max_tokens, threshold = _route_for(context_type, message, db_sentiment)

    allow_link = False
    allowed_url = None
    tool_name = None
    if route in {"ai_cheap", "ai_sensitive"}:
        allow_link, tool = should_offer_comment_link(
            original_comment=message,
            post_topic=comment.get("post_message", ""),
            context_type=context_type,
            db_sentiment=db_sentiment,
        )
        if allow_link and tool:
            allowed_url = f"{website_url.rstrip('/')}{tool.url}"
            tool_name = tool.name

    brief = build_context_brief(comment, context_type, route, allowed_url, tool_name, thread_memory)
    reason = f"{db_sentiment or 'unknown'}:{context_type}"
    return ReplyStrategy(
        route=route,
        context_type=context_type,
        tone=_tone_for(context_type),
        max_chars=max_chars,
        max_tokens=max_tokens,
        model_tier=_model_tier_for(route, context_type),
        allow_link=allow_link,
        allowed_url=allowed_url,
        tool_name=tool_name,
        template_key=template_key,
        quality_threshold=threshold,
        reason=reason,
        brief=brief,
    )
