"""
Policy helpers for comment replies.

Keeps link recommendations conservative so public replies stay useful first
and never look like a repeated traffic tactic.
"""
from __future__ import annotations

import hashlib
import os
import re
from dataclasses import dataclass


@dataclass(frozen=True)
class CommentTool:
    name: str
    url: str
    keywords: tuple[str, ...]


ALLOWED_COMMENT_TOOLS: tuple[CommentTool, ...] = (
    CommentTool("Natální karta", "/natalni-karta.html", ("natální", "natalni", "birth chart", "ascendent", "planety", "domy")),
    CommentTool("Horoskopy", "/horoskopy.html", ("horoskop", "znamení", "znameni", "beran", "býk", "byk", "blíženci", "blizenci", "rak", "lev", "panna", "váhy", "vahy", "štír", "stir", "střelec", "strelec", "kozoroh", "vodnář", "vodnar", "ryby")),
    CommentTool("Tarot", "/tarot.html", ("tarot", "karta", "karty", "výklad", "vyklad", "arkána", "arkana")),
    CommentTool("Partnerská shoda", "/partnerska-shoda.html", ("partner", "partnerská", "partnerska", "vztah", "vztahy", "láska", "laska", "kompatibil", "synastr")),
    CommentTool("Numerologie", "/numerologie.html", ("numerolog", "číslo", "cislo", "životní cesta", "zivotni cesta", "osudové číslo", "osudove cislo", "11:11")),
    CommentTool("Lunární kalendář", "/lunace.html", ("měsíc", "mesic", "luna", "lunár", "lunar", "úplněk", "uplnek", "novoluní", "novoluni", "fáze", "faze", "rituál", "ritual")),
    CommentTool("Runy", "/runy.html", ("runa", "runy", "futhark")),
    CommentTool("Andělské karty", "/andelske-karty.html", ("anděl", "andel", "andělské", "andelske")),
    CommentTool("Šamanské kolo", "/shamansko-kolo.html", ("šaman", "saman", "šamanské", "samanske", "totem", "zvíře", "zvire")),
    CommentTool("Hvězdný průvodce", "/mentor.html", ("průvodce", "pruvodce", "mentor", "poradíš", "poradis", "poraď", "porad", "duchovní cesta", "duchovni cesta")),
    CommentTool("Křišťálová koule", "/kristalova-koule.html", ("křišťálová koule", "kristalova koule", "koule", "věštění", "vesteni")),
    CommentTool("Minulý život", "/minuly-zivot.html", ("minulý život", "minuly zivot", "akáš", "akas", "karma", "karmický", "karmicky")),
)

DIRECT_LINK_INTENT = (
    "odkaz", "link", "url", "web", "stránk", "strank", "kde", "online",
    "zkusit", "vyzkoušet", "vyzkouset", "spočítat", "spocitat", "vypočítat",
    "vypocitat", "zjistit", "výklad", "vyklad", "nástroj", "nastroj",
)

NO_LINK_CONTEXT_TYPES = {
    "humor",
    "pochvala",
    "skeptik",
    "kratky_negativni",
    "emocionalni_stav",
    "krize",
    "hruby_komentar",
    "neutral",
}


def _normalized(text: str) -> str:
    return text.lower()


def find_allowed_comment_tool(*texts: str) -> CommentTool | None:
    """Return a whitelisted site tool that matches the comment or post context."""
    haystack = " ".join(_normalized(t or "") for t in texts)
    for tool in ALLOWED_COMMENT_TOOLS:
        if any(keyword in haystack for keyword in tool.keywords):
            return tool
    return None


def _stable_percent(seed: str) -> int:
    digest = hashlib.sha1(seed.encode("utf-8")).hexdigest()
    return int(digest[:8], 16) % 100


def should_offer_comment_link(
    original_comment: str,
    post_topic: str,
    context_type: str,
    db_sentiment: str = "",
    promo_rate: int | None = None,
) -> tuple[bool, CommentTool | None]:
    """
    Decide whether a public reply may include one soft website invite.

    A link is always forbidden for low-trust contexts. Direct requests can get
    a relevant URL. Other eligible comments get a deterministic, low-rate invite
    so a busy thread does not become a wall of links.
    """
    tool = find_allowed_comment_tool(original_comment, post_topic)
    if not tool:
        return False, None

    if context_type in NO_LINK_CONTEXT_TYPES or db_sentiment in {"spam", "negative", "off_topic", "low_signal", "emotional", "crisis", "rude"}:
        return False, tool

    comment_lower = _normalized(original_comment)
    direct_intent = any(marker in comment_lower for marker in DIRECT_LINK_INTENT)
    if direct_intent and context_type in {"otazka", "prinos_znameni", "identifikace_znameni"}:
        return True, tool

    if context_type not in {"otazka", "prinos_znameni", "identifikace_znameni"}:
        return False, tool

    if promo_rate is None:
        promo_rate = int(os.getenv("COMMENT_SOFT_PROMO_RATE", "10"))
    promo_rate = max(0, min(100, promo_rate))
    seed = f"{original_comment}|{post_topic}|{context_type}"
    return _stable_percent(seed) < promo_rate, tool


def allowed_comment_urls(base_url: str) -> set[str]:
    base = base_url.rstrip("/")
    return {f"{base}{tool.url}" for tool in ALLOWED_COMMENT_TOOLS}


def sanitize_reply_links(reply_text: str, base_url: str, allowed_url: str | None = None) -> str:
    """
    Remove any URL that is not explicitly allowed for this exact reply.
    """
    allowed = {allowed_url.rstrip("/")} if allowed_url else set()
    allowed.update(url.rstrip("/") for url in allowed_comment_urls(base_url))

    def _replace(match: re.Match[str]) -> str:
        raw = match.group(0)
        trailing = ""
        while raw and raw[-1] in ".,;:)":
            trailing = raw[-1] + trailing
            raw = raw[:-1]

        normalized = raw
        if normalized.startswith("mystickahvezda.cz/"):
            normalized = "https://www." + normalized
        elif normalized.startswith("www.mystickahvezda.cz/"):
            normalized = "https://" + normalized
        normalized = normalized.rstrip("/")

        if allowed_url and normalized == allowed_url.rstrip("/"):
            return raw + trailing
        if not allowed_url:
            return ""
        return ""

    cleaned = re.sub(r"(?:https?://)?(?:www\.)?mystickahvezda\.cz/[^\s]+|https?://[^\s]+", _replace, reply_text)
    cleaned = re.sub(r"\s{2,}", " ", cleaned)
    cleaned = re.sub(r"\s+([.,;:!?])", r"\1", cleaned)
    return cleaned.strip()
