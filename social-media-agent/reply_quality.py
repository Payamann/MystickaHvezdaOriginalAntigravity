"""
Quality gate for public comment replies.

Runs after template or AI generation and before the reply is sent to Meta.
The goal is to catch spammy, repetitive, unsafe, or off-brand replies cheaply.
"""
from __future__ import annotations

import re
from dataclasses import asdict, dataclass, field

from comment_policy import sanitize_reply_links
from reply_strategy import ReplyStrategy


@dataclass
class QualityResult:
    score: int
    publishable: bool
    issues: list[str] = field(default_factory=list)
    blocking_issues: list[str] = field(default_factory=list)
    cleaned_reply: str = ""
    cta_type: str = "none"
    url_count: int = 0

    def to_dict(self) -> dict:
        return asdict(self)


AI_DISCLOSURE_PATTERNS = (
    r"\bjako\s+ai\b",
    r"\buměl[áa]\s+inteligence\b",
    r"\bchatbot\b",
    r"\bbot\b",
    r"\bjazykov[ýy]\s+model\b",
    r"\bgenerov[aá]no\s+ai\b",
)

PROMO_PATTERNS = (
    r"\bklikni\b",
    r"\bklikněte\b",
    r"\bsleduj\s+n[aá]s\b",
    r"\bmrkni\s+na\s+web\b",
    r"\bodkaz\s+v\s+biu\b",
    r"\bkup\b",
    r"\bobjednej\b",
)

GENERIC_SUPPORT_OPENERS = (
    "mrzí mě, že se tak cítíš",
    "chápu, že se tak cítíš",
    "rozumím, že se tak cítíš",
    "všechno bude dobré",
)

URL_RE = re.compile(r"(?:https?://)?(?:www\.)?mystickahvezda\.cz/[^\s]+|https?://[^\s]+", re.I)
EMOJI_RE = re.compile(
    "["
    "\U0001F300-\U0001FAFF"
    "\U00002700-\U000027BF"
    "]+",
    flags=re.UNICODE,
)


def _normalize(text: str) -> str:
    text = re.sub(r"\s+", " ", (text or "").strip())
    text = re.sub(r"\s+([.,;:!?])", r"\1", text)
    return text


def clean_reply_text(reply: str, base_url: str, allowed_url: str | None = None) -> str:
    """Normalize common formatting issues before scoring."""
    cleaned = _normalize(reply)
    cleaned = re.sub(r"\*([^*]+)\*", r"\1", cleaned)
    cleaned = re.sub(r"_([^_]+)_", r"\1", cleaned)
    cleaned = sanitize_reply_links(cleaned, base_url, allowed_url)
    return _normalize(cleaned)


def detect_cta_type(reply: str) -> str:
    lower = reply.lower()
    if "?" in reply:
        return "question"
    if URL_RE.search(reply):
        return "web_link"
    if any(word in lower for word in ("ulož", "uloz", "save")):
        return "save"
    if any(word in lower for word in ("pošli", "posli", "sdílej", "sdilej")):
        return "share"
    return "none"


def _same_opening(a: str, b: str) -> bool:
    return _normalize(a).lower()[:18] == _normalize(b).lower()[:18]


def _contains_url_not_allowed(reply: str, allowed_url: str | None) -> bool:
    urls = URL_RE.findall(reply)
    if not urls:
        return False
    if not allowed_url:
        return True
    allowed = allowed_url.rstrip("/")
    for raw in urls:
        normalized = raw.rstrip(".,;:)").rstrip("/")
        if normalized.startswith("mystickahvezda.cz/"):
            normalized = "https://www." + normalized
        elif normalized.startswith("www.mystickahvezda.cz/"):
            normalized = "https://" + normalized
        if normalized != allowed:
            return True
    return False


