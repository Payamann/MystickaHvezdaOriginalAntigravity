"""
Content Memory — sleduje použité témata a typy postů,
aby agent nevygeneroval stejný obsah dvakrát.

Atomic writes: zápis probíhá do temp souboru a poté
se přejmenuje — chrání proti poškození při crashi.
"""
import json
import random
import re
import statistics
import tempfile
import os
import time
from pathlib import Path
from datetime import datetime, date
from typing import Optional
import sys
sys.path.insert(0, str(Path(__file__).parent.parent))
import config
from logger import get_logger

log = get_logger(__name__)

MEMORY_FILE = config.OUTPUT_DIR / "content_memory.json"
ATOMIC_REPLACE_ATTEMPTS = 5


_EMPTY_MEMORY = lambda: {
    "used_topics": [],
    "used_hooks": [],
    "used_post_types_last_7": [],
    "last_blog_promos": [],
    "approved_posts": [],        # schválené posty s náhledem a blog info
    "published_posts": [],       # skutečně publikované posty s platformním ID
    "total_posts": 0,
    "total_approved": 0,
    "created_at": datetime.now().isoformat(),
    # Historické redakční záznamy; samy o sobě neurčují další text.
    "qg_issue_log": [],
    "hook_scores": {},            # staré interní QA skóre, nikoli výkon postů
    "engagement_log": [],         # manuální feedback o reálném engagementu
    "editorial_notes": [],        # ruční poznámky, které nevstupují automaticky do generování
    "golden_templates": [],       # starší záznamy, už se neinjektují do promptů
    # === CONTENT SERIES ===
    "active_series": None,        # aktivní mini-série {name, theme, posts_planned, posts_done, start_date}
    # === WEEKLY COHESION ===
    "weekly_theme": None,         # {theme, week_start, description}
    "used_ctas": [],              # historická kompatibilita
}


def _load_memory() -> dict:
    if not MEMORY_FILE.exists():
        return _EMPTY_MEMORY()
    try:
        data = json.loads(MEMORY_FILE.read_text(encoding='utf-8'))
        # Zpětná kompatibilita — přidej chybějící klíče starým souborům
        for key, val in _EMPTY_MEMORY().items():
            if key not in data:
                data[key] = val
        return data
    except (json.JSONDecodeError, OSError) as e:
        log.error("Poškozený content_memory.json, vytvářím nový: %s", e)
        return _EMPTY_MEMORY()


def _save_memory(memory: dict):
    """
    Atomický zápis paměti — zapíše do temp souboru
    a přejmenuje na cílový. Při crashu zůstane starý soubor.
    """
    config.OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Zapíšeme do temp souboru ve stejném adresáři (nutné pro os.replace)
    fd, tmp_path = tempfile.mkstemp(
        suffix=".tmp",
        prefix="content_memory_",
        dir=str(config.OUTPUT_DIR),
    )
    try:
        with os.fdopen(fd, 'w', encoding='utf-8') as f:
            json.dump(memory, f, ensure_ascii=False, indent=2)
            f.flush()
            os.fsync(f.fileno())
        # Atomický přesun — na stejném filesystému je to atomic operace
        for attempt in range(ATOMIC_REPLACE_ATTEMPTS):
            try:
                os.replace(tmp_path, str(MEMORY_FILE))
                break
            except PermissionError:
                if attempt == ATOMIC_REPLACE_ATTEMPTS - 1:
                    raise
                time.sleep(0.05 * (attempt + 1))
        log.debug("Content memory uložena atomicky: %s", MEMORY_FILE)
    except Exception:
        # Pokud se něco pokazí, smaž temp soubor
        try:
            os.unlink(tmp_path)
        except OSError:
            pass
        raise


def pick_content_intent() -> str:
    """Zpětně kompatibilní výchozí záměr; propagaci volí člověk výslovně."""
    return "pure_value"


def pick_post_type_for_slot(slot_preferred_types: list[str]) -> str:
    """Vybere z formátů vhodných pro slot bez předepsaných poměrů obsahu."""
    if not slot_preferred_types:
        return "educational"
    return random.choice(slot_preferred_types)


