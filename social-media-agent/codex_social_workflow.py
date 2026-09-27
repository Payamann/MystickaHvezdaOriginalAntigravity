#!/usr/bin/env python3
"""
Codex workflow helper for Mysticka Hvezda social content.

It does not replace agent.py. It prepares the context Codex needs, checks
drafts and logs approved copy without enforcing a fixed posting cadence.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import html
import io
import json
import os
import re
import subprocess
import sys
import tempfile
import unicodedata
from collections import Counter
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from pathlib import Path
import statistics
from typing import Any
from urllib.parse import urlencode


if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")


BASE_DIR = Path(__file__).resolve().parent
OUTPUT_DIR = BASE_DIR / "output"
MEMORY_FILE = OUTPUT_DIR / "content_memory.json"
CODEX_DIR = OUTPUT_DIR / "codex"
ROOT_DIR = BASE_DIR.parent
REVENUE_DIR = OUTPUT_DIR / "revenue"
GOOGLE_DIR = OUTPUT_DIR / "google"
DEFAULT_FUNNEL_CSV = REVENUE_DIR / "funnel-segments-90d.csv"
DEFAULT_FUNNEL_SUMMARY_JSON = REVENUE_DIR / "funnel-live-summary.json"
DEFAULT_GOOGLE_GROWTH_JSON = GOOGLE_DIR / "google-growth-latest.json"
LIVE_FUNNEL_SCRIPT = ROOT_DIR / "scripts" / "export-live-funnel.mjs"
GOOGLE_GROWTH_SCRIPT = ROOT_DIR / "scripts" / "export-google-growth-data.mjs"
ENTITLEMENT_SYNC_SCRIPT = ROOT_DIR / "scripts" / "sync-premium-entitlements.mjs"

ENGAGEMENT_TEMPLATE_FIELDS = [
    "post_id",
    "platform",
    "published_at",
    "metrics_as_of",
    "window",
    "date",
    "post_type",
    "topic",
    "content_intent",
    "slot_id",
    "mode",
    "page_id",
    "link",
    "image_path",
    "reach",
    "impressions",
    "views",
    "reactions",
    "comments",
    "shares",
    "saves",
    "link_clicks",
    "metrics_source",
    "notes",
]

WEB_FEATURES = {
    "Natální karta": "/natalni-karta.html",
    "Horoskopy": "/horoskopy.html",
    "Tarot": "/tarot.html",
    "Partnerská shoda": "/partnerska-shoda.html",
    "Numerologie": "/numerologie.html",
    "Lunární kalendář": "/lunace.html",
    "Runy": "/runy.html",
    "Andělské karty": "/andelske-karty.html",
    "Šamanské kolo": "/shamansko-kolo.html",
    "Hvězdný průvodce": "/mentor.html",
    "Křišťálová koule": "/kristalova-koule.html",
    "Minulý život": "/minuly-zivot.html",
}

WEB_FEATURE_TRACKING = {
    "Natální karta": "natalni_interpretace",
    "Horoskopy": "horoskopy",
    "Tarot": "tarot",
    "Partnerská shoda": "partnerska_detail",
    "Numerologie": "numerologie_vyklad",
    "Lunární kalendář": "lunar_calendar",
    "Runy": "runy_hluboky_vyklad",
    "Andělské karty": "andelske_karty_hluboky_vhled",
    "Šamanské kolo": "shamanske_kolo_plne_cteni",
    "Hvězdný průvodce": "mentor",
    "Křišťálová koule": "kristalova_koule",
    "Minulý život": "minuly_zivot",
}

LEGACY_URL_FIXES = {
    "/shamanske-kolo.html": "/shamansko-kolo.html",
}

TOPIC_FEATURE_RULES = [
    (("natal", "birth chart", "radix"), "Natální karta"),
    (("horoskop", "astrolog", "znameni", "zverokruh"), "Horoskopy"),
    (("tarot", "karta", "vyklad"), "Tarot"),
    (("partners", "vztah", "kompatibil", "shoda"), "Partnerská shoda"),
    (("numerolog", "cislo", "11:11"), "Numerologie"),
    (("lunar", "luna", "mesic", "uplnek", "novoluni"), "Lunární kalendář"),
    (("run", "runa"), "Runy"),
    (("andel", "andelsk"), "Andělské karty"),
    (("saman", "totem"), "Šamanské kolo"),
    (("mentor", "pruvodce", "afirmac", "zamer"), "Hvězdný průvodce"),
    (("kristal", "koule", "vesten"), "Křišťálová koule"),
    (("minul", "karma", "karmick"), "Minulý život"),
]

ALLOWED_TYPES = {
    "educational", "question", "tip", "story", "quote", "blog_promo",
    "myth_bust", "carousel_plan", "daily_energy", "challenge",
}

SLASH_FORM_RE = re.compile(r"\b[A-Za-zÁ-ž]+/[A-Za-zÁ-ž]+\b")
URL_RE = re.compile(
    r"(?:https?://(?:www\.)?mystickahvezda\.cz)?/[a-z0-9-]+\.html|"
    r"(?:https?://)?(?:www\.)?mystickahvezda\.cz/[a-z0-9-]+\.html",
    re.IGNORECASE,
)
PLACEHOLDER_RE = re.compile(r"\[(?:caption|3D object|tag\d+|material and light|engravings/symbols)\]", re.IGNORECASE)


@dataclass
class DraftSection:
    slot_title: str
    post_type: str
    hook: str
    intent: str
    cta: str
    body: str
    hashtags: list[str]
    image_prompt: str
    caption: str
    first_sentence: str


@dataclass
class QaResult:
    errors: list[str]
    warnings: list[str]

    @property
    def passed(self) -> bool:
        return not self.errors


@dataclass
class FacebookPublishPayload:
    mode: str
    message: str
    link: str
    first_comment: str | None
    image_path: Path | None
    feature: str
    topic: str
    slot_id: str
    tracking_source: str
    tracking_feature: str
    post_type: str
    content_intent: str
    campaign: str


@dataclass
class DailyOperatorContext:
    draft_path: Path
    target_date: date
    qa: QaResult
    slot_id: str
    topic: str
    feature: str
    clean_url: str
    story_url: str
    profile_url: str
    facebook_payload: FacebookPublishPayload
    instagram_caption: str
    story_frames: list[str]
    image_path: Path
    image_exists: bool
    campaign: str


def strip_accents(text: str) -> str:
    normalized = unicodedata.normalize("NFKD", text)
    return "".join(ch for ch in normalized if not unicodedata.combining(ch)).lower()


def load_memory(path: Path | None = None) -> dict[str, Any]:
    path = path or MEMORY_FILE
    if not path.exists():
        return {
            "approved_posts": [],
            "used_topics": [],
            "hook_scores": {},
            "hook_performance": {},
        }
    with path.open(encoding="utf-8") as fh:
        return json.load(fh)


def parse_date(value: str | None) -> date | None:
    if not value:
        return None
    try:
        return date.fromisoformat(value[:10])
    except ValueError:
        return None


def post_type_of(post: dict[str, Any]) -> str:
    return post.get("post_type") or post.get("type") or "?"


def posts_in_window(posts: list[dict[str, Any]], days: int, today: date) -> list[dict[str, Any]]:
    cutoff = today - timedelta(days=days)
    filtered = []
    for post in posts:
        post_date = parse_date(post.get("date"))
        if post_date and post_date >= cutoff:
            filtered.append(post)
    return filtered


def hook_rankings(memory: dict[str, Any]) -> list[tuple[str, float, int]]:
    """Legacy compatibility shim: internal QA ratings are not hook performance."""
    del memory
    return []


def allowed_urls() -> set[str]:
    urls = set(WEB_FEATURES.values())
    urls.update(f"https://www.mystickahvezda.cz{url}" for url in WEB_FEATURES.values())
    urls.update(f"https://mystickahvezda.cz{url}" for url in WEB_FEATURES.values())
    urls.update(f"mystickahvezda.cz{url}" for url in WEB_FEATURES.values())
    return urls


def normalize_url(url: str) -> str:
    lowered = url.strip().lower()
    lowered = lowered.replace("https://www.mystickahvezda.cz", "")
    lowered = lowered.replace("https://mystickahvezda.cz", "")
    lowered = lowered.replace("http://www.mystickahvezda.cz", "")
    lowered = lowered.replace("http://mystickahvezda.cz", "")
    lowered = lowered.replace("www.mystickahvezda.cz", "")
    lowered = lowered.replace("mystickahvezda.cz", "")
    return lowered


def absolute_url(path_or_url: str) -> str:
    path = normalize_url(path_or_url)
    if not path.startswith("/"):
        path = "/" + path
    return f"https://www.mystickahvezda.cz{path}"


def feature_for_url(path_or_url: str) -> tuple[str, str] | None:
    path = normalize_url(path_or_url)
    path = LEGACY_URL_FIXES.get(path, path)
    for feature, feature_path in WEB_FEATURES.items():
        if feature_path == path:
            return feature, feature_path
    return None


def slugify(text: str) -> str:
    compact = strip_accents(text)
    compact = re.sub(r"[^a-z0-9]+", "_", compact)
    return compact.strip("_") or "post"


def campaign_for_date(target_date: date) -> str:
    return f"daily_reel_{target_date.strftime('%Y_%m_%d')}"


def tracking_source_for(target_date: date, slot_id: str) -> str:
    return f"daily_social_{target_date.strftime('%Y_%m_%d')}_{slot_id}"


def tracking_feature_for(feature: str) -> str:
    return WEB_FEATURE_TRACKING.get(feature, slugify(feature))


def build_utm_url(
    path_or_url: str,
    *,
    source: str,
    medium: str,
    campaign: str,
    content: str,
    extra_params: dict[str, str] | None = None,
) -> str:
    base = absolute_url(path_or_url)
    params = urlencode(
        {
            "utm_source": source,
            "utm_medium": medium,
            "utm_campaign": campaign,
            "utm_content": content,
            **{key: value for key, value in (extra_params or {}).items() if value},
        }
    )
    separator = "&" if "?" in base else "?"
    return f"{base}{separator}{params}"


def feature_for_topic(topic: str) -> tuple[str, str] | None:
    compact = strip_accents(topic)
    for keywords, feature in TOPIC_FEATURE_RULES:
        if any(keyword in compact for keyword in keywords):
            return feature, WEB_FEATURES[feature]
    return None


def top_recent_topics(memory: dict[str, Any], days: int, today: date) -> list[str]:
    sources = memory.get("approved_posts", []) + memory.get("used_topics", [])
    recent = posts_in_window(sources, days, today)
    seen: list[str] = []
    for post in recent:
        topic = post.get("topic")
        if topic and topic not in seen:
            seen.append(topic)
    return seen


def last_intents(memory: dict[str, Any], limit: int = 5) -> list[str]:
    intents = []
    for post in memory.get("approved_posts", [])[-limit:]:
        intents.append(post.get("content_intent") or post.get("intent") or "unknown")
    return intents


def recent_summary_lines(memory: dict[str, Any], today: date) -> list[str]:
    approved = memory.get("approved_posts", [])[-15:]
    lines = []
    for post in approved:
        lines.append(
            f"[{post.get('date', '?')}] {post_type_of(post)} | {post.get('topic', '?')}"
        )
    if not lines:
        lines.append("(zatím nejsou uložené schválené posty)")
    return lines


def build_brief(target_date: date) -> str:
    memory = load_memory()
    recent_topics = top_recent_topics(memory, 7, target_date)
    intents = last_intents(memory, 5)
    last_intent = intents[-1] if intents else "zatím bez záznamu"
    recent_text = ", ".join(recent_topics) if recent_topics else "v paměti není čerstvý obsah"

    lines = [
        f"# Tvůrčí brief — {target_date.isoformat()}",
        "",
        "## Co už víme",
        *[f"- {line}" for line in recent_summary_lines(memory, target_date)],
        f"- Témata z posledních 7 dní: {recent_text}. Ber je jako upozornění na opakování úhlu, ne zákaz tématu.",
        "- Starší texty slouží jen ke kontrole opakování; nepoužívej je jako stylistickou předlohu.",
        f"- Poslední uložený intent: {last_intent}. Není to pokyn přidávat promo.",
        "",
        "## Zadání",
        "- Drž se počtu, sítě, formátu a cíle, které Pavel výslovně zadá. Když počet nezmíní, připrav jeden dotažený hlavní příspěvek.",
        "- Nepřidávej povinné sloty, promo, hashtagy, CTA, Reel ani sérii. Přidej je jen tehdy, když pomohou konkrétnímu zadání.",
        "- Napiš přirozenou češtinou, tykej a mluv ke konkrétnímu člověku. Jedna nosná myšlenka je lepší než několik obecných pouček.",
        "- Začni způsobem, který přirozeně vyplývá z tématu; konkrétní detail je užitečný, ale žádná forma začátku není povinná. Neopakuj nedávnou větu či metaforu.",
        "- Používej mystickou obraznost střídmě a s konkrétním významem. Tarot je podnět k sebereflexi, ne jistota o budoucnosti nebo pocitech druhých.",
        "- Nevymýšlej osobní příběh, zkušenost zákazníka, výsledek, recenzi ani produktovou funkci.",
        "- Vynech generické AI obraty, prázdné motivační fráze, umělé naléhání, přehnané emoji a seznam hashtagů jen kvůli dosahu.",
        "- Webový odkaz přidej jen tehdy, když přirozeně navazuje; propaguj pouze skutečnou funkci z projektového seznamu.",
        "- Aktuální astrologický údaj nebo proměnlivé pravidlo platformy ověř před použitím. Neuváděj univerzální tvrzení o algoritmu, dosahu ani ideálním čase.",
        "- Vizuál navrhni až podle konkrétního textu. Měň médium, kompozici, motiv i náladu; nepřebírej automaticky hvězdné pozadí, krystal, zlatý rámeček ani 3D ikonu.",
        "",
        "## Výstup",
        "Vrať jen požadovaný návrh a krátkou poznámku k vizuálu, pokud je užitečná. U série můžeš použít hlavičku:",
        "### Facebook — educational | pure_value",
        "Text příspěvku",
        "Hashtagy nebo Image prompt připoj jen tehdy, když je zadání skutečně potřebuje.",
        "",
        "Po dopsání spusť QA jen u markdown draftu. Traffic-pack nebo publish-pack vytvoř jen na výslovnou žádost o promo, odkaz nebo publikační balíček. Do paměti loguj až schválený text.",
    ]
    return "\n".join(lines) + "\n"

def write_daily_brief(target_date: date) -> Path:
    CODEX_DIR.mkdir(parents=True, exist_ok=True)
    path = CODEX_DIR / f"daily_brief_{target_date.isoformat()}.md"
    path.write_text(build_brief(target_date), encoding="utf-8")
    return path


def build_draft_template(target_date: date) -> str:
    return "\n".join(
        [
            f"# Social draft — {target_date.isoformat()}",
            "",
            "<!-- Doplň text, platformu a stručná metadata. Nepřidávej povinné hashtagy ani vizuál. -->",
            "### Facebook — educational | pure_value",
            "[caption]",
            "",
        ]
    )

def write_daily_draft_template(target_date: date) -> Path:
    CODEX_DIR.mkdir(parents=True, exist_ok=True)
    path = CODEX_DIR / f"daily_posts_{target_date.isoformat()}.md"
    if not path.exists():
        path.write_text(build_draft_template(target_date), encoding="utf-8")
    return path



SECTION_RE = re.compile(
    r"^###\s*(?P<header>[^\n]+)\n"
    r"(?P<body>.*?)(?=^###\s|\nSouhrnná tabulka|\n\*\*Souhrnná tabulka|\Z)",
    re.MULTILINE | re.DOTALL | re.IGNORECASE,
)


def parse_section_header(header: str) -> tuple[str, str, str, str, str]:
    """Read legacy metadata when present; ordinary headings need no hook/CTA labels."""
    legacy = re.match(
        r"^(?P<slot>.+?)\s+[—-]\s+(?P<type>[a-z_]+)\s*\|\s*"
        r"(?P<hook>[a-z_]+)\s*\|\s*(?P<intent>[a-z_]+)\s*\|\s*"
        r"CTA:\s*(?P<cta>[^\n]+)$",
        header.strip(),
        re.IGNORECASE,
    )
    if legacy:
        return tuple(legacy.group(name).strip() for name in ("slot", "type", "hook", "intent", "cta"))

    compact = re.match(
        r"^(?P<slot>.+?)\s+[—-]\s+(?P<type>[a-z_]+)"
        r"(?:\s*\|\s*(?P<intent>[a-z_]+))?"
        r"(?:\s*\|\s*CTA:\s*(?P<cta>[^\n]+))?$",
        header.strip(),
        re.IGNORECASE,
    )
    if compact:
        return (
            compact.group("slot").strip(),
            compact.group("type").strip(),
            "",
            (compact.group("intent") or "pure_value").strip(),
            (compact.group("cta") or "").strip(),
        )

    return header.strip(), "", "", "pure_value", ""


def extract_hashtags(text: str) -> list[str]:
    before_prompt = re.split(r"\*\*.*?Image prompt.*?\*\*", text, flags=re.IGNORECASE | re.DOTALL)[0]
    inline_tag_lines = [
        line for line in before_prompt.splitlines()
        if line.strip().startswith("`#") or line.strip().startswith("#")
    ]
    return re.findall(r"#[\wÁ-ž]+", "\n".join(inline_tag_lines), flags=re.UNICODE)


def extract_image_prompt(text: str) -> str:
    match = re.search(r"Image prompt.*?```(?P<prompt>.*?)```", text, re.IGNORECASE | re.DOTALL)
    if match:
        return match.group("prompt").strip()
    return ""


def extract_caption(body: str) -> tuple[str, str]:
    before_prompt = re.split(r"\*\*.*?Image prompt.*?\*\*", body, flags=re.IGNORECASE | re.DOTALL)[0]
    cleaned_lines = []
    for line in before_prompt.splitlines():
        stripped = line.strip()
        if not stripped:
            cleaned_lines.append("")
            continue
        if stripped.startswith("`#"):
            continue
        if stripped.startswith("**"):
            continue
        cleaned_lines.append(line.rstrip())
    caption = "\n".join(cleaned_lines).strip()
    first = ""
    for line in caption.splitlines():
        if line.strip():
            first = line.strip()
            break
    return caption, first


def parse_draft(text: str) -> list[DraftSection]:
    sections = []
    for match in SECTION_RE.finditer(text):
        slot_title, post_type, hook, intent, cta = parse_section_header(match.group("header"))
        body = match.group("body").strip()
        caption, first = extract_caption(body)
        sections.append(
            DraftSection(
                slot_title=slot_title,
                post_type=post_type,
                hook=hook,
                intent=intent,
                cta=cta,
                body=body,
                hashtags=extract_hashtags(body),
                image_prompt=extract_image_prompt(body),
                caption=caption,
                first_sentence=first,
            )
        )
    return sections


def parse_summary_table(text: str) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    header_seen = False
    headers: list[str] = []
    for raw in text.splitlines():
        line = raw.strip()
        if not line.startswith("|") or "|" not in line[1:]:
            if header_seen and rows:
                break
            continue
        cells = [cell.strip() for cell in line.strip("|").split("|")]
        normalized = [strip_accents(cell) for cell in cells]
        if "tema" in normalized and "slot" in normalized:
            headers = normalized
            header_seen = True
            continue
        if header_seen and all(set(cell) <= {"-", ":"} for cell in cells if cell):
            continue
        if header_seen and headers and len(cells) >= len(headers):
            rows.append({headers[i]: cells[i] for i in range(len(headers))})
    return rows


def section_slot_id(section: DraftSection) -> str | None:
    title = section.slot_title.lower()
    if "08:00" in title or "rano" in strip_accents(title) or "ráno" in title:
        return "morning"
    if "12:00" in title or "poledne" in strip_accents(title):
        return "noon"
    if "19:00" in title or "vecer" in strip_accents(title) or "večer" in title:
        return "evening"
    return None


def urls_in_text(text: str) -> list[str]:
    return [match.group(0).rstrip(".,)") for match in URL_RE.finditer(text)]


def validate_image_prompt(prompt: str) -> list[str]:
    if not prompt.strip():
        return ["prázdný prompt"]
    if PLACEHOLDER_RE.search(prompt) or re.search(r"\b(?:TODO|PLACEHOLDER|DOPLŇ)\b", prompt, re.IGNORECASE):
        return ["nevyplněný zástupný text"]
    return []


def qa_draft(text: str) -> QaResult:
    errors: list[str] = []
    warnings: list[str] = []
    sections = parse_draft(text)
    summary_rows = parse_summary_table(text)

    if not sections:
        errors.append("Nenašel jsem žádný příspěvek v rozpoznatelném markdown formátu.")

    allowed = {normalize_url(url) for url in allowed_urls()}
    ai_cliches = (
        "v dnešní uspěchané době",
        "vesmír ti posílá signál",
        "všechno se děje z nějakého důvodu",
        "zastav se a nadechni se",
        "dovol si být tím, kým jsi",
        "otevři své srdce",
    )
    changing_astro_terms = (
        "retrográd", "retrograd", "konjunkce", "opozice", "tranzit",
        "zatmění", "zatmeni", "úplněk", "uplnek", "novoluní", "novoluni",
    )

    for index, section in enumerate(sections, 1):
        label = f"příspěvek {index} ({section.slot_title})"

        if not section.caption:
            errors.append(f"{label}: chybí text příspěvku.")
        caption_without_urls = section.caption
        for url in urls_in_text(caption_without_urls):
            caption_without_urls = caption_without_urls.replace(url, "")
        if SLASH_FORM_RE.search(caption_without_urls):
            errors.append(f"{label}: obsahuje lomený tvar typu šel/šla.")
        if re.search(r"\b(vám|váš|vaše|vy)\b", section.caption, re.IGNORECASE):
            warnings.append(f"{label}: možná používá vykání; zkontroluj, zda sedí hlas značky.")
        if section.post_type and section.post_type not in ALLOWED_TYPES:
            warnings.append(f"{label}: neobvyklý typ {section.post_type}; ověř jen pokud na něm závisí plán.")
        caption_l = strip_accents(section.caption)
        if any(strip_accents(phrase) in caption_l for phrase in ai_cliches):
            warnings.append(f"{label}: může obsahovat obecnou frázi, která zní šablonovitě.")

        urls = urls_in_text(section.caption)
        known_product_urls = []
        for url in urls:
            normalized = normalize_url(url).split("?", 1)[0].split("#", 1)[0]
            if normalized in LEGACY_URL_FIXES:
                errors.append(f"{label}: URL {normalized} je známý překlep; použij {LEGACY_URL_FIXES[normalized]}.")
            elif normalized.startswith("/") and normalized not in allowed:
                errors.append(f"{label}: interní URL {url} není v seznamu skutečných webových funkcí.")
            else:
                known_product_urls.append(url)

        if section.intent == "soft_promo" and not known_product_urls:
            errors.append(f"{label}: soft_promo vyžaduje relevantní odkaz na skutečnou webovou funkci.")

        if section.image_prompt:
            missing = validate_image_prompt(section.image_prompt)
            if missing:
                errors.append(f"{label}: image prompt obsahuje {', '.join(missing)}.")

        if any(term in caption_l for term in changing_astro_terms):
            warnings.append(f"{label}: ověř aktuální astrologický údaj a jeho datum z důvěryhodného zdroje.")

    if summary_rows and len(sections) > 1:
        topics = [row.get("tema", "") or row.get("téma", "") for row in summary_rows]
        topics = [strip_accents(topic.strip()) for topic in topics if topic.strip()]
        if len(topics) != len(set(topics)):
            warnings.append("Souhrnná tabulka může opakovat stejné téma; ověř, zda každý příspěvek přináší jiný úhel.")

    return QaResult(errors=errors, warnings=warnings)

def print_qa(result: QaResult) -> None:
    status = "PASS" if result.passed else "FAIL"
    print(f"QA {status}")
    if result.errors:
        print("\nChyby:")
        for item in result.errors:
            print(f"- {item}")
    if result.warnings:
        print("\nVarování:")
        for item in result.warnings:
            print(f"- {item}")
    if result.passed and not result.warnings:
        print("- Bez nalezených problémů.")


def infer_date_from_path(path: Path) -> date:
    match = re.search(r"(\d{4}-\d{2}-\d{2})", path.name)
    if match:
        return date.fromisoformat(match.group(1))
    return date.today()


def topic_for_section(rows: list[dict[str, str]], index: int, section: DraftSection) -> str:
    if index < len(rows):
        return rows[index].get("tema") or rows[index].get("téma") or section.first_sentence
    return section.first_sentence


def pick_traffic_target(
    sections: list[DraftSection],
    rows: list[dict[str, str]],
    target_date: date,
) -> tuple[int, DraftSection, str, str]:
    del target_date  # legacy argument; a calendar slot never chooses the product.
    promotional_sections = [
        (index, section)
        for index, section in enumerate(sections)
        if section.intent in {"soft_promo", "direct_promo"}
    ]

    for index, section in promotional_sections:
        urls = urls_in_text(section.caption)
        if urls:
            match = feature_for_url(urls[0])
            if match:
                feature, path = match
                return index, section, feature, path

    for index, section in promotional_sections:
        topic = topic_for_section(rows, index, section)
        match = feature_for_topic(topic)
        if match:
            feature, path = match
            return index, section, feature, path

    if not sections:
        raise ValueError("Draft neobsahuje žádné parsovatelné sekce.")
    if not promotional_sections:
        raise ValueError("Traffic pack vyžaduje příspěvek výslovně označený jako promo.")
    raise ValueError("Nenašel jsem funkci webu, která by přirozeně odpovídala promo tématu.")


def build_traffic_pack(
    text: str,
    *,
    target_date: date,
    source: str = "instagram",
) -> str:
    sections = parse_draft(text)
    rows = parse_summary_table(text)
    index, section, feature, path = pick_traffic_target(sections, rows, target_date)
    slot_id = section_slot_id(section) or f"slot_{index + 1}"
    topic = topic_for_section(rows, index, section)

    campaign = campaign_for_date(target_date)
    content_base = f"{slot_id}_{slugify(feature)}"
    tracking_source = tracking_source_for(target_date, slot_id)
    tracking_feature = tracking_feature_for(feature)
    funnel_params = {
        "source": tracking_source,
        "feature": tracking_feature,
    }
    story_url = build_utm_url(
        path,
        source=source,
        medium="story_link",
        campaign=campaign,
        content=content_base,
        extra_params=funnel_params,
    )
    bio_url = build_utm_url(
        path,
        source=source,
        medium="profile_link",
        campaign=campaign,
        content=content_base,
        extra_params=funnel_params,
    )
    facebook_url = build_utm_url(
        path,
        source="facebook",
        medium="page_post",
        campaign=campaign,
        content=content_base,
        extra_params=funnel_params,
    )
    comment_url = build_utm_url(
        path,
        source=source,
        medium="comment",
        campaign=campaign,
        content=content_base,
        extra_params=funnel_params,
    )

    paragraphs = [part.strip() for part in section.caption.split("\n\n") if part.strip()]
    story_frame_1 = section.first_sentence
    story_frame_2 = paragraphs[1] if len(paragraphs) > 1 else ""
    story_frame_3 = f"{feature}: {story_url}"
    fb_post = facebook_caption_for_publish(
        section,
        facebook_url=facebook_url,
        mode="link",
        link_placement="none",
    )

    lines = [
        f"# Traffic pack — {target_date.isoformat()}",
        "",
        "## Primární cíl",
        f"- Slot: {slot_id} ({section.slot_title})",
        f"- Téma: {topic}",
        f"- Web funkce: {feature}",
        f"- Čistá URL: {absolute_url(path)}",
        f"- Campaign: `{campaign}`",
        f"- Funnel source: `{tracking_source}`",
        f"- Funnel feature: `{tracking_feature}`",
        "",
        "## Odkazy",
        f"- IG Story link sticker: {story_url}",
        f"- IG bio/profil na 24 h: {bio_url}",
        f"- IG komentář, pokud ho použiješ: {comment_url}",
        f"- Facebook link post: {facebook_url}",
        "",
        "## IG Story po Reelu",
        f"1. {story_frame_1}",
        f"2. {story_frame_2}",
        f"3. {story_frame_3}",
        "",
        "## Caption/Comment CTA",
        "- Použij CTA z původního příspěvku, pokud přirozeně navazuje.",
        "",
        "## Facebook post",
        fb_post,
        "",
        "## Minimum práce",
        "- Vyber jen kanály a formáty, které odpovídají zadání a kapacitě.",
        "- Odkaz použij jen tehdy, když přirozeně navazuje na obsah.",
        "- Balíček nic nepublikuje; každý výstup před použitím zkontroluj.",
        "",
    ]
    return "\n".join(lines)


def write_traffic_pack(draft_path: Path, content: str, target_date: date) -> Path:
    CODEX_DIR.mkdir(parents=True, exist_ok=True)
    output = CODEX_DIR / f"traffic_pack_{target_date.isoformat()}.md"
    output.write_text(content, encoding="utf-8")
    return output


def instagram_ready_caption(section: DraftSection) -> str:
    caption = section.caption
    urls = urls_in_text(caption)
    for url in sorted(urls, key=len, reverse=True):
        caption = caption.replace(url, "odkaz v profilu")
    caption = re.sub(r"tady:\s+odkaz v profilu", "přes odkaz v profilu", caption, flags=re.IGNORECASE)
    caption = re.sub(r"(přes odkaz v profilu)(?![.!?])", r"\1.", caption, flags=re.IGNORECASE)
    caption = re.sub(r"\n{3,}", "\n\n", caption).strip()
    hashtags = " ".join(section.hashtags)
    return f"{caption}\n\n{hashtags}".strip()


def story_frame_copy(section: DraftSection) -> str:
    """Return the second story frame without leaking a raw URL into the text."""
    paragraphs = [part.strip() for part in section.caption.split("\n\n") if part.strip()]
    if len(paragraphs) < 2:
        return ""
    copy = paragraphs[1]
    for url in urls_in_text(copy):
        copy = copy.replace(url, "odkaz ve stickeru")
    return copy


def publish_caption(section: DraftSection) -> str:
    hashtags = " ".join(section.hashtags)
    return f"{section.caption}\n\n{hashtags}".strip()


def facebook_caption_for_publish(
    section: DraftSection,
    *,
    facebook_url: str,
    mode: str,
    link_placement: str,
) -> str:
    caption = section.caption.strip()
    urls = urls_in_text(caption)
    if urls and mode == "photo" and link_placement == "none":
        for url in urls:
            caption = re.sub(
                rf"[^.!?\n]*{re.escape(url)}[^.!?\n]*[.!?]?",
                "",
                caption,
            )
        caption = re.sub(r"\n{3,}", "\n\n", caption).strip()
        urls = []
    if urls:
        if mode == "link":
            replacement = "odkaz u příspěvku"
        elif link_placement == "first-comment":
            replacement = "odkaz v prvním komentáři"
        elif link_placement == "caption":
            replacement = facebook_url
        else:
            replacement = ""
        for url in sorted(urls, key=len, reverse=True):
            caption = caption.replace(url, replacement)
        caption = re.sub(r"\s+([.,!?])", r"\1", caption)
        caption = re.sub(r"\s*:\s*([.!?])", r"\1", caption)
        caption = re.sub(r"[ \t]{2,}", " ", caption)
        caption = re.sub(r"\n{3,}", "\n\n", caption).strip()

    hashtags = " ".join(section.hashtags)
    return f"{caption}\n\n{hashtags}".strip()


def build_facebook_publish_payload(
    text: str,
    *,
    target_date: date,
    mode: str = "photo",
    link_placement: str = "first-comment",
    image_path: str | Path | None = None,
) -> FacebookPublishPayload:
    if mode not in {"photo", "link"}:
        raise ValueError("Facebook mode musí být 'photo' nebo 'link'.")
    if link_placement not in {"first-comment", "caption", "none"}:
        raise ValueError("Facebook link placement musí být 'first-comment', 'caption' nebo 'none'.")

    sections = parse_draft(text)
    rows = parse_summary_table(text)
    index, section, suggested_feature, suggested_path = pick_traffic_target(sections, rows, target_date)
    slot_id = section_slot_id(section) or f"slot_{index + 1}"
    topic = topic_for_section(rows, index, section)

    section_urls = urls_in_text(section.caption)
    product_match = next((feature_for_url(url) for url in section_urls if feature_for_url(url)), None)
    if not product_match and section.intent == "soft_promo":
        product_match = feature_for_topic(topic)
    has_relevant_link = product_match is not None

    if product_match:
        feature, path = product_match
    else:
        feature, path = suggested_feature, suggested_path

    campaign = campaign_for_date(target_date)
    tracking_source = tracking_source_for(target_date, slot_id)
    tracking_feature = tracking_feature_for(feature) if has_relevant_link else ""
    facebook_url = (
        build_utm_url(
            path,
            source="facebook",
            medium="page_post",
            campaign=campaign,
            content=f"{slot_id}_{slugify(feature)}",
            extra_params={"source": tracking_source, "feature": tracking_feature},
        )
        if has_relevant_link
        else ""
    )

    message = facebook_caption_for_publish(
        section,
        facebook_url=facebook_url,
        mode=mode,
        link_placement=link_placement,
    )
    first_comment = None
    if has_relevant_link and mode == "photo" and link_placement == "first-comment":
        first_comment = f"{feature}:\n{facebook_url}"

    if mode == "photo":
        if image_path:
            resolved_image_path: Path | None = Path(image_path)
        else:
            _, _, image_destination = build_codex_image_brief(
                text,
                target_date=target_date,
                mode="traffic",
            )
            resolved_image_path = Path(image_destination)
    else:
        resolved_image_path = None

    return FacebookPublishPayload(
        mode=mode,
        message=message,
        link=facebook_url,
        first_comment=first_comment,
        image_path=resolved_image_path,
        feature=feature if has_relevant_link else "",
        topic=topic,
        slot_id=slot_id,
        tracking_source=tracking_source,
        tracking_feature=tracking_feature,
        post_type=section.post_type or "",
        content_intent=section.intent or "",
        campaign=campaign,
    )


def build_publish_pack(
    text: str,
    *,
    target_date: date,
    source: str = "instagram",
) -> str:
    sections = parse_draft(text)
    rows = parse_summary_table(text)
    index, section, feature, path = pick_traffic_target(sections, rows, target_date)
    slot_id = section_slot_id(section) or f"slot_{index + 1}"
    topic = topic_for_section(rows, index, section)

    campaign = campaign_for_date(target_date)
    content_base = f"{slot_id}_{slugify(feature)}"
    tracking_source = tracking_source_for(target_date, slot_id)
    tracking_feature = tracking_feature_for(feature)
    funnel_params = {
        "source": tracking_source,
        "feature": tracking_feature,
    }
    story_url = build_utm_url(
        path,
        source=source,
        medium="story_link",
        campaign=campaign,
        content=content_base,
        extra_params=funnel_params,
    )
    profile_url = build_utm_url(
        path,
        source=source,
        medium="profile_link",
        campaign=campaign,
        content=content_base,
        extra_params=funnel_params,
    )
    facebook_url = build_utm_url(
        path,
        source="facebook",
        medium="page_post",
        campaign=campaign,
        content=content_base,
        extra_params=funnel_params,
    )
    _, image_prompt, image_destination = build_codex_image_brief(
        text,
        target_date=target_date,
        mode="traffic",
    )
    image_status = "hotový soubor existuje" if Path(image_destination).exists() else "čeká na vygenerování"
    story_frame_1 = section.first_sentence
    story_frame_2 = story_frame_copy(section)
    story_frame_3 = f"{feature}: {story_url}"
    fb_message = facebook_caption_for_publish(
        section,
        facebook_url=facebook_url,
        mode="link",
        link_placement="none",
    )

    return f"""# Publikační podklady — {target_date.isoformat()}