def evaluate_reply_quality(
    reply: str,
    comment: dict,
    strategy: ReplyStrategy,
    base_url: str,
    recent_replies: list[str] | None = None,
) -> QualityResult:
    """Score a reply and decide if it is safe enough to publish."""
    recent_replies = recent_replies or []
    raw_reply = reply or ""
    raw_had_unapproved_url = _contains_url_not_allowed(raw_reply, strategy.allowed_url)
    cleaned = clean_reply_text(reply, base_url, strategy.allowed_url)
    score = 100
    issues: list[str] = []
    blocking: list[str] = []

    if not cleaned:
        issues.append("empty_reply")
        blocking.append("empty_reply")
        score -= 100

    if strategy.max_chars and len(cleaned) > strategy.max_chars:
        issues.append("too_long")
        score -= min(30, (len(cleaned) - strategy.max_chars) // 12 + 10)

    if "http" in cleaned.lower() or "mystickahvezda.cz/" in cleaned.lower():
        url_count = len(URL_RE.findall(cleaned))
    else:
        url_count = 0

    if url_count > 1:
        issues.append("too_many_urls")
        blocking.append("too_many_urls")
        score -= 35

    if raw_had_unapproved_url or _contains_url_not_allowed(cleaned, strategy.allowed_url):
        issues.append("unapproved_url")
        blocking.append("unapproved_url")
        score -= 60

    if strategy.context_type in {"emotional", "crisis", "rude", "skeptical"} and url_count:
        issues.append("url_in_sensitive_context")
        blocking.append("url_in_sensitive_context")
        score -= 60

    lower = cleaned.lower()
    for pattern in AI_DISCLOSURE_PATTERNS:
        if re.search(pattern, lower):
            issues.append("ai_disclosure")
            blocking.append("ai_disclosure")
            score -= 80
            break

    cleaned_without_urls = URL_RE.sub("", cleaned)
    if re.search(r"\w+/\w{1,8}\b", cleaned_without_urls):
        issues.append("slash_gender_form")
        blocking.append("slash_gender_form")
        score -= 80

    if re.match(r"^rád\s", lower) or re.search(r"\brád\s+(vidím|slyším|čtu|vnímám|cítím)\b", lower):
        issues.append("male_default_phrase")
        blocking.append("male_default_phrase")
        score -= 50

    if cleaned.count("!") > 1:
        issues.append("too_many_exclamations")
        score -= 12

    if len(EMOJI_RE.findall(cleaned)) > 1:
        issues.append("too_many_emoji")
        score -= 12

    if any(re.search(pattern, lower) for pattern in PROMO_PATTERNS):
        issues.append("salesy_promo")
        score -= 25
        if url_count:
            blocking.append("salesy_promo")

    if strategy.context_type in {"emotional", "crisis"}:
        if any(lower.startswith(opener) for opener in GENERIC_SUPPORT_OPENERS):
            issues.append("generic_support_opener")
            score -= 18
        if "všechno bude dobré" in lower:
            issues.append("false_reassurance")
            blocking.append("false_reassurance")
            score -= 45

    normalized_cleaned = _normalize(cleaned).lower()
    for previous in recent_replies[-5:]:
        normalized_previous = _normalize(previous).lower()
        if normalized_previous and normalized_cleaned == normalized_previous:
            issues.append("duplicate_reply")
            blocking.append("duplicate_reply")
            score -= 80
            break
        if previous and _same_opening(cleaned, previous):
            issues.append("repeated_opener")
            score -= 14
            break

    score = max(0, min(100, score))
    publishable = not blocking and score >= strategy.quality_threshold
    return QualityResult(
        score=score,
        publishable=publishable,
        issues=issues,
        blocking_issues=blocking,
        cleaned_reply=cleaned,
        cta_type=detect_cta_type(cleaned),
        url_count=url_count,
    )


def build_quality_feedback(result: QualityResult) -> str:
    if not result.issues:
        return ""
    hints = {
        "too_long": "Zkrať odpověď a nech jen jednu konkrétní myšlenku.",
        "repeated_opener": "Začni úplně jinak než předchozí odpovědi ve vlákně.",
        "generic_support_opener": "Reaguj konkrétněji na slova komentáře, ne univerzální podpůrnou frází.",
        "salesy_promo": "Odstraň prodejní tón.",
        "too_many_emoji": "Použij nejvýše jeden emoji, ideálně žádný.",
        "slash_gender_form": "Nepoužívej lomené tvary.",
        "male_default_phrase": "Nepoužívej mužský default typu 'Rád vidím'.",
        "unapproved_url": "Nepoužívej žádnou URL, pokud není explicitně povolená.",
        "url_in_sensitive_context": "U citlivého komentáře nepřidávej odkaz.",
    }
    selected = [hints[i] for i in result.issues if i in hints]
    return " ".join(selected[:3])