def record_post(topic: str, post_type: str, hook_formula: str = "", blog_slug: str = "", content_intent: str = "pure_value"):
    """Zaznamená použitý post do paměti"""
    memory = _load_memory()

    entry = {
        "topic": topic,
        "post_type": post_type,
        "hook_formula": hook_formula,
        "content_intent": content_intent,
        "date": date.today().isoformat(),
    }

    memory["used_topics"].append(entry)
    memory["used_post_types_last_7"].append({
        "type": post_type,
        "date": date.today().isoformat(),
    })
    memory["total_posts"] = memory.get("total_posts", 0) + 1

    if hook_formula:
        memory["used_hooks"].append({
            "formula": hook_formula,
            "date": date.today().isoformat(),
        })

    if blog_slug:
        memory["last_blog_promos"].append({
            "slug": blog_slug,
            "date": date.today().isoformat(),
        })

    # Udržuj max 100 záznamů
    for key in ["used_topics", "used_post_types_last_7", "used_hooks", "last_blog_promos"]:
        if len(memory.get(key, [])) > 100:
            memory[key] = memory[key][-100:]

    _save_memory(memory)


def record_approved_post(
    topic: str,
    post_type: str,
    caption: str,
    quality_score: float | None = None,
    content_intent: str = "pure_value",
    blog_slugs: Optional[list] = None,
):
    """
    Zaznamená finální text schválený člověkem do paměti.
    Automaticky extrahuje zmíněné blog slugy z caption textu.

    Odlišné od record_post(), který sleduje i zamítnuté pokusy.
    Uložený návrh nemusí být publikován; QA skóre je pouze interní redakční údaj.
    """
    memory = _load_memory()

    # Automatická extrakce blog slugů z caption (URL vzor /blog/slug.html)
    extracted_slugs = re.findall(r'/blog/([\w-]+)\.html', caption)
    all_slugs = list(set((blog_slugs or []) + extracted_slugs))

    entry = {
        "topic": topic,
        "post_type": post_type,
        "caption_preview": caption[:100].replace("\n", " ").strip(),
        "content_intent": content_intent,
        "blog_slugs": all_slugs,
        "date": date.today().isoformat(),
    }
    if isinstance(quality_score, (int, float)):
        entry["quality_score"] = round(float(quality_score), 1)

    memory.setdefault("approved_posts", []).append(entry)
    memory["total_approved"] = memory.get("total_approved", 0) + 1

    # Také aktualizuj last_blog_promos pro zpětnou kompatibilitu
    for slug in all_slugs:
        memory.setdefault("last_blog_promos", []).append({
            "slug": slug,
            "date": date.today().isoformat(),
        })

    # Udržuj max 200 schválených postů (delší paměť než used_topics)
    if len(memory["approved_posts"]) > 200:
        memory["approved_posts"] = memory["approved_posts"][-200:]
    if len(memory.get("last_blog_promos", [])) > 100:
        memory["last_blog_promos"] = memory["last_blog_promos"][-100:]

    _save_memory(memory)
    score_label = f"QA {quality_score:.1f}" if isinstance(quality_score, (int, float)) else "bez QA skóre"
    log.info("Schválený post uložen do paměti: '%s' / %s (%s, blogy: %s)",
             topic, post_type, score_label, all_slugs or "žádné")