## Co dnes publikovat
- Vybraný příspěvek pro návštěvnost; balíček z něj připravuje varianty pro zvolené kanály.
- Interní označení: {slot_id if section_slot_id(section) else 'neuvedeno'} ({section.slot_title})
- Téma: {topic}
- Web funkce: {feature}
- Cílová URL: {absolute_url(path)}
- Campaign: `{campaign}`
- Funnel source: `{tracking_source}`
- Funnel feature: `{tracking_feature}`
- Obrázek: `{image_destination}` ({image_status})

## 1) Instagram Reel / feed caption
```text
{instagram_ready_caption(section)}
```

## 2) Instagram Story po Reelu
Frame 1:
```text
{story_frame_1}
```

Frame 2:
```text
{story_frame_2}
```

Frame 3:
```text
{story_frame_3}
```

Link sticker URL:
{story_url}

Profil link na 24 h:
{profile_url}

Poznámka: Story s link stickerem ber jako ruční krok v Instagram appce. API může publikovat Story asset, ale link sticker se přidává nativně.

## 3) Facebook link post
Message:
```text
{fb_message}
```

Link:
{facebook_url}

## 4) Obrázek pro traffic post
Prompt pro finální obrázek:
```text
{image_prompt}
```

## 5) Checklist
- Připrav vizuál podle image promptu, pokud je součástí zadání.
- Zkopíruj Instagram caption z části 1.
- Po publikaci Reelu přidej Story a ručně vlož link sticker URL.
- Facebook pošli jako link post s message + linkem.
- Po schválení můžeš draft zaznamenat příkazem `python codex_social_workflow.py log-draft --file output/codex/daily_posts_{target_date.isoformat()}.md`.
"""


def write_publish_pack(content: str, target_date: date) -> Path:
    CODEX_DIR.mkdir(parents=True, exist_ok=True)
    output = CODEX_DIR / f"publish_pack_{target_date.isoformat()}.md"
    output.write_text(content, encoding="utf-8")
    return output


def default_daily_posts_path(target_date: date) -> Path:
    return CODEX_DIR / f"daily_posts_{target_date.isoformat()}.md"


def build_daily_operator_context(
    text: str,
    *,
    draft_path: Path,
    target_date: date,
    source: str = "instagram",
    image_path: str | Path | None = None,
    facebook_mode: str = "photo",
    link_placement: str = "first-comment",
) -> DailyOperatorContext:
    sections = parse_draft(text)
    rows = parse_summary_table(text)
    index, section, feature, path = pick_traffic_target(sections, rows, target_date)
    slot_id = section_slot_id(section) or f"slot_{index + 1}"
    topic = topic_for_section(rows, index, section)

    campaign = campaign_for_date(target_date)
    content_base = f"{slot_id}_{slugify(feature)}"
    funnel_params = {
        "source": tracking_source_for(target_date, slot_id),
        "feature": tracking_feature_for(feature),
    }
    story_url = build_utm_url(
        path,
        source=source,
        medium="story_link",
        campaign=campaign,
        content=content_base,
        extra_params=funnel_params,
    )
    profile_url = build_utm_url(
        path,
        source=source,
        medium="profile_link",
        campaign=campaign,
        content=content_base,
        extra_params=funnel_params,
    )
    payload = build_facebook_publish_payload(
        text,
        target_date=target_date,
        mode=facebook_mode,
        link_placement=link_placement,
        image_path=image_path,
    )
    resolved_image = Path(image_path) if image_path else (payload.image_path or Path(""))
    story_frames = [
        section.first_sentence,
        story_frame_copy(section),
        f"{feature}: {story_url}",
    ]
    return DailyOperatorContext(
        draft_path=draft_path,
        target_date=target_date,
        qa=qa_draft(text),
        slot_id=slot_id,
        topic=topic,
        feature=feature,
        clean_url=absolute_url(path),
        story_url=story_url,
        profile_url=profile_url,
        facebook_payload=payload,
        instagram_caption=instagram_ready_caption(section),
        story_frames=story_frames,
        image_path=resolved_image,
        image_exists=bool(resolved_image) and resolved_image.is_file(),
        campaign=campaign,
    )


def daily_operator_status_items(context: DailyOperatorContext) -> list[tuple[str, str, str]]:
    qa_status = "PASS" if context.qa.passed else "FAIL"
    image_status = "OK" if context.image_exists else "CHYBÍ"
    fb_status = "READY" if context.facebook_payload.mode == "link" or context.image_exists else "BLOCKED"
    return [
        ("QA", qa_status, "AGENTS pravidla a obsahová struktura"),
        ("Image", image_status, str(context.image_path)),
        ("Facebook dry-run", fb_status, "autorský text + odkaz pouze pokud patří do draftu"),
        ("Tracking", "OK", f"{context.facebook_payload.tracking_source} / {context.facebook_payload.tracking_feature}"),
    ]


def build_daily_operator_report(
    context: DailyOperatorContext,
    *,
    control_room_path: Path | None = None,
    preview_path: Path | None = None,
    publish_pack_path: Path | None = None,
    traffic_pack_path: Path | None = None,
) -> str:
    status_lines = [
        f"- {name}: {status} — {note}"
        for name, status, note in daily_operator_status_items(context)
    ]
    issue_lines = context.qa.errors + context.qa.warnings
    issues = "\n".join(f"- {item}" for item in issue_lines) if issue_lines else "- Bez nalezených problémů."
    outputs = [
        ("Control room", control_room_path),
        ("Preview", preview_path),
        ("Publish pack", publish_pack_path),
        ("Traffic pack", traffic_pack_path),
    ]
    output_lines = [f"- {label}: {path}" for label, path in outputs if path]
    if not output_lines:
        output_lines = ["- Použij `--write`, pokud chceš uložit HTML a markdown výstupy."]

    execute_command = (
        "python codex_social_workflow.py facebook-publish "
        f"--file {context.draft_path} "
        f"--image {context.image_path} --execute"
    )
    return "\n".join(
        [
            f"# Daily operator — {context.target_date.isoformat()}",
            "",
            "## Stav",
            *status_lines,
            "",
            "## Traffic cíl",
            f"- Slot: {context.slot_id}",
            f"- Téma: {context.topic}",
            f"- Web funkce: {context.feature}",
            f"- Cílová URL: {context.clean_url}",
            f"- Campaign: `{context.campaign}`",
            "",
            "## QA",
            issues,
            "",
            "## Uložené výstupy",
            *output_lines,
            "",
            "## Ostré publikování po kontrole",
            f"```bash\n{execute_command}\n```",
            "",
        ]
    )


def file_uri(path: Path) -> str:
    try:
        return path.resolve().as_uri()
    except ValueError:
        return ""


def pre_block(text: str) -> str:
    return f"<pre>{html.escape(text)}</pre>"


def build_daily_control_room_html(context: DailyOperatorContext) -> str:
    qa_class = "pass" if context.qa.passed else "fail"
    image_html = (
        f'<img src="{html.escape(file_uri(context.image_path))}" alt="Traffic visual">'
        if context.image_exists
        else '<div class="missing">Obrázek zatím chybí</div>'
    )
    issues = context.qa.errors + context.qa.warnings
    issue_html = (
        "<ul>" + "".join(f"<li>{html.escape(item)}</li>" for item in issues) + "</ul>"
        if issues
        else "<p>Bez nalezených problémů.</p>"
    )
    status_cards = "\n".join(
        f"""
        <div class="status-card">
          <strong>{html.escape(name)}</strong>
          <span class="{html.escape(status.lower())}">{html.escape(status)}</span>
          <p>{html.escape(note)}</p>
        </div>
        """
        for name, status, note in daily_operator_status_items(context)
    )
    story_html = "".join(
        f"<div class=\"story-frame\"><span>Frame {idx}</span><p>{html.escape(frame)}</p></div>"
        for idx, frame in enumerate(context.story_frames, start=1)
    )
    dry_run_command = (
        "python codex_social_workflow.py facebook-publish "
        f"--file {context.draft_path} --image {context.image_path}"
    )
    execute_command = f"{dry_run_command} --execute"

    return f"""<!doctype html>
