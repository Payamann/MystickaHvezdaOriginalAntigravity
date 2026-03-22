"""
Content Memory — sleduje použité témata a typy postů,
aby agent nevygeneroval stejný obsah dvakrát.

Atomic writes: zápis probíhá do temp souboru a poté
se přejmenuje — chrání proti poškození při crashi.
"""
import json
import tempfile
import os
from pathlib import Path
from datetime import datetime, date
from typing import Optional
import sys
sys.path.insert(0, str(Path(__file__).parent.parent))
import config
from logger import get_logger

log = get_logger(__name__)

MEMORY_FILE = config.OUTPUT_DIR / "content_memory.json"


def _load_memory() -> dict:
    if not MEMORY_FILE.exists():
        return {
            "used_topics": [],
            "used_hooks": [],
            "used_post_types_last_7": [],
            "last_blog_promos": [],
            "total_posts": 0,
            "created_at": datetime.now().isoformat(),
        }
    try:
        with open(MEMORY_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError) as e:
        log.error("Poškozený content_memory.json, vytvářím nový: %s", e)
        return {
            "used_topics": [],
            "used_hooks": [],
            "used_post_types_last_7": [],
            "last_blog_promos": [],
            "total_posts": 0,
            "created_at": datetime.now().isoformat(),
        }


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
        # Atomický přesun — na stejném filesystému je to atomic operace
        os.replace(tmp_path, str(MEMORY_FILE))
        log.debug("Content memory uložena atomicky: %s", MEMORY_FILE)
    except Exception:
        # Pokud se něco pokazí, smaž temp soubor
        try:
            os.unlink(tmp_path)
        except OSError:
            pass
        raise


def record_post(topic: str, post_type: str, hook_formula: str = "", blog_slug: str = ""):
    """Zaznamená použitý post do paměti"""
    memory = _load_memory()

    entry = {
        "topic": topic,
        "post_type": post_type,
        "hook_formula": hook_formula,
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


def get_variety_context() -> dict:
    """
    Vrátí kontext pro prompt, aby se vyhnul opakování.
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

    # Hooky z posledních 21 dní
    recent_hooks = [
        e["formula"] for e in memory.get("used_hooks", [])
        if (today - date.fromisoformat(e["date"])).days <= 21
    ]

    # Naposledy propagované blogy
    recent_blogs = [
        e["slug"] for e in memory.get("last_blog_promos", [])
        if (today - date.fromisoformat(e["date"])).days <= 30
    ]

    has_any = recent_topics or recent_types or recent_hooks
    return {
        "recent_topics": list(set(recent_topics)),
        "recent_post_types": list(set(recent_types)),
        "recent_hooks": list(set(recent_hooks)),
        "recent_blog_slugs": recent_blogs,
        "total_posts": memory.get("total_posts", 0),
        "avoid_instruction": (
            f"VYHNI SE těmto tématům (použita v posl. 14 dnech): {', '.join(set(recent_topics)) or 'zatím žádná'}\n"
            f"VYHNI SE těmto typům postů (posl. 7 dní): {', '.join(set(recent_types)) or 'zatím žádné'}\n"
            f"VYHNI SE těmto hook formulím (posl. 21 dní): {', '.join(set(recent_hooks)) or 'zatím žádné'}"
        ) if has_any else ""
    }


def get_promoted_blog_slugs() -> list[str]:
    """Vrátí slugy blogů propagovaných za posledních 30 dní"""
    return get_variety_context()["recent_blog_slugs"]