def get_variety_context(platform: str | None = None) -> dict:
    """
    Vrátí kontext pro prompt, aby se vyhnul opakování.
    Zahrnuje nedávná témata, formáty a blogové články.
    """
    memory = _load_memory()
    today = date.today()

    # Témata použitá v posledních 14 dnech
    recent_topics = [
        e["topic"] for e in memory.get("used_topics", [])
        if (today - date.fromisoformat(e["date"])).days <= 14
    ]

    # Typy postů z posledních 7 dní
    recent_types = [
        e["type"] for e in memory.get("used_post_types_last_7", [])
        if (today - date.fromisoformat(e["date"])).days <= 7
    ]

    # Blog slugy ze schválených postů (posledních 60 dní) — hlavní zdroj
    approved_blog_slugs = []
    for e in memory.get("approved_posts", []):
        if (today - date.fromisoformat(e["date"])).days <= 60:
            approved_blog_slugs.extend(e.get("blog_slugs", []))

    # Fallback: starý last_blog_promos (30 dní)
    legacy_blog_slugs = [
        e["slug"] for e in memory.get("last_blog_promos", [])
        if (today - date.fromisoformat(e["date"])).days <= 30
    ]

    all_blog_slugs = list(set(approved_blog_slugs + legacy_blog_slugs))

    # Nedávné caption preview — pro kontrolu duplicit
    recent_captions = [
        e.get("caption_preview", "")
        for e in memory.get("approved_posts", [])
        if (today - date.fromisoformat(e["date"])).days <= 30
    ]

    blog_avoid = (
        f"\nNedávno použitý blog (zvaž jiný, pokud existuje lepší volba): "
        f"{', '.join(all_blog_slugs)}"
    ) if all_blog_slugs else ""

    performance_context = get_performance_learning_context(platform)

    avoid_parts = []
    if recent_topics or recent_types:
        avoid_parts.append(
            "KONTEXT PRO ORIGINALITU — tato témata/formáty se nedávno objevily: "
            f"témata: {', '.join(set(recent_topics)) or 'žádná'}; "
            f"formáty: {', '.join(set(recent_types)) or 'žádné'}. "
            "Při podobném zadání zkus jiný konkrétní úhel; téma ani formát nejsou zakázané."
        )
    if blog_avoid:
        avoid_parts.append(blog_avoid.strip())

    return {
        "recent_topics": list(set(recent_topics)),
        "recent_post_types": list(set(recent_types)),
        "recent_hooks": [],  # kompatibilita se staršími volajícími; štítky hooků se nepoužívají
        "recent_blog_slugs": all_blog_slugs,
        "recent_captions": recent_captions[-10:],
        "total_posts": memory.get("total_posts", 0),
        "total_approved": memory.get("total_approved", 0),
        "avoid_instruction": "\n".join(avoid_parts),
        "performance_context": performance_context,
    }


def get_promoted_blog_slugs() -> list[str]:
    """Vrátí slugy blogů propagovaných za posledních 60 dní"""
    return get_variety_context()["recent_blog_slugs"]


def get_approved_post_stats() -> dict:
    """Vrátí statistiky schválených postů (pro příkaz list)."""
    memory = _load_memory()
    today = date.today()
    approved = memory.get("approved_posts", [])

    last_30 = [e for e in approved if (today - date.fromisoformat(e["date"])).days <= 30]
    scores = [
        float(e["quality_score"])
        for e in last_30
        if isinstance(e.get("quality_score"), (int, float))
    ]
    avg_score = round(sum(scores) / len(scores), 1) if scores else 0
    blog_count = sum(1 for e in last_30 if e.get("blog_slugs"))

    return {
        "total_approved": memory.get("total_approved", 0),
        "last_30_days": len(last_30),
        "avg_quality_score": avg_score,
        "blog_posts_last_30": blog_count,
        "recent": last_30[-5:],  # posledních 5
    }


# ══════════════════════════════════════════════════
# REDAKČNÍ QA ZÁZNAM
# ══════════════════════════════════════════════════