<html lang="cs">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Daily operator {context.target_date.isoformat()}</title>
  <style>
    :root {{
      color-scheme: dark;
      --bg: #050510;
      --panel: #101020;
      --panel-2: #17152a;
      --line: rgba(248, 244, 255, 0.16);
      --text: #f8f4ff;
      --muted: #b9adc9;
      --gold: #e4bd68;
      --green: #58d69b;
      --red: #ff7b8d;
      --violet: #8f5cff;
    }}
    * {{ box-sizing: border-box; }}
    body {{
      margin: 0;
      background: radial-gradient(circle at 20% 0%, rgba(143, 92, 255, 0.22), transparent 30rem), var(--bg);
      color: var(--text);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      letter-spacing: 0;
    }}
    main {{ width: min(1500px, calc(100% - 48px)); margin: 0 auto; padding: 32px 0 48px; }}
    header {{ display: flex; justify-content: space-between; gap: 24px; align-items: end; margin-bottom: 22px; }}
    h1 {{ margin: 0 0 8px; font-size: 34px; line-height: 1.05; }}
    h2 {{ margin: 0 0 14px; font-size: 19px; }}
    p {{ line-height: 1.48; }}
    .muted {{ color: var(--muted); margin: 0; overflow-wrap: anywhere; }}
    .badge {{ border: 1px solid rgba(228, 189, 104, 0.38); color: var(--gold); padding: 7px 9px; font-size: 12px; text-transform: uppercase; }}
    .status {{ display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-bottom: 18px; }}
    .status-card, section {{ border: 1px solid var(--line); background: rgba(16, 16, 32, 0.88); }}
    .status-card {{ padding: 13px; }}
    .status-card strong {{ display: block; margin-bottom: 8px; }}
    .status-card span {{ color: var(--gold); font-size: 12px; }}
    .status-card span.pass, .status-card span.ok, .status-card span.ready {{ color: var(--green); }}
    .status-card span.fail, .status-card span.chybí, .status-card span.blocked {{ color: var(--red); }}
    .status-card p {{ color: var(--muted); margin: 8px 0 0; font-size: 13px; overflow-wrap: anywhere; }}
    .grid {{ display: grid; grid-template-columns: 0.9fr 1.1fr; gap: 18px; align-items: start; }}
    section {{ padding: 18px; margin-bottom: 18px; }}
    .visual img {{ width: 100%; display: block; border: 1px solid var(--line); background: #050510; }}
    .missing {{ aspect-ratio: 4 / 5; display: grid; place-items: center; border: 1px dashed var(--line); color: var(--muted); }}
    .meta-list {{ display: grid; gap: 8px; color: var(--muted); font-size: 14px; overflow-wrap: anywhere; }}
    .meta-list strong {{ color: var(--text); }}
    pre {{ white-space: pre-wrap; overflow-wrap: anywhere; margin: 0; padding: 14px; background: #090914; border: 1px solid var(--line); color: #eee7ff; font: 14px/1.48 ui-monospace, SFMono-Regular, Consolas, monospace; }}
    .story-grid {{ display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }}
    .story-frame {{ min-height: 170px; border: 1px solid var(--line); background: linear-gradient(180deg, #0a0a18, #111024); padding: 14px; display: flex; flex-direction: column; justify-content: space-between; }}
    .story-frame span {{ color: var(--gold); font-size: 12px; }}
    .story-frame p {{ margin: 14px 0 0; }}
    .qa.pass h2 {{ color: var(--green); }}
    .qa.fail h2 {{ color: var(--red); }}
    a {{ color: var(--gold); overflow-wrap: anywhere; }}
    @media (max-width: 1050px) {{
      header {{ display: block; }}
      .status, .grid, .story-grid {{ grid-template-columns: 1fr; }}
      .badge {{ display: inline-block; margin-top: 14px; }}
    }}
  </style>
</head>
<body>
  <main>
    <header>
      <div>
        <h1>Daily operator</h1>
        <p class="muted">Mystická Hvězda · {context.target_date.isoformat()} · finální kontrola před publikací</p>
      </div>
      <div class="badge">Není veřejný post</div>
    </header>

    <div class="status">{status_cards}</div>

    <div class="grid">
      <div>
        <section class="visual">
          <h2>Traffic vizuál</h2>
          {image_html}
        </section>
        <section>
          <h2>Traffic cíl</h2>
          <div class="meta-list">
            <div><strong>Slot:</strong> {html.escape(context.slot_id)}</div>
            <div><strong>Téma:</strong> {html.escape(context.topic)}</div>
            <div><strong>Funkce:</strong> {html.escape(context.feature)}</div>
            <div><strong>URL:</strong> <a href="{html.escape(context.clean_url)}">{html.escape(context.clean_url)}</a></div>
            <div><strong>Campaign:</strong> {html.escape(context.campaign)}</div>
          </div>
        </section>
      </div>

      <div>
        <section class="qa {qa_class}">
          <h2>QA {'PASS' if context.qa.passed else 'FAIL'}</h2>
          {issue_html}
        </section>
        <section>
          <h2>Facebook post</h2>
          {pre_block(context.facebook_payload.message)}
        </section>
        <section>
          <h2>První komentář</h2>
          {pre_block(context.facebook_payload.first_comment or context.facebook_payload.link)}
        </section>
      </div>
    </div>

    <section>
      <h2>Instagram caption</h2>
      {pre_block(context.instagram_caption)}
    </section>

    <section>
      <h2>Story frames</h2>
      <div class="story-grid">{story_html}</div>
      <p class="muted">Link sticker: {html.escape(context.story_url)}</p>
    </section>

    <section>
      <h2>Příkazy</h2>
      <p class="muted">Nejdřív dry-run, po kontrole execute.</p>
      {pre_block(dry_run_command + chr(10) + execute_command)}
    </section>
  </main>
</body>
</html>
"""


def write_daily_control_room(content: str, target_date: date) -> Path:
    CODEX_DIR.mkdir(parents=True, exist_ok=True)
    output = CODEX_DIR / f"daily_control_room_{target_date.isoformat()}.html"
    output.write_text(content, encoding="utf-8")
    return output


def select_visual_sections(
    sections: list[DraftSection],
    rows: list[dict[str, str]],
    target_date: date,
    mode: str,
) -> list[tuple[int, DraftSection]]:
    if mode == "all":
        return list(enumerate(sections))
    if mode in {"morning", "noon", "evening"}:
        selected = [(idx, section) for idx, section in enumerate(sections) if section_slot_id(section) == mode]
        return selected or []
    if mode == "traffic":
        index, section, _, _ = pick_traffic_target(sections, rows, target_date)
        return [(index, section)]
    raise ValueError(f"Neznámý visual mode: {mode}")


def visual_filename(target_date: date, index: int, section: DraftSection) -> str:
    slot = section_slot_id(section) or f"slot_{index + 1}"
    return f"social_{target_date.strftime('%Y%m%d')}_{slot}_{slugify(section.post_type)}"


def build_visual_pack(
    text: str,
    *,
    target_date: date,
    mode: str = "traffic",
    generate: bool = False,
) -> tuple[str, list[Path]]:
    sections = parse_draft(text)
    rows = parse_summary_table(text)
    selected = select_visual_sections(sections, rows, target_date, mode)
    generated_paths: list[Path] = []

    lines = [
        f"# Visual pack — {target_date.isoformat()}",
        "",
        f"- Režim: {mode}",
        f"- Počet vizuálů: {len(selected)}",
        "",
    ]

    if not selected:
        lines.append("Nebyly nalezeny žádné sekce pro vybraný režim.")
        return "\n".join(lines), generated_paths

    generator = None
    if generate:
        from generators.image_generator import generate_image  # noqa: WPS433
        generator = generate_image

    for index, section in selected:
        slot = section_slot_id(section) or f"slot_{index + 1}"
        topic = topic_for_section(rows, index, section)
        filename = visual_filename(target_date, index, section)
        image_prompt = build_visual_prompt(section, topic, placement="Facebook feed")
        lines.extend(
            [
                f"## {slot} — {topic}",
                f"- Typ: {section.post_type}",
                f"- Soubor: {filename}.png",
                "",
                image_prompt,
                "",
            ]
        )
        if generator:
            path = generator(
                prompt=image_prompt,
                platform="facebook",
                post_type="portrait",
                filename=filename,
            )
            generated_paths.append(path)
            lines.append(f"Vygenerováno: {path}")
            lines.append("")

    return "\n".join(lines), generated_paths

def write_visual_pack(content: str, target_date: date) -> Path:
    CODEX_DIR.mkdir(parents=True, exist_ok=True)
    output = CODEX_DIR / f"visual_pack_{target_date.isoformat()}.md"
    output.write_text(content, encoding="utf-8")
    return output


def build_visual_prompt(
    section: DraftSection,
    topic: str,
    *,
    placement: str = "Facebook feed",
) -> str:
    if section.image_prompt.strip():
        return section.image_prompt.strip()

    context = section.caption.strip().replace('"', "'")
    return (
        f"Create an original, editorial-quality visual for a Mystická Hvězda {placement} post. "
        f"Post topic: {topic}. Post text for context: {context}. "
        "Find one concrete visual metaphor that belongs to this exact text; avoid stock mystical symbols "
        "and do not illustrate every sentence literally. Choose the medium, palette, lighting, and framing "
        "to fit this idea. The brand may use night blue, violet, or soft gold when they help, but do not force "
        "stars, nebulae, crystals, tarot cards, a centered floating object, a gold frame, or a 3D render. "
        "Keep the image calm, distinctive, and legible at feed size. No readable text, logo, or watermark. "
        "Compose for the selected placement and keep the main subject safe from common feed crops."
    )


def build_codex_image_brief(
    text: str,
    *,
    target_date: date,
    mode: str = "traffic",
) -> tuple[str, str, str]:
    sections = parse_draft(text)
    rows = parse_summary_table(text)
    selected = select_visual_sections(sections, rows, target_date, mode)
    if not selected:
        raise ValueError("Draft neobsahuje sekci vhodnou pro Codex image brief.")

    index, section = selected[0]
    slot = section_slot_id(section) or f"slot_{index + 1}"
    topic = topic_for_section(rows, index, section)
    filename = f"codex_{target_date.strftime('%Y%m%d')}_{slot}_{slugify(topic)}.png"
    destination = str((OUTPUT_DIR / "images" / filename).resolve())
    visual_direction = build_visual_prompt(section, topic)
    visual_context = facebook_caption_for_publish(
        section,
        facebook_url="",
        mode="photo",
        link_placement="none",
    )

    prompt = f"""Create one original visual for the Facebook post below.
Post topic: {topic}
Post copy for context:
{visual_context}

Art direction:
{visual_direction}

Follow the specific art direction above. Keep the Mystická Hvězda palette only where it supports this post; let the chosen medium, composition, and subject vary with the idea. Match the target placement and keep important details clear on a phone. Do not add readable text, logos, or watermarks unless the user explicitly asked for them."""

    brief = f"""# Image brief — {target_date.isoformat()}

## Selected visual
- Section: {slot}
- Topic: {topic}
- Type: {section.post_type}
- Target file: {destination}

## Prompt
{prompt}

## Use
- This image is paired with the selected post.
- Do not create additional variants unless the user asked for them.
"""
    return brief, prompt, destination

def write_codex_image_brief(content: str, target_date: date) -> Path:
    CODEX_DIR.mkdir(parents=True, exist_ok=True)
    output = CODEX_DIR / f"codex_image_brief_{target_date.isoformat()}.md"
    output.write_text(content, encoding="utf-8")
    return output


def caption_to_html(caption: str) -> str:
    paragraphs = [part.strip() for part in re.split(r"\n\s*\n", caption.strip()) if part.strip()]
    return "\n".join(
        f"<p>{html.escape(paragraph).replace(chr(10), '<br>')}</p>"
        for paragraph in paragraphs
    )


def build_preview_html(text: str, *, target_date: date) -> str:
    sections = parse_draft(text)
    rows = parse_summary_table(text)
    qa = qa_draft(text)
    status = "QA PASS" if qa.passed else "QA FAIL"
    status_class = "pass" if qa.passed else "fail"

    cards: list[str] = []
    for index, section in enumerate(sections):
        slot_id = section_slot_id(section) or f"slot-{index + 1}"
        slot_label = section.slot_title or "Příspěvek"
        topic = topic_for_section(rows, index, section)
        hashtags = " ".join(section.hashtags)
        prompt_preview = section.image_prompt[:220] + ("..." if len(section.image_prompt) > 220 else "")
        metadata_chips = []
        if section.post_type:
            metadata_chips.append(f"<span>{html.escape(section.post_type)}</span>")
        if section.intent and section.intent != "pure_value":
            metadata_chips.append(
                f'<span class="{html.escape(section.intent)}">{html.escape(section.intent)}</span>'
            )
        chips_html = f'<div class="chips">{"".join(metadata_chips)}</div>' if metadata_chips else ""
        cards.append(
            f"""
            <article class="post-card {html.escape(slot_id)}">
              <div class="visual" aria-label="Grafika zatím není přiložena">
                <div class="visual-empty">Skutečná grafika se zobrazí po připojení hotového obrázku.</div>
              </div>
              <div class="content">
                <div class="slot">{html.escape(slot_label)}</div>
                <h2>{html.escape(topic)}</h2>
                {chips_html}
                <div class="caption">{caption_to_html(section.caption)}</div>
                <div class="hashtags">{html.escape(hashtags)}</div>
                <details>
                  <summary>Image prompt</summary>
                  <p>{html.escape(prompt_preview)}</p>
                </details>
              </div>
            </article>
            """
        )

    issues = qa.errors + qa.warnings
    issue_html = (
        "<ul>" + "".join(f"<li>{html.escape(item)}</li>" for item in issues) + "</ul>"
        if issues
        else "<p>Bez nalezených problémů.</p>"
    )

    return f"""<!doctype html>
<html lang="cs">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Internal social review {target_date.isoformat()}</title>
  <style>
    :root {{
      color-scheme: dark;
      --bg: #050510;
      --panel: #0c0b18;
      --panel-2: #141226;
      --line: rgba(238, 231, 255, 0.14);
      --text: #f8f4ff;
      --muted: #b9adc9;
      --gold: #e4bd68;
      --violet: #8f5cff;
      --emerald: #58d69b;
    }}
    * {{ box-sizing: border-box; }}
    body {{
      margin: 0;
      min-height: 100vh;
      background:
        radial-gradient(circle at 15% 10%, rgba(143, 92, 255, 0.18), transparent 28rem),
        radial-gradient(circle at 85% 0%, rgba(228, 189, 104, 0.12), transparent 24rem),
        var(--bg);
      color: var(--text);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      letter-spacing: 0;
    }}
    main {{
      width: min(1480px, calc(100% - 48px));
      margin: 0 auto;
      padding: 34px 0 48px;
    }}
    header {{
      display: flex;
      align-items: end;
      justify-content: space-between;
      gap: 24px;
      margin-bottom: 22px;
    }}
    h1 {{
      margin: 0 0 8px;
      font-size: 34px;
      line-height: 1.05;
    }}
    .subline {{
      margin: 0;
      color: var(--muted);
      font-size: 15px;
    }}
    .review-note {{
      display: inline-flex;
      margin-top: 12px;
      border: 1px solid rgba(228, 189, 104, 0.32);
      color: var(--gold);
      padding: 7px 9px;
      font-size: 12px;
      line-height: 1;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      background: rgba(228, 189, 104, 0.06);
    }}
    .qa {{
      border: 1px solid var(--line);
      background: rgba(12, 11, 24, 0.72);
      padding: 14px 16px;
      min-width: 270px;
    }}
    .qa strong.pass {{ color: var(--emerald); }}
    .qa strong.fail {{ color: #ff7b8d; }}
    .qa ul, .qa p {{ margin: 8px 0 0; color: var(--muted); font-size: 13px; }}
    .grid {{
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 18px;
      align-items: start;
    }}
    .post-card {{
      border: 1px solid var(--line);
      background: linear-gradient(180deg, rgba(20, 18, 38, 0.92), rgba(10, 9, 20, 0.96));
      min-width: 0;
      overflow: hidden;
    }}
    .visual {{
      position: relative;
      aspect-ratio: 4 / 5;
      display: grid;
      place-items: center;
      padding: 24px;
      background: linear-gradient(145deg, rgba(143, 92, 255, 0.12), transparent 48%), #090814;
      border-bottom: 1px solid var(--line);
      overflow: hidden;
    }}
    .visual-empty {{
      max-width: 260px;
      border: 1px dashed var(--line);
      padding: 16px;
      color: var(--muted);
      text-align: center;
      font-size: 13px;
      line-height: 1.5;
    }}
    .content {{ padding: 18px; }}
    .slot {{
      color: var(--gold);
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 8px;
    }}
    h2 {{
      margin: 0 0 12px;
      font-size: 20px;
      line-height: 1.16;
    }}
    .chips {{
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 16px;
    }}
    .chips span {{
      border: 1px solid var(--line);
      color: var(--muted);
      padding: 5px 7px;
      font-size: 12px;
      line-height: 1;
      background: rgba(255, 255, 255, 0.035);
    }}
    .chips .soft_promo {{ color: var(--gold); }}
    .caption {{
      color: #eee7ff;
      font-size: 15px;
      line-height: 1.47;
    }}
    .caption p {{ margin: 0 0 13px; }}
    .hashtags {{
      margin-top: 14px;
      color: var(--gold);
      font-size: 14px;
      line-height: 1.45;
      overflow-wrap: anywhere;
    }}
    details {{
      margin-top: 14px;
      color: var(--muted);
      font-size: 12px;
      border-top: 1px solid var(--line);
      padding-top: 12px;
    }}
    summary {{ cursor: pointer; color: #ddd4ec; }}
    details p {{ margin: 8px 0 0; line-height: 1.45; }}
    @media (max-width: 1100px) {{
      .grid {{ grid-template-columns: 1fr; }}
      header {{ display: block; }}
      .qa {{ margin-top: 18px; }}
    }}
  </style>
</head>
<body>
  <main>
    <header>
      <div>
        <h1>Interní kontrola social série</h1>
        <p class="subline">Mystická Hvězda · {target_date.isoformat()} · náhled captionů, CTA a vizuálního směru</p>
        <div class="review-note">Není to post k publikování</div>
      </div>
      <aside class="qa">
        <strong class="{status_class}">{status}</strong>
        {issue_html}
      </aside>
    </header>
    <section class="grid">
      {"".join(cards)}
    </section>
  </main>
</body>
</html>
"""


def write_preview_html(content: str, target_date: date) -> Path:
    CODEX_DIR.mkdir(parents=True, exist_ok=True)
    output = CODEX_DIR / f"preview_{target_date.isoformat()}.html"
    output.write_text(content, encoding="utf-8")
    return output


def draft_hash(section: DraftSection) -> str:
    digest = hashlib.sha1(section.caption.encode("utf-8")).hexdigest()
    return digest[:12]


def already_logged(memory: dict[str, Any], section: DraftSection) -> bool:
    preview = section.caption[:100].replace("\n", " ").strip()
    for post in memory.get("approved_posts", []):
        if post.get("caption_preview") == preview:
            return True
        if post.get("draft_hash") == draft_hash(section):
            return True
    return False


def log_draft(text: str, score: float | None = None, force: bool = False, dry_run: bool = False) -> int:
    qa = qa_draft(text)
    if qa.errors and not force:
        print_qa(qa)
        print("\nLogování zastaveno. Oprav chyby nebo použij --force.")
        return 1

    sections = parse_draft(text)
    rows = parse_summary_table(text)
    sys.path.insert(0, str(BASE_DIR))
    from generators.content_memory import (  # noqa: WPS433
        _load_memory,
        _save_memory,
        record_approved_post,
        record_post,
    )

    memory = _load_memory()
    logged = 0
    skipped = 0
    planned: list[tuple[str, DraftSection]] = []

    for index, section in enumerate(sections):
        if already_logged(memory, section) and not force:
            skipped += 1
            continue
        row = rows[index] if index < len(rows) else {}
        topic = row.get("tema") or row.get("téma") or section.first_sentence[:60] or section.slot_title[:60] or "nezadané téma"
        if dry_run:
            planned.append((topic, section))
            logged += 1
            continue
        record_post(
            topic=topic,
            post_type=section.post_type or "unspecified",
            content_intent=section.intent,
        )
        record_approved_post(
            topic=topic,
            post_type=section.post_type or "unspecified",
            caption=section.caption,
            quality_score=score,
            content_intent=section.intent,
        )
        memory = _load_memory()
        if memory.get("approved_posts"):
            memory["approved_posts"][-1].update(
                {
                    "draft_hash": draft_hash(section),
                    "slot": section_slot_id(section) or section.slot_title,
                }
            )
            _save_memory(memory)
        logged += 1

    if dry_run:
        print("DRY RUN: content_memory.json nebyl změněn.")
        for topic, section in planned:
            print(
                f"- {topic} | {section.post_type or 'bez typu'} | "
                f"{section.intent} | {section_slot_id(section) or section.slot_title}"
            )
    print(f"Zalogováno: {logged}. Přeskočeno jako duplicita: {skipped}.")
    return 0


def parse_metric_value(value: Any) -> int:
    if value is None:
        return 0
    text = str(value).strip().replace(" ", "").replace(",", ".")
    if not text:
        return 0
    try:
        return max(0, int(round(float(text))))
    except ValueError:
        return 0


def classify_engagement(
    *,
    likes: int = 0,
    comments: int = 0,
    shares: int = 0,
    saves: int = 0,
    views: int = 0,
) -> str:
    weighted_score = likes + comments * 4 + shares * 6 + saves * 5
    if views > 0:
        rate = weighted_score / views
        if rate >= 0.05:
            return "high"
        if rate >= 0.015:
            return "medium"
        return "low"
    if weighted_score >= 80:
        return "high"
    if weighted_score >= 20:
        return "medium"
    return "low"


def recent_published_posts(memory: dict[str, Any], days: int, today: date) -> list[dict[str, Any]]:
    cutoff = today - timedelta(days=max(0, days))
    posts = []
    for post in memory.get("published_posts", []):
        published = parse_date(post.get("published_at"))
        if published and cutoff <= published <= today:
            posts.append(post)
    return sorted(posts, key=lambda post: (post.get("published_at", ""), post.get("post_id", "")))


def write_engagement_template(days: int = 14, output: Path | None = None, today: date | None = None) -> Path:
    today = today or date.today()
    output = output or CODEX_DIR / f"engagement_template_{today.isoformat()}.csv"
    memory = load_memory()
    posts = recent_published_posts(memory, days, today)

    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=ENGAGEMENT_TEMPLATE_FIELDS)
        writer.writeheader()
        for post in posts:
            writer.writerow({
                "post_id": post.get("post_id", ""),
                "platform": post.get("platform", "facebook"),
                "published_at": post.get("published_at", ""),
                "metrics_as_of": "",
                "window": "",
                "date": str(post.get("published_at", ""))[:10],
                "post_type": post_type_of(post),
                "topic": post.get("topic", ""),
                "content_intent": post.get("content_intent", ""),
                "slot_id": post.get("slot_id", ""),
                "mode": post.get("mode", ""),
                "page_id": post.get("page_id", ""),
                "link": post.get("link", ""),
                "image_path": post.get("image_path", ""),
                "reach": "",
                "impressions": "",
                "views": "",
                "reactions": "",
                "comments": "",
                "shares": "",
                "saves": "",
                "link_clicks": "",
                "metrics_source": "facebook_insights_manual" if post.get("platform") == "facebook" else "platform_insights_manual",
                "notes": "",
            })
    return output


def parse_optional_metric(value: Any, field: str) -> int | None:
    text = str(value or "").strip()
    if not text:
        return None
    compact = text.replace("\u00a0", "").replace(" ", "")
    if re.fullmatch(r"\d{1,3}(?:[.,]\d{3})+", compact):
        compact = re.sub(r"[.,]", "", compact)
    if not compact.isdigit():
        raise ValueError(f"{field} must be a non-negative whole number")
    return int(compact)


def import_engagement_csv(path: Path, dry_run: bool = False) -> int:
    sys.path.insert(0, str(BASE_DIR))
    from generators.content_memory import (  # noqa: WPS433
        POST_METRIC_FIELDS,
        _load_memory,
        record_engagement,
        record_post_metrics,
        record_published_post,
    )

    memory = _load_memory()
    legacy_existing = {
        (entry.get("date"), entry.get("topic"))
        for entry in memory.get("engagement_log", [])
    }
    seen_snapshots: set[tuple[str, str, str]] = set()
    imported = 0
    skipped = 0

    with path.open(newline="", encoding="utf-8-sig") as handle:
        for row in csv.DictReader(handle):
            post_date = (row.get("date") or "").strip()
            topic = (row.get("topic") or "").strip()
            post_type = (row.get("post_type") or "").strip()

            post_id = (row.get("post_id") or "").strip()
            if post_id:
                published_at = (row.get("published_at") or post_date).strip()
                measured_on = (row.get("metrics_as_of") or "").strip()
                window = (row.get("window") or "").strip().lower()
                try:
                    metrics = {field: parse_optional_metric(row.get(field), field) for field in POST_METRIC_FIELDS}
                except ValueError as exc:
                    print(f"Řádek {imported + skipped + 2} přeskočen: {exc}")
                    skipped += 1
                    continue
                try:
                    measured_date = date.fromisoformat(measured_on)
                except ValueError:
                    measured_date = None
                if (
                    measured_date is None
                    or measured_date > date.today()
                    or not window
                    or all(value is None for value in metrics.values())
                ):
                    skipped += 1
                    continue
                if window not in {"24h", "7d", "28d", "lifetime", "custom"}:
                    skipped += 1
                    continue
                published_date = parse_date(published_at)
                if (
                    published_date is None
                    or published_date > date.today()
                    or not (row.get("platform") or "facebook").strip()
                ):
                    skipped += 1
                    continue
                snapshot_key = (post_id, measured_on[:10], window)
                if snapshot_key in seen_snapshots:
                    skipped += 1
                    continue
                seen_snapshots.add(snapshot_key)
                post_metadata = {
                    "post_id": post_id,
                    "platform": (row.get("platform") or "facebook").strip(),
                    "published_at": published_at,
                    "topic": topic,
                    "post_type": post_type,
                    "content_intent": (row.get("content_intent") or "").strip(),
                    "slot_id": (row.get("slot_id") or "").strip(),
                    "mode": (row.get("mode") or "").strip(),
                    "page_id": (row.get("page_id") or "").strip(),
                    "link": (row.get("link") or "").strip(),
                    "image_path": (row.get("image_path") or "").strip(),
                }
                if dry_run:
                    action = "aktualizace" if snapshot_key in {
                        (post.get("post_id"), snapshot.get("measured_on"), snapshot.get("window"))
                        for post in memory.get("published_posts", [])
                        for snapshot in post.get("metrics", [])
                    } else "nový záznam"
                    print(f"- {action}: {post_id} | {post_metadata['platform']} | {window} k {measured_on}: {metrics}")
                    imported += 1
                else:
                    record_published_post(**post_metadata)
                    changed = record_post_metrics(
                        post_id=post_id,
                        measured_on=measured_on,
                        window=window,
                        metrics=metrics,
                        source=(row.get("metrics_source") or "platform_insights_manual").strip(),
                        notes=(row.get("notes") or "").strip(),
                    )
                    if changed:
                        imported += 1
                    else:
                        skipped += 1
                continue

            # Backwards compatibility for old summary-only CSV files. These
            # rows remain unlinked and are never used for measured comparisons.
            if not post_date or not topic or not post_type:
                skipped += 1
                continue
            if (post_date, topic) in legacy_existing:
                skipped += 1
                continue

            explicit = (row.get("engagement") or "").strip().lower()
            engagement = explicit if explicit in {"high", "medium", "low"} else classify_engagement(
                likes=parse_metric_value(row.get("likes")),
                comments=parse_metric_value(row.get("comments")),
                shares=parse_metric_value(row.get("shares")),
                saves=parse_metric_value(row.get("saves")),
                views=parse_metric_value(row.get("views")),
            )
            notes = (row.get("notes") or "").strip()
            if dry_run:
                print(f"- {post_date} | {post_type} | {topic} => {engagement}")
            else:
                record_engagement(
                    post_date=post_date,
                    post_type=post_type,
                    topic=topic,
                    engagement=engagement,
                    notes=notes,
                )
            imported += 1
            legacy_existing.add((post_date, topic))

    if dry_run:
        print("DRY RUN: content_memory.json nebyl změněn.")
    print(f"Engagement import: {imported} imported, {skipped} skipped.")
    return 0


def weekly_report(days: int) -> str:
    memory = load_memory()
    today = date.today()
    approved = posts_in_window(memory.get("approved_posts", []), days, today)
    used = posts_in_window(memory.get("used_topics", []), days, today)
    source = approved or used
    type_counts = Counter(post_type_of(post) for post in source)
    intent_counts = Counter(post.get("content_intent") or post.get("intent") or "unknown" for post in source)
    topic_counts = Counter(post.get("topic", "?") for post in source)
    engagement = posts_in_window(memory.get("engagement_log", []), days, today)
    published = recent_published_posts(memory, days, today)
    performance_lines = summarize_published_metrics(published, days=days, today=today)

    lines = [
        f"# Redakční přehled — posledních {days} dní",
        "",
        f"- Schválené posty: {len(approved)}",
        f"- Všechny logované pokusy: {len(used)}",
        f"- Typy: {format_counter(type_counts)}",
        f"- Záměry: {format_counter(intent_counts)}",
        f"- Nejčastější témata: {format_counter(topic_counts, limit=5)}",
        f"- Ručně zaznamenané výsledky: {len(engagement)}",
        f"- Skutečně publikované příspěvky: {len(published)}",
        "",
        "## K redakční kontrole",
    ]

    observations = build_recommendations(type_counts, intent_counts, topic_counts, len(source))
    lines.extend(f"- {item}" for item in observations)
    if engagement:
        engagement_counts = Counter(entry.get("engagement", "nezadáno") for entry in engagement)
        lines.append("- Zaznamenané hodnocení: " + format_counter(engagement_counts))
        if len(engagement) < 5:
            lines.append("- Vzorek je malý; neber ho jako trend ani automatické pravidlo pro další obsah.")
    lines.extend(["", "## Výkon zveřejněných příspěvků"])
    lines.extend(f"- {line}" for line in performance_lines)
    if not performance_lines:
        lines.append("- Pro toto období nejsou uložené surové metriky zveřejněných příspěvků.")
    return "\n".join(lines) + "\n"


def summarize_published_metrics(
    published: list[dict[str, Any]],
    *,
    days: int,
    today: date,
) -> list[str]:
    cutoff = today - timedelta(days=max(0, days))
    latest: dict[tuple[str, str], tuple[dict[str, Any], dict[str, Any]]] = {}
    for post in published:
        post_id = str(post.get("post_id") or "")
        for snapshot in post.get("metrics", []):
            measured_on = parse_date(snapshot.get("measured_on"))
            if not post_id or not measured_on or not cutoff <= measured_on <= today:
                continue
            key = (post_id, str(snapshot.get("window") or ""))
            previous = latest.get(key)
            if previous is None or str(snapshot.get("measured_on", "")) > str(previous[1].get("measured_on", "")):
                latest[key] = (post, snapshot)

    groups: dict[tuple[str, str, str, str], list[dict[str, Any]]] = {}
    for (post_id, window), (post, snapshot) in latest.items():
        group = (
            str(post.get("platform") or "unknown"),
            str(post.get("mode") or "unknown"),
            str(post.get("post_type") or "unknown"),
            window or "unspecified",
        )
        groups.setdefault(group, []).append(snapshot)

    if not latest:
        return []
    lines = [f"Měření: {len(latest)} unikátních příspěvků × oken; zobrazen je medián v každé skupině."]
    for (platform, mode, post_type, window), snapshots in sorted(groups.items()):
        reaches = [int(row["reach"]) for row in snapshots if row.get("reach") is not None]
        interaction_rates = [
            sum(int(row[field]) for field in ("reactions", "comments", "shares", "saves")) / int(row["reach"])
            for row in snapshots
            if row.get("reach") and all(row.get(field) is not None for field in ("reactions", "comments", "shares", "saves"))
        ]
        click_rates = [
            int(row["link_clicks"]) / int(row["reach"])
            for row in snapshots
            if row.get("reach") and row.get("link_clicks") is not None
        ]
        line = f"{platform} / {mode} / {post_type} / {window}: n={len(snapshots)}"
        if reaches:
            line += f", medián reach {statistics.median(reaches):g}"
        if interaction_rates:
            line += f", medián reakcí+komentářů+sdílení+uložení / reach {statistics.median(interaction_rates):.1%}"
        if click_rates:
            line += f", medián prokliků / reach {statistics.median(click_rates):.1%}"
        lines.append(line)
    if len(latest) < 5:
        lines.append("Vzorek je malý; jde o popis dat, ne potvrzený trend.")
    return lines


def format_counter(counter: Counter, limit: int = 8) -> str:
    if not counter:
        return ""
    return ", ".join(f"{key} {count}×" for key, count in counter.most_common(limit))


def build_recommendations(
    type_counts: Counter,
    intent_counts: Counter,
    topic_counts: Counter,
    total: int,
) -> list[str]:
    if total == 0:
        return ["V tomto období nejsou zaznamenané příspěvky; není z čeho vyvozovat vzorec."]

    observations: list[str] = []
    if total < 5:
        observations.append(f"Záznamů je {total}; přehled ber jako seznam, ne jako důkaz trendu.")
    repeated = [topic for topic, count in topic_counts.most_common(3) if count >= 3 and topic not in {"?", "bez tématu"}]
    if repeated:
        observations.append(f"Opakovala se témata {', '.join(repeated)}; ověř, zda případný další příspěvek přináší nový úhel.")
    dominant = type_counts.most_common(1)
    if total >= 5 and dominant and dominant[0][1] / total >= 0.7:
        observations.append(f"Nejčastější formát je {dominant[0][0]} ({dominant[0][1]}/{total}); samo o sobě to není problém, ověř jeho vhodnost pro další zadání.")
    if not observations:
        observations.append("Záznam neukazuje zjevné opakování témat; konkrétní podobu dalšího obsahu dál určuje zadání.")
    return observations


def cmd_brief(args: argparse.Namespace) -> int:
    target = date.fromisoformat(args.date) if args.date else date.today()
    print(build_brief(target))
    return 0


def cmd_daily(args: argparse.Namespace) -> int:
    target = date.fromisoformat(args.date) if args.date else date.today()
    brief_path = write_daily_brief(target)
    draft_path = write_daily_draft_template(target)
    print(f"Denní Codex brief uložen: {brief_path}")
    print(f"Draft šablona připravena: {draft_path}")
    print()
    print(build_brief(target))
    return 0


def cmd_daily_operator(args: argparse.Namespace) -> int:
    target = date.fromisoformat(args.date) if args.date else date.today()
    draft_path = Path(args.file) if args.file else default_daily_posts_path(target)

    if not draft_path.exists():
        brief_path = write_daily_brief(target)
        template_path = write_daily_draft_template(target)
        print(f"Daily operator nemá hotový draft: {draft_path}")
        print(f"Brief uložen: {brief_path}")
        print(f"Draft šablona připravena: {template_path}")
        print("Další krok: doplň finální posty a spusť daily-operator znovu.")
        return 0

    text = draft_path.read_text(encoding="utf-8")
    if PLACEHOLDER_RE.search(text) and not args.allow_placeholders:
        print("Daily operator zastaven: draft stále obsahuje placeholdery.")
        print("Doplň finální posty nebo použij --allow-placeholders pro interní náhled.")
        return 1

    sections = parse_draft(text)
    qa = qa_draft(text)
    has_soft_promo = any(section.intent == "soft_promo" for section in sections)
    if not has_soft_promo:
        preview_path = None
        if not args.no_write:
            preview_path = write_preview_html(build_preview_html(text, target_date=target), target)
        print("Daily operator — kontrola obsahu")
        print_qa(qa)
        print("Traffic ani publikační balíček nevznikl: draft neoznačuje žádný post jako soft_promo.")
        if preview_path:
            print(f"Soukromý náhled: {preview_path}")
        print("Pro propagaci přidej přirozeně navazující odkaz a intent soft_promo; balíčky pak zapni zvláštní volbou.")
        return 1 if qa.errors and not args.no_fail else 0

    if (args.traffic_pack or args.publish_pack) and qa.errors:
        print_qa(qa)
        print("Traffic/publikační balíček nebyl vytvořen: nejdřív oprav chyby v draftu.")
        return 1

    context = build_daily_operator_context(
        text,
        draft_path=draft_path,
        target_date=target,
        source=args.source,
        image_path=args.image,
        facebook_mode=args.facebook_mode,
        link_placement=args.link_placement,
    )

    traffic_pack_path = publish_pack_path = preview_path = control_room_path = None
    if not args.no_write:
        if args.traffic_pack:
            traffic_pack_path = write_traffic_pack(
                draft_path,
                build_traffic_pack(text, target_date=target, source=args.source),
                target,
            )
        if args.publish_pack:
            publish_pack_path = write_publish_pack(
                build_publish_pack(text, target_date=target, source=args.source),
                target,
            )
        preview_path = write_preview_html(build_preview_html(text, target_date=target), target)
        control_room_path = write_daily_control_room(build_daily_control_room_html(context), target)

    print(
        build_daily_operator_report(
            context,
            control_room_path=control_room_path,
            preview_path=preview_path,
            publish_pack_path=publish_pack_path,
            traffic_pack_path=traffic_pack_path,
        )
    )

    if context.qa.errors and not args.no_fail:
        return 1
    if (
        context.facebook_payload.mode == "photo"
        and not context.image_exists
        and not args.allow_missing_image
    ):
        print("Daily operator skončil s blokací: pro photo post chybí obrázek.")
        return 1
    return 0


def cmd_qa(args: argparse.Namespace) -> int:
    text = Path(args.file).read_text(encoding="utf-8")
    result = qa_draft(text)
    print_qa(result)
    if result.errors and not args.no_fail:
        return 1
    return 0


def cmd_log_draft(args: argparse.Namespace) -> int:
    text = Path(args.file).read_text(encoding="utf-8")
    return log_draft(text, score=args.score, force=args.force, dry_run=args.dry_run)


def cmd_engagement_template(args: argparse.Namespace) -> int:
    target = date.fromisoformat(args.date) if args.date else date.today()
    output = write_engagement_template(days=args.days, output=args.output, today=target)
    print(f"Engagement template uložen: {output}")
    return 0


def cmd_engagement_import(args: argparse.Namespace) -> int:
    return import_engagement_csv(args.file, dry_run=args.dry_run)


def cmd_weekly(args: argparse.Namespace) -> int:
    report = weekly_report(args.days)
    if args.write:
        CODEX_DIR.mkdir(parents=True, exist_ok=True)
        path = CODEX_DIR / f"weekly_review_{date.today().isoformat()}.md"
        path.write_text(report, encoding="utf-8")
        print(f"Weekly review uložen: {path}\n")
    print(report)
    return 0


def run_live_funnel_export(
    *,
    days: int = 90,
    output: Path | None = None,
    summary_json: Path | None = None,
    limit: int = 5000,
    skip_entitlement_audit: bool = False,
    json_output: bool = False,
    runner=subprocess.run,
) -> subprocess.CompletedProcess:
    output_path = output or DEFAULT_FUNNEL_CSV
    summary_path = summary_json or DEFAULT_FUNNEL_SUMMARY_JSON
    output_path.parent.mkdir(parents=True, exist_ok=True)
    summary_path.parent.mkdir(parents=True, exist_ok=True)

    command = [
        "node",
        str(LIVE_FUNNEL_SCRIPT),
        "--days",
        str(days),
        "--limit",
        str(limit),
        "--output",
        str(output_path),
        "--summary-json",
        str(summary_path),
    ]
    if skip_entitlement_audit:
        command.append("--skip-entitlement-audit")
    if json_output:
        command.append("--json")

    return runner(
        command,
        cwd=ROOT_DIR,
        text=True,
        capture_output=True,
        check=False,
    )


def print_completed_process(process: subprocess.CompletedProcess) -> None:
    if process.stdout:
        print(process.stdout.rstrip())
    if process.stderr:
        print(process.stderr.rstrip(), file=sys.stderr)


def cmd_pull_funnel(args: argparse.Namespace) -> int:
    output = args.output or DEFAULT_FUNNEL_CSV
    summary_json = args.summary_json or DEFAULT_FUNNEL_SUMMARY_JSON
    process = run_live_funnel_export(
        days=args.days,
        output=output,
        summary_json=summary_json,
        limit=args.limit,
        skip_entitlement_audit=args.skip_entitlement_audit,
        json_output=args.json,
    )
    print_completed_process(process)
    return process.returncode


def run_google_growth_export(
    *,
    days: int = 90,
    output_dir: Path | None = None,
    credentials: str | None = None,
    ga4_property_id: str | None = None,
    gsc_site_url: str | None = None,
    skip_ga4: bool = False,
    skip_gsc: bool = False,
    check_config: bool = False,
    json_output: bool = False,
    runner=subprocess.run,
) -> subprocess.CompletedProcess:
    output_path = output_dir or GOOGLE_DIR
    output_path.mkdir(parents=True, exist_ok=True)

    command = [
        "node",
        str(GOOGLE_GROWTH_SCRIPT),
        "--days",
        str(days),
        "--output-dir",
        str(output_path),
    ]
    if credentials:
        command.extend(["--credentials", credentials])
    if ga4_property_id:
        command.extend(["--ga4-property-id", ga4_property_id])
    if gsc_site_url:
        command.extend(["--gsc-site-url", gsc_site_url])
    if skip_ga4:
        command.append("--skip-ga4")
    if skip_gsc:
        command.append("--skip-gsc")
    if check_config:
        command.append("--check-config")
    if json_output:
        command.append("--json")

    return runner(
        command,
        cwd=ROOT_DIR,
        text=True,
        capture_output=True,
        check=False,
    )


def cmd_pull_google(args: argparse.Namespace) -> int:
    process = run_google_growth_export(
        days=args.days,
        output_dir=args.output_dir,
        credentials=args.credentials,
        ga4_property_id=args.ga4_property_id,
        gsc_site_url=args.gsc_site_url,
        skip_ga4=args.skip_ga4,
        skip_gsc=args.skip_gsc,
        check_config=args.check_config,
        json_output=args.json,
    )
    print_completed_process(process)
    return process.returncode


def run_entitlement_sync(
    *,
    execute: bool = False,
    limit: int = 1000,
    json_output: bool = False,
    runner=subprocess.run,
) -> subprocess.CompletedProcess:
    command = [
        "node",
        str(ENTITLEMENT_SYNC_SCRIPT),
        "--limit",
        str(limit),
    ]
    if execute:
        command.append("--execute")
    if json_output:
        command.append("--json")

    return runner(
        command,
        cwd=ROOT_DIR,
        text=True,
        capture_output=True,
        check=False,
    )


def cmd_entitlement_sync(args: argparse.Namespace) -> int:
    process = run_entitlement_sync(
        execute=args.execute,
        limit=args.limit,
        json_output=args.json,
    )
    print_completed_process(process)
    return process.returncode


def cmd_growth_operator(args: argparse.Namespace) -> int:
    sys.path.insert(0, str(BASE_DIR))
    from growth_review import (  # noqa: WPS433
        format_report,
        run_growth_review,
        write_growth_review,
    )

    target = date.fromisoformat(args.date) if args.date else date.today()
    funnel_csv = args.funnel_csv
    if args.live_funnel:
        funnel_csv = funnel_csv or DEFAULT_FUNNEL_CSV
        process = run_live_funnel_export(
            days=args.funnel_days,
            output=funnel_csv,
            summary_json=DEFAULT_FUNNEL_SUMMARY_JSON,
            limit=args.funnel_limit,
            skip_entitlement_audit=args.skip_entitlement_audit,
            json_output=False,
        )
        print_completed_process(process)
        if process.returncode != 0:
            return process.returncode
        print()

    google_json = args.google_json
    if args.live_google:
        google_process = run_google_growth_export(
            days=args.google_days,
            output_dir=GOOGLE_DIR,
            credentials=args.google_credentials,
            ga4_property_id=args.ga4_property_id,
            gsc_site_url=args.gsc_site_url,
            skip_ga4=args.skip_ga4,
            skip_gsc=args.skip_gsc,
            json_output=False,
        )
        print_completed_process(google_process)
        if google_process.returncode != 0:
            return google_process.returncode
        google_json = DEFAULT_GOOGLE_GROWTH_JSON
        print()

    report, paths = run_growth_review(
        funnel_csv=funnel_csv,
        live_summary=DEFAULT_FUNNEL_SUMMARY_JSON if args.live_funnel else args.live_summary_json,
        google_json=google_json,
        pinterest_csv=args.pinterest_csv,
        memory=args.memory,
        days=args.days,
        today=target,
    )

    if args.write:
        markdown_path, json_path = write_growth_review(report, target_date=target)
        stream = sys.stderr if args.json else sys.stdout
        print(f"Growth operator report ulozen: {markdown_path}", file=stream)
        print(f"Growth operator JSON ulozen: {json_path}", file=stream)
        if not args.json:
            print()

    if args.json:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    else:
        print(format_report(report))
        print()
        print("Inputs")
        print(f"- funnel_csv: {paths['funnel_csv']}")
        if paths.get("live_summary"):
            print(f"- live_summary: {paths['live_summary']}")
        if paths.get("google_json"):
            print(f"- google_json: {paths['google_json']}")
        print(f"- pinterest_csv: {paths['pinterest_csv']}")
        print(f"- memory: {paths['memory']}")
    return 0


def cmd_traffic_pack(args: argparse.Namespace) -> int:
    draft_path = Path(args.file)
    text = draft_path.read_text(encoding="utf-8")
    if PLACEHOLDER_RE.search(text) and not args.allow_placeholders:
        print("Traffic pack zastaven: draft stále obsahuje placeholdery. Nejdřív doplň finální posty.")
        return 1
    target = date.fromisoformat(args.date) if args.date else infer_date_from_path(draft_path)
    pack = build_traffic_pack(text, target_date=target, source=args.source)
    if args.write:
        output = write_traffic_pack(draft_path, pack, target)
        print(f"Traffic pack uložen: {output}\n")
    print(pack)
    return 0


def cmd_publish_pack(args: argparse.Namespace) -> int:
    draft_path = Path(args.file)
    text = draft_path.read_text(encoding="utf-8")
    if PLACEHOLDER_RE.search(text) and not args.allow_placeholders:
        print("Publish pack zastaven: draft stále obsahuje placeholdery. Nejdřív doplň finální posty.")
        return 1
    target = date.fromisoformat(args.date) if args.date else infer_date_from_path(draft_path)
    pack = build_publish_pack(text, target_date=target, source=args.source)
    if args.write:
        output = write_publish_pack(pack, target)
        print(f"Publish pack uložen: {output}\n")
    print(pack)
    return 0


def facebook_publish_state_path(payload: FacebookPublishPayload, target: date, page_id: str) -> Path:
    image_identity: dict[str, Any] | None = None
    if payload.image_path:
        image = payload.image_path.resolve()
        image_digest = hashlib.sha256()
        with image.open("rb") as image_file:
            for chunk in iter(lambda: image_file.read(1024 * 1024), b""):
                image_digest.update(chunk)
        image_identity = {
            "sha256": image_digest.hexdigest(),
        }
    identity = {
        "date": target.isoformat(),
        "page_id": page_id,
        "mode": payload.mode,
        "message": payload.message,
        "link": payload.link,
        "first_comment": payload.first_comment,
        "image": image_identity,
    }
    fingerprint = hashlib.sha256(
        json.dumps(identity, ensure_ascii=False, sort_keys=True).encode("utf-8")
    ).hexdigest()
    return CODEX_DIR / "facebook_publish_state" / f"{target.isoformat()}_{fingerprint}.json"


def save_facebook_publish_state(path: Path, state: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary_path: Path | None = None
    try:
        with tempfile.NamedTemporaryFile(
            "w", encoding="utf-8", dir=path.parent, suffix=".tmp", delete=False
        ) as handle:
            temporary_path = Path(handle.name)
            json.dump(state, handle, ensure_ascii=False, indent=2)
            handle.write("\n")
        temporary_path.replace(path)
    finally:
        if temporary_path and temporary_path.exists():
            temporary_path.unlink()


def load_facebook_publish_state(path: Path) -> dict[str, Any] | None:
    if not path.exists():
        return None
    try:
        state = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise ValueError(f"Stav publikace nelze bezpečně přečíst: {path} ({exc})") from exc
    if not isinstance(state, dict) or not isinstance(state.get("status"), str):
        raise ValueError(f"Stav publikace má neplatný formát: {path}")
    if state["status"] in {"published", "comment_pending", "comment_attempting", "comment_uncertain"}:
        if not isinstance(state.get("post_id"), str) or not state["post_id"]:
            raise ValueError(f"Stavu publikace chybí ID Facebook příspěvku: {path}")
    if state["status"] in {"comment_pending", "comment_attempting", "comment_uncertain"}:
        if not isinstance(state.get("first_comment"), str) or not state["first_comment"]:
            raise ValueError(f"Stavu komentáře chybí text prvního komentáře: {path}")
    return state


def cmd_facebook_publish(args: argparse.Namespace) -> int:
    draft_path = Path(args.file)
    text = draft_path.read_text(encoding="utf-8")
    if PLACEHOLDER_RE.search(text) and not args.allow_placeholders:
        print("Facebook publish zastaven: draft stále obsahuje placeholdery. Nejdřív doplň finální posty.")
        return 1

    qa = qa_draft(text)
    print_qa(qa)
    if args.execute and not qa.passed:
        print("Facebook publish zastaven: oprav chyby QA; žádné API volání neproběhlo.")
        return 1
    if args.execute and PLACEHOLDER_RE.search(text):
        print("Facebook publish zastaven: --allow-placeholders nelze použít při ostrém publikování.")
        return 1

    target = date.fromisoformat(args.date) if args.date else infer_date_from_path(draft_path)
    payload = build_facebook_publish_payload(
        text,
        target_date=target,
        mode=args.mode,
        link_placement=args.link_placement,
        image_path=args.image,
    )

    if payload.mode == "link" and not payload.link:
        print("Facebook link post zastaven: příspěvek neobsahuje přirozený odkaz na funkci webu.")
        return 1

    if payload.mode == "photo":
        if not payload.image_path or not payload.image_path.exists():
            print(f"Facebook publish zastaven: obrázek neexistuje: {payload.image_path}")
            print("Vygeneruj obrázek, předej --image, nebo použij --mode link.")
            return 1
        publish_image = payload.image_path
        publish_link = None
    else:
        publish_image = None
        publish_link = payload.link

    status = "EXECUTE" if args.execute else "DRY RUN"
    print(f"Facebook API {status} — {target.isoformat()}")
    print(f"- Mode: {payload.mode}")
    print(f"- Slot: {payload.slot_id}")
    print(f"- Téma: {payload.topic}")
    print(f"- Web funkce: {payload.feature}")
    print(f"- Funnel source: {payload.tracking_source}")
    print(f"- Funnel feature: {payload.tracking_feature}")
    print(f"- Link: {payload.link}")
    if payload.first_comment:
        print("- Link placement: první komentář")
    if publish_image:
        print(f"- Obrázek: {publish_image}")
    print("\nMessage:")
    print(payload.message)
    if payload.first_comment:
        print("\nFirst comment:")
        print(payload.first_comment)

    if not args.execute:
        print("\nNic nebylo publikováno. Ostrý post vyžaduje flag --execute.")
        return 0

    sys.path.insert(0, str(BASE_DIR))
    from meta_publisher import MetaPublisher  # noqa: WPS433

    publisher = MetaPublisher()
    if not args.skip_verify:
        verification = publisher.verify_credentials()
        if not verification.get("success"):
            print(f"\nMeta credentials selhaly: {verification.get('error')}")
            return 1
        print(f"\nMeta API ověřeno: {verification.get('name')} ({verification.get('id')})")

    state_path = facebook_publish_state_path(payload, target, str(publisher.page_id))
    lock_path = state_path.with_suffix(".lock")
    try:
        state_path.parent.mkdir(parents=True, exist_ok=True)
    except OSError as exc:
        print(f"Facebook publish zastaven: nelze vytvořit složku stavu: {exc}")
        return 1
    try:
        lock_fd = os.open(str(lock_path), os.O_CREAT | os.O_EXCL | os.O_WRONLY)
    except FileExistsError:
        if not args.recover_stale_lock:
            print(f"Facebook publish zastaven: stejný payload už zpracovává jiný běh ({lock_path}).")
            print("Po pádu procesu ověř, že už neběží, a teprve potom použij --recover-stale-lock.")
            return 1
        try:
            age_seconds = datetime.now().timestamp() - lock_path.stat().st_mtime
            if age_seconds < 300:
                print("Zámek je mladší než 5 minut; bezpečně ho nelze považovat za osiřelý.")
                return 1
            lock_path.unlink(missing_ok=True)
            lock_fd = os.open(str(lock_path), os.O_CREAT | os.O_EXCL | os.O_WRONLY)
        except (FileNotFoundError, FileExistsError, OSError) as exc:
            print(f"Facebook publish zastaven: zámek nelze bezpečně obnovit ({exc}).")
            return 1

    try:
        with os.fdopen(lock_fd, "w", encoding="ascii") as lock_handle:
            lock_handle.write(f"pid={os.getpid()}\n")

        try:
            state = load_facebook_publish_state(state_path)
        except ValueError as exc:
            print(f"Facebook publish zastaven: {exc}")
            return 1

        if args.retry_first_comment and args.confirm_not_published:
            print("Vyber pouze jednu možnost obnovy: komentář, nebo nejistý post.")
            return 1
        if args.confirm_not_published and not state:
            print("--confirm-not-published vyžaduje existující nejistý stav publikace.")
            return 1
        if args.confirm_not_published and state and state["status"] not in {"publishing", "publish_uncertain"}:
            print("--confirm-not-published lze použít jen pro nejistý stav publikace.")
            return 1
        if args.retry_first_comment and state and state["status"] not in {"comment_attempting", "comment_uncertain"}:
            print("--retry-first-comment lze použít jen pro nejistý stav komentáře.")
            return 1

        if state and state["status"] in {"publishing", "publish_uncertain"}:
            if not args.confirm_not_published:
                print(
                    "Výsledek publikace není jistý. Zkontroluj Facebook stránku; "
                    "pokud tam tento post není, spusť znovu s --confirm-not-published."
                )
                return 1
            state = None
            print("Potvrzení přijato; po ruční kontrole stránky zkusím publikaci znovu.")

        if state:
            state_status = state["status"]
            post_id = state.get("post_id")
            if state_status == "published":
                print(f"Facebook post už byl publikován ({post_id}); další kopie nebyla vytvořena.")
                return 0
            if state_status == "comment_pending":
                print(f"Navazuji na už publikovaný post {post_id}; nový post se nevytvoří.")
            elif state_status in {"comment_attempting", "comment_uncertain"}:
                if args.confirm_not_published:
                    print("U tohoto stavu je nejistý komentář, nikoli publikace; použij --retry-first-comment.")
                    return 1
                if not args.retry_first_comment:
                    print(
                        "Stav prvního komentáře není jistý. Zkontroluj ho na Facebooku; "
                        "pokud tam není, spusť znovu s --retry-first-comment."
                    )
                    return 1
                state["status"] = "comment_pending"
                state["updated_at"] = datetime.now().isoformat(timespec="seconds")
                save_facebook_publish_state(state_path, state)
                print(f"Opakuji pouze první komentář u už publikovaného postu {post_id}.")
            else:
                print(
                    f"Stav `{state_status}` může znamenat, že Facebook post už vznikl. "
                    f"Ověř stránku a stavový soubor {state_path}; post nebyl znovu odeslán."
                )
                return 1
        else:
            if args.retry_first_comment:
                print("--retry-first-comment vyžaduje existující nejistý stav komentáře.")
                return 1
            state = {
                "status": "publishing",
                "date": target.isoformat(),
                "page_id": str(publisher.page_id),
                "message": payload.message,
                "link": payload.link,
                "first_comment": payload.first_comment,
                "platform": "facebook",
                "topic": payload.topic,
                "post_type": payload.post_type,
                "content_intent": payload.content_intent,
                "slot_id": payload.slot_id,
                "mode": payload.mode,
                "campaign": payload.campaign,
                "tracking_source": payload.tracking_source,
                "tracking_feature": payload.tracking_feature,
                "image_path": str(payload.image_path or ""),
                "created_at": datetime.now().isoformat(timespec="seconds"),
            }
            try:
                save_facebook_publish_state(state_path, state)
            except OSError as exc:
                print(f"Nelze uložit ochranný stav publikace: {exc}; API volání neproběhlo.")
                return 1

            try:
                result = publisher.publish_to_facebook(
                    message=payload.message,
                    image_path=publish_image,
                    link=publish_link,
                )
            except Exception as exc:  # Network timeout may happen after Meta accepted the post.
                state["status"] = "publish_uncertain"
                state["error"] = str(exc)
                state["updated_at"] = datetime.now().isoformat(timespec="seconds")
                save_facebook_publish_state(state_path, state)
                print(
                    "Facebook publish skončil nejistým stavem (např. timeout). "
                    f"Neopakuj ho, dokud nezkontroluješ stránku. Stav: {state_path}"
                )
                return 1

            if not result.get("success") or not result.get("post_id"):
                state["status"] = "publish_uncertain"
                state["error"] = result.get("error", "Meta nevrátilo ID postu")
                state["updated_at"] = datetime.now().isoformat(timespec="seconds")
                save_facebook_publish_state(state_path, state)
                print(
                    f"Facebook publish nemá potvrzené ID ({state['error']}). "
                    f"Pro jistotu neodesílej znovu; nejdřív zkontroluj stránku. Stav: {state_path}"
                )
                return 1

            post_id = str(result["post_id"])
            state["post_id"] = post_id
            state["status"] = "comment_pending" if payload.first_comment else "published"
            state["published_at"] = datetime.now().isoformat(timespec="seconds")
            save_facebook_publish_state(state_path, state)
            print(f"\nFacebook post publikován: {post_id}")

        # Record the confirmed Facebook post by its stable Meta ID. Failure to
        # write analytics must not interrupt the post's first-comment recovery.
        try:
            sys.path.insert(0, str(BASE_DIR))
            from generators.content_memory import record_published_post  # noqa: WPS433

            record_published_post(
                post_id=str(post_id),
                platform="facebook",
                published_at=state.get("published_at") or state.get("created_at") or datetime.now().isoformat(timespec="seconds"),
                topic=state.get("topic") or payload.topic,
                post_type=state.get("post_type") or payload.post_type,
                content_intent=state.get("content_intent") or payload.content_intent,
                slot_id=state.get("slot_id") or payload.slot_id,
                mode=state.get("mode") or payload.mode,
                page_id=state.get("page_id") or str(publisher.page_id),
                message=state.get("message") or payload.message,
                link=state.get("link") or payload.link,
                image_path=state.get("image_path") or str(payload.image_path or ""),
                campaign=state.get("campaign") or payload.campaign,
                tracking_source=state.get("tracking_source") or payload.tracking_source,
            )
        except Exception as exc:
            print(f"Facebook post je potvrzený, ale záznam statistik se nepodařilo uložit: {exc}")

        if payload.first_comment and state.get("status") == "comment_pending":
            state["status"] = "comment_attempting"
            state["updated_at"] = datetime.now().isoformat(timespec="seconds")
            save_facebook_publish_state(state_path, state)
            try:
                comment_result = publisher.comment_on_facebook_object(
                    str(post_id), payload.first_comment
                )
            except Exception as exc:  # A timeout can leave a comment live without a response.
                comment_result = {"success": False, "error": str(exc)}

            if comment_result.get("success"):
                state["status"] = "published"
                state["comment_id"] = comment_result.get("comment_id")
                state["updated_at"] = datetime.now().isoformat(timespec="seconds")
                save_facebook_publish_state(state_path, state)
                print(f"První komentář s odkazem přidán: {comment_result.get('comment_id')}")
            else:
                state["status"] = "comment_uncertain"
                state["error"] = comment_result.get("error", "Meta nepotvrdilo komentář")
                state["updated_at"] = datetime.now().isoformat(timespec="seconds")
                save_facebook_publish_state(state_path, state)
                print(
                    f"První komentář nemá potvrzený výsledek ({state['error']}). "
                    "Post zůstává publikovaný; před případným opakováním ověř komentáře na Facebooku."
                )
                return 1
        return 0
    finally:
        try:
            lock_path.unlink(missing_ok=True)
        except OSError as exc:
            print(f"Pozor: publikační zámek zůstal uložený ({lock_path}): {exc}")


def cmd_visual_pack(args: argparse.Namespace) -> int:
    draft_path = Path(args.file)
    text = draft_path.read_text(encoding="utf-8")
    if PLACEHOLDER_RE.search(text) and not args.allow_placeholders:
        print("Visual pack zastaven: draft stále obsahuje placeholdery. Nejdřív doplň finální posty.")
        return 1
    target = date.fromisoformat(args.date) if args.date else infer_date_from_path(draft_path)
    pack, generated = build_visual_pack(
        text,
        target_date=target,
        mode=args.mode,
        generate=args.generate,
    )
    if args.write:
        output = write_visual_pack(pack, target)
        print(f"Visual pack uložen: {output}\n")
    print(pack)
    if generated:
        print("Vygenerované obrázky:")
        for path in generated:
            print(f"- {path}")
    return 0


def cmd_codex_image_brief(args: argparse.Namespace) -> int:
    draft_path = Path(args.file)
    text = draft_path.read_text(encoding="utf-8")
    if PLACEHOLDER_RE.search(text) and not args.allow_placeholders:
        print("Codex image brief zastaven: draft stále obsahuje placeholdery. Nejdřív doplň finální posty.")
        return 1
    target = date.fromisoformat(args.date) if args.date else infer_date_from_path(draft_path)
    brief, _, destination = build_codex_image_brief(text, target_date=target, mode=args.mode)
    if args.write:
        output = write_codex_image_brief(brief, target)
        print(f"Codex image brief uložen: {output}")
        print(f"Cílový soubor po vygenerování: {destination}\n")
    print(brief)
    return 0


def cmd_preview(args: argparse.Namespace) -> int:
    draft_path = Path(args.file)
    text = draft_path.read_text(encoding="utf-8")
    if PLACEHOLDER_RE.search(text) and not args.allow_placeholders:
        print("Preview zastaven: draft stále obsahuje placeholdery. Nejdřív doplň finální posty.")
        return 1
    target = date.fromisoformat(args.date) if args.date else infer_date_from_path(draft_path)
    preview = build_preview_html(text, target_date=target)
    output = write_preview_html(preview, target)
    print(f"Preview HTML uložen: {output}")
    return 0


def cmd_urls(_: argparse.Namespace) -> int:
    print("Povolené soft_promo web funkce:")
    for feature, url in WEB_FEATURES.items():
        exists = (ROOT_DIR / url.lstrip("/")).exists()
        status = "OK" if exists else "CHYBÍ"
        print(f"- {feature}: {url} [{status}]")
    if LEGACY_URL_FIXES:
        print("\nZnámé opravy překlepů:")
        for old, new in LEGACY_URL_FIXES.items():
            print(f"- {old} -> {new}")
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Codex workflow pro denní social content Mystické Hvězdy",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    brief = sub.add_parser("brief", help="Vytiskne denní brief z content_memory")
    brief.add_argument("--date", help="Datum YYYY-MM-DD, default dnes")
    brief.set_defaults(func=cmd_brief)

    daily = sub.add_parser("daily", help="Uloží denní Codex brief do output/codex")
    daily.add_argument("--date", help="Datum YYYY-MM-DD, default dnes")
    daily.set_defaults(func=cmd_daily)

    operator = sub.add_parser("daily-operator", help="Zkontroluje draft a vytvoří soukromý review náhled")
    operator.add_argument("--file", help="Markdown draft s jedním nebo více příspěvky. Default output/codex/daily_posts_YYYY-MM-DD.md")
    operator.add_argument("--date", help="Datum YYYY-MM-DD, default dnes")
    operator.add_argument("--source", default="instagram", help="utm_source pro IG odkazy")
    operator.add_argument("--image", help="Volitelná cesta k hotovému obrázku pro Facebook photo post")
    operator.add_argument(
        "--facebook-mode",
        default="photo",
        choices=["photo", "link"],
        help="photo = doporučeno; link = klasický Facebook link card post",
    )
    operator.add_argument(
        "--link-placement",
        default="first-comment",
        choices=["first-comment", "caption", "none"],
        help="Kam dát trackovaný odkaz u photo postu. Default první komentář.",
    )
    operator.add_argument("--no-write", action="store_true", help="Jen vytisknout report, neukládat packy a HTML")
    operator.add_argument("--traffic-pack", action="store_true", help="Navíc připravit traffic pack pro draft s intent=soft_promo")
    operator.add_argument("--publish-pack", action="store_true", help="Navíc připravit publikační varianty pro draft s intent=soft_promo")
    operator.add_argument("--no-fail", action="store_true", help="Vrátit exit 0 i při QA chybách")
    operator.add_argument("--allow-missing-image", action="store_true", help="Neblokovat photo workflow, když chybí obrázek")
    operator.add_argument("--allow-placeholders", action="store_true", help="Povolit výstup i z nevyplněné šablony")
    operator.set_defaults(func=cmd_daily_operator)

    qa = sub.add_parser("qa", help="Zkontroluje hotový markdown draft podle AGENTS.md")
    qa.add_argument("--file", required=True, help="Markdown draft s jedním nebo více příspěvky")
    qa.add_argument("--no-fail", action="store_true", help="Vždy exit 0 i při chybách")
    qa.set_defaults(func=cmd_qa)

    log = sub.add_parser("log-draft", help="Zaloguje schválený markdown draft do content_memory")
    log.add_argument("--file", required=True, help="Markdown draft s jedním nebo více příspěvky")
    log.add_argument("--score", type=float, help="Volitelné skutečně vypočtené QA skóre; nevyplňuj odhad")
    log.add_argument("--force", action="store_true", help="Logovat i při QA chybách nebo duplicitě")
    log.add_argument("--dry-run", action="store_true", help="Otestovat logování bez změny content_memory.json")
    log.set_defaults(func=cmd_log_draft)

    engagement_template = sub.add_parser("engagement-template", help="Vytvoří CSV šablonu pro doplnění výsledků postů")
    engagement_template.add_argument("--days", type=int, default=14, help="Kolik dnů zpět zahrnout")
    engagement_template.add_argument("--date", help="Datum YYYY-MM-DD, default dnes")
    engagement_template.add_argument("--output", type=Path, help="Cílový CSV soubor. Default output/codex/engagement_template_YYYY-MM-DD.csv")
    engagement_template.set_defaults(func=cmd_engagement_template)

    engagement_import = sub.add_parser("engagement-import", help="Naimportuje výsledky postů z engagement CSV do content_memory")
    engagement_import.add_argument("--file", type=Path, required=True, help="CSV s columns: date, post_type, topic, likes/comments/shares/saves/views nebo engagement")
    engagement_import.add_argument("--dry-run", action="store_true", help="Vypsat import bez změny content_memory.json")
    engagement_import.set_defaults(func=cmd_engagement_import)

    weekly = sub.add_parser("weekly", help="Datový review report pro další týden")
    weekly.add_argument("--days", type=int, default=7)
    weekly.add_argument("--write", action="store_true", help="Uložit report do output/codex")
    weekly.set_defaults(func=cmd_weekly)

    pull = sub.add_parser("pull-funnel", help="Download live Supabase funnel export for growth operator")
    pull.add_argument("--days", type=int, default=90, help="Funnel data window in days")
    pull.add_argument("--limit", type=int, default=5000, help="Maximum funnel events used by the report")
    pull.add_argument("--output", type=Path, help="Segments CSV output path. Default output/revenue/funnel-segments-90d.csv")
    pull.add_argument("--summary-json", type=Path, help="Summary JSON output path. Default output/revenue/funnel-live-summary.json")
    pull.add_argument("--skip-entitlement-audit", action="store_true", help="Skip subscription/user premium flag audit")
    pull.add_argument("--json", action="store_true", help="Print machine-readable JSON")
    pull.set_defaults(func=cmd_pull_funnel)

    google_pull = sub.add_parser("pull-google", help="Download Google Search Console and GA4 growth data")
    google_pull.add_argument("--days", type=int, default=90, help="Google data window in days")
    google_pull.add_argument("--output-dir", type=Path, help="Output directory. Default output/google")
    google_pull.add_argument("--credentials", help="Path to Google service-account JSON")
    google_pull.add_argument("--ga4-property-id", help="GA4 numeric property ID")
    google_pull.add_argument("--gsc-site-url", help="Search Console site URL, e.g. sc-domain:mystickahvezda.cz")
    google_pull.add_argument("--skip-ga4", action="store_true", help="Only fetch Search Console data")
    google_pull.add_argument("--skip-gsc", action="store_true", help="Only fetch GA4 data")
    google_pull.add_argument("--check-config", action="store_true", help="Validate env/config without calling Google APIs")
    google_pull.add_argument("--json", action="store_true", help="Print machine-readable JSON")
    google_pull.set_defaults(func=cmd_pull_google)

    entitlement = sub.add_parser("entitlement-sync", help="Dry-run or execute premium users.is_premium repair")
    entitlement.add_argument("--limit", type=int, default=1000, help="Maximum active subscription rows to inspect")
    entitlement.add_argument("--execute", action="store_true", help="Actually update mismatched users.is_premium flags")
    entitlement.add_argument("--json", action="store_true", help="Print machine-readable JSON")
    entitlement.set_defaults(func=cmd_entitlement_sync)

    growth = sub.add_parser("growth-operator", help="Spojí social memory, funnel export a Pinterest do akčního growth reportu")
    growth.add_argument("--funnel-csv", type=Path, help="Admin export /api/admin/funnel?format=csv&view=segments")
    growth.add_argument("--pinterest-csv", type=Path, help="Pinterest inventory CSV. Default output/pinterest/pinterest_pins.csv")
    growth.add_argument("--memory", type=Path, help="Content memory JSON. Default output/content_memory.json")
    growth.add_argument("--days", type=int, default=14, help="Kolik dní content memory vyhodnotit")
    growth.add_argument("--live-funnel", action="store_true", help="Download live Supabase funnel before the review")
    growth.add_argument("--funnel-days", type=int, default=90, help="Funnel data window in days for --live-funnel")
    growth.add_argument("--funnel-limit", type=int, default=5000, help="Maximum funnel events for --live-funnel")
    growth.add_argument("--skip-entitlement-audit", action="store_true", help="Skip subscription/user premium audit for --live-funnel")
    growth.add_argument("--live-summary-json", type=Path, help="Saved JSON summary from pull-funnel for entitlement drift checks")
    growth.add_argument("--live-google", action="store_true", help="Download Google Search Console and GA4 before the review")
    growth.add_argument("--google-json", type=Path, help="Saved JSON summary from pull-google")
    growth.add_argument("--google-days", type=int, default=90, help="Google data window in days for --live-google")
    growth.add_argument("--google-credentials", help="Path to Google service-account JSON for --live-google")
    growth.add_argument("--ga4-property-id", help="GA4 numeric property ID for --live-google")
    growth.add_argument("--gsc-site-url", help="Search Console site URL for --live-google")
    growth.add_argument("--skip-ga4", action="store_true", help="With --live-google, skip GA4")
    growth.add_argument("--skip-gsc", action="store_true", help="With --live-google, skip Search Console")
    growth.add_argument("--date", help="Datum reportu YYYY-MM-DD, default dnes")
    growth.add_argument("--write", action="store_true", help="Uložit Markdown a JSON report do output/codex")
    growth.add_argument("--json", action="store_true", help="Vytisknout machine-readable JSON")
    growth.set_defaults(func=cmd_growth_operator)

    traffic = sub.add_parser("traffic-pack", help="Vytvoří UTM odkazy, Story CTA a Facebook post z denního draftu")
    traffic.add_argument("--file", required=True, help="Markdown draft s jedním nebo více příspěvky")
    traffic.add_argument("--date", help="Datum YYYY-MM-DD, default z názvu souboru nebo dnes")
    traffic.add_argument("--source", default="instagram", help="utm_source pro IG odkazy")
    traffic.add_argument("--write", action="store_true", help="Uložit traffic pack do output/codex")
    traffic.add_argument("--allow-placeholders", action="store_true", help="Povolit výstup i z nevyplněné šablony")
    traffic.set_defaults(func=cmd_traffic_pack)

    publish = sub.add_parser("publish-pack", help="Vytvoří publikační balíček z vybraného draftu")
    publish.add_argument("--file", required=True, help="Markdown draft s jedním nebo více příspěvky")
    publish.add_argument("--date", help="Datum YYYY-MM-DD, default z názvu souboru nebo dnes")
    publish.add_argument("--source", default="instagram", help="utm_source pro IG odkazy")
    publish.add_argument("--write", action="store_true", help="Uložit publish pack do output/codex")
    publish.add_argument("--allow-placeholders", action="store_true", help="Povolit výstup i z nevyplněné šablony")
    publish.set_defaults(func=cmd_publish_pack)

    fb = sub.add_parser("facebook-publish", help="Pošle traffic post na Facebook stránku přes Meta API")
    fb.add_argument("--file", required=True, help="Markdown draft s jedním nebo více příspěvky")
    fb.add_argument("--date", help="Datum YYYY-MM-DD, default z názvu souboru nebo dnes")
    fb.add_argument(
        "--mode",
        default="photo",
        choices=["photo", "link"],
        help="photo = doporučeno, zachová 4:5 obrázek; link = klasický link card post",
    )
    fb.add_argument(
        "--link-placement",
        default="first-comment",
        choices=["first-comment", "caption", "none"],
        help="Kam dát trackovaný odkaz u photo postu. Default první komentář, aby hlavní text nebyl dlouhý.",
    )
    fb.add_argument("--image", help="Volitelná cesta k obrázku pro --mode photo")
    fb.add_argument("--execute", action="store_true", help="Skutečně publikovat na Facebook stránku")
    fb.add_argument("--skip-verify", action="store_true", help="Přeskočit ověření Meta credentials před publikací")
    fb.add_argument(
        "--retry-first-comment",
        action="store_true",
        help="Po ruční kontrole Facebooku opakovat jen komentář, pokud předchozí výsledek nebyl jistý",
    )
    fb.add_argument(
        "--confirm-not-published",
        action="store_true",
        help="Po ruční kontrole stránky potvrdit, že nejistý post nevznikl, a zkusit publikaci znovu",
    )
    fb.add_argument(
        "--recover-stale-lock",
        action="store_true",
        help="Po kontrole, že původní proces neběží, obnovit zámek starší než 5 minut",
    )
    fb.add_argument("--allow-placeholders", action="store_true", help="Povolit výstup i z nevyplněné šablony")
    fb.set_defaults(func=cmd_facebook_publish)

    visual = sub.add_parser("visual-pack", help="Připraví vizuály nebo grafiku podle konkrétního draftu")
    visual.add_argument("--file", required=True, help="Markdown draft s jedním nebo více příspěvky")
    visual.add_argument("--date", help="Datum YYYY-MM-DD, default z názvu souboru nebo dnes")
    visual.add_argument(
        "--mode",
        default="traffic",
        choices=["traffic", "morning", "noon", "evening", "all"],
        help="Které vizuály připravit. Default traffic = jen hlavní webový cíl.",
    )
    visual.add_argument("--write", action="store_true", help="Uložit visual pack do output/codex")
    visual.add_argument("--generate", action="store_true", help="Skutečně vygenerovat PNG obrázky do output/images")
    visual.add_argument("--allow-placeholders", action="store_true", help="Povolit výstup i z nevyplněné šablony")
    visual.set_defaults(func=cmd_visual_pack)

    codex_img = sub.add_parser("codex-image-brief", help="Vytvoří proměnlivý, textem řízený prompt pro Codex image tool")
    codex_img.add_argument("--file", required=True, help="Markdown draft s jedním nebo více příspěvky")
    codex_img.add_argument("--date", help="Datum YYYY-MM-DD, default z názvu souboru nebo dnes")
    codex_img.add_argument(
        "--mode",
        default="traffic",
        choices=["traffic", "morning", "noon", "evening"],
        help="Který vizuál připravit pro Codex image tool. Default traffic.",
    )
    codex_img.add_argument("--write", action="store_true", help="Uložit brief do output/codex")
    codex_img.add_argument("--allow-placeholders", action="store_true", help="Povolit výstup i z nevyplněné šablony")
    codex_img.set_defaults(func=cmd_codex_image_brief)

    preview = sub.add_parser("preview", help="Vytvoří interní HTML náhled příspěvků z draftu")
    preview.add_argument("--file", required=True, help="Markdown draft s jedním nebo více příspěvky")
    preview.add_argument("--date", help="Datum YYYY-MM-DD, default z názvu souboru nebo dnes")
    preview.add_argument("--allow-placeholders", action="store_true", help="Povolit výstup i z nevyplněné šablony")
    preview.set_defaults(func=cmd_preview)

    urls = sub.add_parser("urls", help="Zobrazí povolené promo URL a ověří lokální soubory")
    urls.set_defaults(func=cmd_urls)

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