def record_qg_issues(post_type: str, issues: list[dict], ai_review: dict | None = None):
    """
    Uloží redakční připomínky pro přehled; neopravují automaticky další texty.

    Args:
        post_type: typ postu (educational, quote, ...)
        issues: seznam issue dictů z QG rule checks
        ai_review: dict z AI review (scores, improvements)
    """
    memory = _load_memory()

    # Extrahuj jen warning/error issues (ne info)
    significant = [
        {"check": i["check"], "message": i["message"][:120]}
        for i in issues
        if i.get("severity") in ("error", "warning")
    ]

    # Extrahuj slabé oblasti z AI review (skóre < 7)
    weak_areas = []
    if ai_review and isinstance(ai_review.get("scores"), dict):
        weak_areas = [
            {"area": area, "score": score}
            for area, score in ai_review["scores"].items()
            if isinstance(score, (int, float)) and score < 7
        ]

    if not significant and not weak_areas:
        return  # nic k zaznamenání

    entry = {
        "date": date.today().isoformat(),
        "post_type": post_type,
        "rule_issues": significant,
        "weak_areas": weak_areas,
        "ai_improvements": (ai_review or {}).get("improvements", [])[:3],
    }

    memory.setdefault("qg_issue_log", []).append(entry)

    # Udržuj max 100 záznamů
    if len(memory["qg_issue_log"]) > 100:
        memory["qg_issue_log"] = memory["qg_issue_log"][-100:]

    _save_memory(memory)
    log.debug("QG issues zaznamenány: %d pravidel, %d slabých oblastí", len(significant), len(weak_areas))


def record_hook_score(hook_formula: str, score: float):
    """Deprecated: editorial QA scores are not evidence of a hook's performance."""
    return


def record_engagement(post_date: str, post_type: str, topic: str, engagement: str, notes: str = ""):
    """
    Zaznamená manuální feedback o reálném engagementu postu.

    Args:
        post_date: datum postu (YYYY-MM-DD)
        post_type: typ postu
        topic: téma postu
        engagement: "high" / "medium" / "low"
        notes: volitelná poznámka (co fungovalo / nefungovalo)
    """
    memory = _load_memory()

    entry = {
        "date": post_date,
        "rated_at": date.today().isoformat(),
        "post_type": post_type,
        "topic": topic,
        "engagement": engagement,
        "notes": notes,
    }

    memory.setdefault("engagement_log", []).append(entry)

    # Udržuj max 200 záznamů
    if len(memory["engagement_log"]) > 200:
        memory["engagement_log"] = memory["engagement_log"][-200:]

    _save_memory(memory)
    log.info("Engagement zaznamenán: %s / %s = %s", topic, post_type, engagement)


POST_METRIC_FIELDS = (
    "reach", "impressions", "views", "reactions", "comments", "shares", "saves", "link_clicks",
)
INTERACTION_FIELDS = ("reactions", "comments", "shares", "saves")


def record_published_post(
    *,
    post_id: str,
    platform: str,
    published_at: str,
    topic: str = "",
    post_type: str = "",
    content_intent: str = "",
    slot_id: str = "",
    mode: str = "",
    page_id: str = "",
    message: str = "",
    link: str = "",
    image_path: str = "",
    campaign: str = "",
    tracking_source: str = "",
) -> bool:
    """Idempotently saves public post metadata by the platform's stable post ID."""
    clean_id = str(post_id or "").strip()
    clean_platform = str(platform or "").strip().lower()
    if not clean_id or not clean_platform:
        raise ValueError("published post requires a platform and a stable post_id")
    if not published_at:
        raise ValueError("published post requires published_at")
    try:
        published_date = date.fromisoformat(str(published_at)[:10])
    except ValueError as exc:
        raise ValueError("published_at must begin with a YYYY-MM-DD date") from exc
    if published_date > date.today():
        raise ValueError("published_at cannot be in the future")

    entry = {
        "post_id": clean_id[:180],
        "platform": clean_platform[:40],
        "published_at": str(published_at)[:40],
        "topic": str(topic or "")[:240],
        "post_type": str(post_type or "")[:80],
        "content_intent": str(content_intent or "")[:40],
        "slot_id": str(slot_id or "")[:100],
        "mode": str(mode or "")[:40],
        "page_id": str(page_id or "")[:100],
        "message": str(message or "")[:10000],
        "link": str(link or "")[:2000],
        "image_path": str(image_path or "")[:1000],
        "campaign": str(campaign or "")[:100],
        "tracking_source": str(tracking_source or "")[:120],
        "metrics": [],
    }

    memory = _load_memory()
    posts = memory.setdefault("published_posts", [])
    existing = next((post for post in posts if post.get("post_id") == clean_id), None)
    if existing is None:
        posts.append(entry)
        memory["published_posts"] = posts[-500:]
        _save_memory(memory)
        return True

    changed = False
    for key, value in entry.items():
        if key == "metrics":
            continue
        if value and existing.get(key) != value:
            existing[key] = value
            changed = True
    existing.setdefault("metrics", [])
    if changed:
        _save_memory(memory)
    return changed


def record_post_metrics(
    *,
    post_id: str,
    measured_on: str,
    window: str,
    metrics: dict,
    source: str = "facebook_insights_manual",
    notes: str = "",
) -> bool:
    """Stores raw aggregate metrics; returns False for an identical repeated import."""
    clean_id = str(post_id or "").strip()
    if not clean_id:
        raise ValueError("metrics require a stable post_id")
    try:
        measured_date = date.fromisoformat(str(measured_on))
    except ValueError as exc:
        raise ValueError("metrics_as_of must be a date in YYYY-MM-DD format") from exc
    if measured_date > date.today():
        raise ValueError("metrics_as_of cannot be in the future")
    clean_window = str(window or "").strip().lower()
    if clean_window not in {"24h", "7d", "28d", "lifetime", "custom"}:
        raise ValueError("window must be 24h, 7d, 28d, lifetime, or custom")

    clean_metrics = {}
    for field in POST_METRIC_FIELDS:
        value = metrics.get(field)
        if value is None or value == "":
            clean_metrics[field] = None
            continue
        if isinstance(value, bool) or not isinstance(value, int) or value < 0:
            raise ValueError(f"{field} must be a non-negative integer or empty")
        clean_metrics[field] = value
    if all(value is None for value in clean_metrics.values()):
        raise ValueError("at least one raw metric must be provided")

    memory = _load_memory()
    post = next((item for item in memory.get("published_posts", []) if item.get("post_id") == clean_id), None)
    if post is None:
        raise ValueError(f"published post not found for post_id={clean_id}")

    snapshot = {
        "measured_on": str(measured_on)[:10],
        "window": clean_window,
        "source": str(source or "facebook_insights_manual")[:100],
        **clean_metrics,
        "notes": str(notes or "")[:1000],
    }
    snapshots = post.setdefault("metrics", [])
    existing = next((row for row in snapshots if row.get("measured_on") == snapshot["measured_on"] and row.get("window") == clean_window), None)
    if existing == snapshot:
        return False
    if existing is not None:
        existing.update(snapshot)
    else:
        snapshots.append(snapshot)
    post["metrics"] = snapshots[-100:]
    _save_memory(memory)
    return True


def get_performance_learning_context(platform: str | None = None) -> str:
    """Return cautious comparisons only after three measured posts in two comparable groups."""
    memory = _load_memory()
    today = date.today()
    latest: dict[tuple[str, str, str, str, str], dict] = {}
    for post in memory.get("published_posts", []):
        post_platform = str(post.get("platform") or "").lower()
        post_type = str(post.get("post_type") or "").strip()
        mode = str(post.get("mode") or "").strip().lower()
        post_id = str(post.get("post_id") or "")
        if not post_id or not post_type or (platform and post_platform != platform.lower()):
            continue
        try:
            if (today - date.fromisoformat(str(post.get("published_at", ""))[:10])).days > 180:
                continue
        except ValueError:
            continue
        for snapshot in post.get("metrics", []):
            try:
                if (today - date.fromisoformat(str(snapshot.get("measured_on", ""))[:10])).days > 180:
                    continue
            except ValueError:
                continue
            if snapshot.get("reach") is None or snapshot.get("reach", 0) <= 0:
                continue
            if any(snapshot.get(field) is None for field in INTERACTION_FIELDS):
                continue
            key = (post_platform, str(snapshot.get("window") or ""), mode, post_type, post_id)
            current = latest.get(key)
            if current is None or str(snapshot.get("measured_on", "")) > str(current.get("measured_on", "")):
                latest[key] = snapshot

    groups: dict[tuple[str, str, str, str], list[dict]] = {}
    for (post_platform, window, mode, post_type, _post_id), snapshot in latest.items():
        groups.setdefault((post_platform, window, mode, post_type), []).append(snapshot)

    eligible_by_comparison: dict[tuple[str, str, str], list[tuple[str, list[dict]]]] = {}
    for (post_platform, window, mode, post_type), snapshots in groups.items():
        if len(snapshots) >= 3:
            eligible_by_comparison.setdefault((post_platform, window, mode), []).append((post_type, snapshots))

    lines = []
    for (post_platform, window, mode), type_groups in eligible_by_comparison.items():
        if len(type_groups) < 2:
            continue
        lines.append(f"{post_platform} / {mode or 'nezadáno'} / okno {window}:")
        for post_type, snapshots in sorted(type_groups):
            interaction_rates = [
                sum(int(snapshot[field]) for field in INTERACTION_FIELDS) / int(snapshot["reach"])
                for snapshot in snapshots
            ]
            link_rates = [
                int(snapshot["link_clicks"]) / int(snapshot["reach"])
                for snapshot in snapshots if snapshot.get("link_clicks") is not None
            ]
            line = f"- {post_type}: n={len(snapshots)}, medián reakcí+komentářů+sdílení+uložení / reach {statistics.median(interaction_rates):.1%}"
            if len(link_rates) >= 3:
                line += f", medián prokliků / reach {statistics.median(link_rates):.1%}"
            lines.append(line)
    if not lines:
        return ""
    return (
        "Popisné výsledky srovnatelných zveřejněných příspěvků (nejméně 3 kusy na skupinu, "
        "stejná platforma, umístění a okno měření):\n"
        + "\n".join(lines)
        + "\nPoužij pouze jako slabý podklad pro nový test; malý nebo nesrovnatelný vzorek nic nedokazuje. "
        "Nekopíruj starší text a neoptimalizuj jen na reakce."
    )


def record_editorial_note(note: str, source: str = "manual"):
    """Uloží ruční redakční poznámku odděleně od metrik engagementu."""
    cleaned = str(note or "").strip()
    if not cleaned:
        return

    memory = _load_memory()
    notes = memory.setdefault("editorial_notes", [])
    notes.append({
        "date": date.today().isoformat(),
        "source": str(source or "manual")[:40],
        "note": cleaned[:1000],
    })
    memory["editorial_notes"] = notes[-100:]
    _save_memory(memory)
    log.info("Redakční poznámka uložena (%s)", source)


def get_learned_lessons() -> str:
    """Legacy compatibility shim; historical scores no longer steer generated copy."""
    return ""

def get_hook_ranking() -> dict[str, float]:
    """Legacy compatibility shim; an internal QA score cannot rank hook performance."""
    return {}


def get_learning_stats() -> dict:
    """Vrátí počty historických poznámek pro příkaz status."""
    memory = _load_memory()
    today = date.today()

    qg_log = memory.get("qg_issue_log", [])
    recent_qg = [e for e in qg_log if (today - date.fromisoformat(e["date"])).days <= 30]

    hook_scores = memory.get("hook_scores", {})
    hooks_with_data = {h: scores for h, scores in hook_scores.items() if len(scores) >= 2}

    eng_log = memory.get("engagement_log", [])
    recent_eng = [e for e in eng_log if (today - date.fromisoformat(e["rated_at"])).days <= 60]

    golden = memory.get("golden_templates", [])

    return {
        "qg_issues_tracked": len(recent_qg),
        "hooks_ranked": len(hooks_with_data),
        "engagement_ratings": len(recent_eng),
        "golden_templates": len(golden),
        "has_lessons": bool(get_learned_lessons()),
    }


# ══════════════════════════════════════════════════
# STARŠÍ ŠABLONY — ponecháno jen pro kompatibilitu existujících záznamů
# ══════════════════════════════════════════════════

def record_golden_template(post_type: str, caption: str, hook_formula: str, score: float):
    """Deprecated: an editorial QA score does not make a post a reusable template."""
    return


def get_golden_examples(post_type: str = None, limit: int = 3) -> str:
    """Legacy compatibility shim; old high-scoring copy is not injected as a template."""
    return ""

# CONTENT SERIES — mini-série postů
# ══════════════════════════════════════════════════

def start_series(name: str, theme: str, total_posts: int = 3, description: str = ""):
    """Zahájí novou mini-sérii (3-5 postů na jedno téma)."""
    memory = _load_memory()
    memory["active_series"] = {
        "name": name,
        "theme": theme,
        "description": description,
        "posts_planned": total_posts,
        "posts_done": 0,
        "start_date": date.today().isoformat(),
        "post_history": [],  # stručný přehled co již bylo
    }
    _save_memory(memory)
    log.info("Série zahájena: '%s' (%d postů)", name, total_posts)


def advance_series(post_summary: str):
    """Posune sérii o jeden post dopředu."""
    memory = _load_memory()
    series = memory.get("active_series")
    if not series:
        return

    series["posts_done"] += 1
    series["post_history"].append(post_summary[:100])

    if series["posts_done"] >= series["posts_planned"]:
        log.info("Série '%s' dokončena!", series["name"])
        memory["active_series"] = None
    else:
        log.info("Série '%s': %d/%d", series["name"], series["posts_done"], series["posts_planned"])

    _save_memory(memory)


def get_series_context() -> str:
    """Vrátí kontext aktivní série pro injekci do promptu."""
    memory = _load_memory()
    series = memory.get("active_series")
    if not series:
        return ""

    done = series["posts_done"]
    total = series["posts_planned"]
    history = "\n".join(f"  {i+1}. {p}" for i, p in enumerate(series.get("post_history", [])))

    return f"""
AKTIVNÍ MINI-SÉRIE: "{series['name']}" — post {done + 1} z {total}
Téma série: {series['theme']}
{('Popis: ' + series['description']) if series.get('description') else ''}
{'Předchozí posty v sérii:' + chr(10) + history if history else 'Toto je první post série.'}

Série může mít společnou linku, pokud to tématu pomáhá. Každý díl může fungovat samostatně;
neodkazuj na pořadí, včerejší vydání ani příští díl, pokud to není skutečnou součástí zadání.
"""


# ══════════════════════════════════════════════════
# WEEKLY COHESION — téma týdne
# ══════════════════════════════════════════════════

def set_weekly_theme(theme: str, description: str = ""):
    """Uloží dobrovolné téma týdne jako možnou inspiraci."""
    memory = _load_memory()
    # Začátek týdne = pondělí
    today = date.today()
    week_start = today - __import__("datetime").timedelta(days=today.weekday())

    memory["weekly_theme"] = {
        "theme": theme,
        "description": description,
        "week_start": week_start.isoformat(),
    }
    _save_memory(memory)
    log.info("Téma týdne nastaveno: '%s'", theme)


def get_weekly_theme_context() -> str:
    """Vrátí kontext tématu týdne pro injekci do promptu."""
    memory = _load_memory()
    wt = memory.get("weekly_theme")
    if not wt:
        return ""

    # Kontrola zda je stále aktuální (max 7 dní)
    today = date.today()
    try:
        start = date.fromisoformat(wt["week_start"])
        if (today - start).days > 7:
            return ""  # expirované
    except (ValueError, KeyError):
        return ""

    return f"""
MOŽNÉ TÉMA TÝDNE: "{wt['theme']}"
{('Popis: ' + wt['description']) if wt.get('description') else ''}
Použij ho jen tehdy, když přirozeně souvisí s aktuálním zadáním. Není to povinné téma,
metafora ani závěr a obsah kvůli němu neohýbej.
"""


# ══════════════════════════════════════════════════
# CTA a interakce se píší podle konkrétního příspěvku, ne z rotující knihovny.

def pick_cta(content_intent: str, post_type: str) -> str:
    """Zpětně kompatibilní rozhraní; CTA se do textu automaticky nevkládá."""
    return ""


def pick_engagement_booster(post_type: str, content_intent: str) -> str:
    """Zpětně kompatibilní rozhraní; interakce se nevkládá automaticky."""
    return ""
