"""
Comment Bot — automatický agent pro odpovídání na Facebook komentáře

Režimy:
  --auto     Automaticky odpoví na všechny komentáře bez potvrzení
  --review   (výchozí) Zobrazí návrhy, po 30 min bez akce odpoví sám
  --dry-run  Jen zobrazí co by odpověděl, nic neposílá

Spuštění:
  python comment_bot.py              # review mode, jednorázově
  python comment_bot.py --auto       # auto mode, jednorázově
  python comment_bot.py --loop       # polling každých 15 min (pro Railway)
  python comment_bot.py --dry-run    # test bez odesílání
"""

import argparse
import sys
import time
import os
import random
import json
from datetime import datetime, date, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / ".env", override=True, encoding="utf-8")

import config
from comment_manager import (
    sync_comments,
    regenerate_replies,
    get_pending_comments,
    get_comments_to_hide,
    get_comment_thread_memory,
    claim_comment_for_reply,
    release_comment_claim,
    mark_comment_ignored,
    save_comment_reply_metadata,
    _reply_to_comment,
    hide_comment,
    get_stats,
)
from comment_cost import record_comment_reply_usage
from generators.text_generator import generate_comment_reply
from logger import get_logger
from reply_quality import build_quality_feedback, evaluate_reply_quality
from reply_strategy import ReplyStrategy, decide_reply_strategy
from reply_templates import render_template_reply

log = get_logger("comment_bot")

POLL_INTERVAL    = int(os.getenv("COMMENT_POLL_INTERVAL", "1200"))  # 20 min
AUTO_REPLY_DELAY = int(os.getenv("AUTO_REPLY_DELAY", "1800"))        # 30 min v review mode
REPLY_DELAY_MIN  = int(os.getenv("REPLY_DELAY_MIN", "180"))          # min. sekund mezi odpověďmi
REPLY_DELAY_MAX  = int(os.getenv("REPLY_DELAY_MAX", "420"))          # max. sekund mezi odpověďmi
DAILY_LIMIT      = int(os.getenv("DAILY_REPLY_LIMIT", "60"))         # max odpovědí za den
MAX_PER_USER_PER_RUN = int(os.getenv("MAX_REPLIES_PER_USER_PER_RUN", "0"))  # 0 = vypnuto; nové comment_id smí dostat odpověď

# Soubor pro sledování denního počtu odpovědí
_DAILY_COUNTER_FILE = Path(__file__).parent / "output" / "daily_reply_counter.json"


class MetaRateLimitStop(RuntimeError):
    """Raised when Meta signals a temporary block or rate limit."""


def _raise_if_meta_rate_limited(result: dict) -> None:
    if result.get("rate_limited"):
        details = result.get("error") or "Meta rate limit / temporary block"
        raise MetaRateLimitStop(str(details))


def _get_today_count() -> int:
    """Vrátí počet odpovědí odeslaných dnes."""
    if not _DAILY_COUNTER_FILE.exists():
        return 0
    try:
        data = json.loads(_DAILY_COUNTER_FILE.read_text(encoding="utf-8"))
        if data.get("date") == str(date.today()):
            return data.get("count", 0)
    except Exception:
        pass
    return 0


def _increment_today_count():
    """Zvýší denní počítač odpovědí o 1."""
    count = _get_today_count() + 1
    _DAILY_COUNTER_FILE.parent.mkdir(parents=True, exist_ok=True)
    _DAILY_COUNTER_FILE.write_text(
        json.dumps({"date": str(date.today()), "count": count}),
        encoding="utf-8",
    )
    return count


def _human_delay(mode: str):
    """Přidá náhodnou pauzu mezi odpověďmi — simuluje lidské chování."""
    if mode == "dry-run":
        return
    delay = random.uniform(REPLY_DELAY_MIN, REPLY_DELAY_MAX)
    log.debug("Čekám %.0fs před další odpovědí...", delay)
    time.sleep(delay)


# ══════════════════════════════════════════════════
# VÝPIS
# ══════════════════════════════════════════════════

def _sep():
    print("─" * 60)


def _print_comment(c: dict, idx: int):
    sentiment_emoji = {
        "question":  "❓",
        "positive":  "💚",
        "skeptical": "🤔",
        "neutral":   "💬",
        "off_topic": "↗️",
        "spam":      "🚫",
        "negative":  "⛔",
    }.get(c.get("sentiment", ""), "💬")

    print(f"\n[{idx}] {sentiment_emoji} {c['from_name']}  |  priorita: {c.get('priority', 0)}")
    print(f"     POST: {c.get('post_message', '')[:60]}...")
    print(f"     KOMENTÁŘ: {c['message']}")
    if c.get("suggested_reply"):
        print(f"     NÁVRH ODPOVĚDI: {c['suggested_reply']}")
    else:
        print(f"     (bez návrhu odpovědi)")


def _save_quality_result(
    comment: dict,
    reply: str,
    strategy: ReplyStrategy,
    quality,
    model_meta: dict | None = None,
    template_key: str | None = None,
) -> None:
    """Persist reply metadata and append one usage/cost event."""
    model_meta = model_meta or {}
    comment["suggested_reply"] = quality.cleaned_reply
    comment["reply_strategy"] = strategy.to_dict()
    comment["reply_quality"] = quality.to_dict()
    save_comment_reply_metadata(
        comment["id"],
        quality.cleaned_reply,
        strategy=strategy.to_dict(),
        quality=quality.to_dict(),
    )
    record_comment_reply_usage(
        comment_id=comment["id"],
        route=strategy.route,
        model=model_meta.get("model"),
        usage_events=model_meta.get("usage_events", []),
        quality_score=quality.score,
        final_chars=len(quality.cleaned_reply),
        template_key=template_key or strategy.template_key or None,
        regenerated=model_meta.get("regenerated", 0),
    )


def build_reply_for_comment(comment: dict, mode: str) -> str | None:
    """
    Decide the cheapest reply route, generate/render the reply, and run quality gate.
    Returns the cleaned reply or None when the comment should not be answered.
    """
    cid = comment["id"]
    thread_memory = get_comment_thread_memory(cid)
    strategy = decide_reply_strategy(comment, config.WEBSITE_URL, thread_memory)

    if strategy.route == "no_reply":
        if mode != "dry-run":
            mark_comment_ignored(cid, f"reply_strategy:{strategy.reason}")
        log.info("Komentář %s přeskakuji podle strategie: %s", cid, strategy.reason)
        return None

    recent_replies = thread_memory.get("recent_replies", [])

    force_regenerate = os.getenv("COMMENT_FORCE_REGENERATE_REPLY", "0").strip().lower() in {"1", "true", "yes"}

    if comment.get("suggested_reply") and not force_regenerate:
        quality = evaluate_reply_quality(
            comment["suggested_reply"],
            comment,
            strategy,
            config.WEBSITE_URL,
            recent_replies=recent_replies,
        )
        _save_quality_result(comment, quality.cleaned_reply, strategy, quality)
        if quality.publishable or mode == "review":
            return quality.cleaned_reply
        if mode != "dry-run":
            mark_comment_ignored(cid, "quality_gate_failed:" + ",".join(quality.issues))
        log.warning("Quality gate stopnul existující návrh %s: %s", cid, quality.issues)
        return None

    if strategy.route == "template":
        reply = render_template_reply(comment, strategy, thread_memory)
        quality = evaluate_reply_quality(
            reply,
            comment,
            strategy,
            config.WEBSITE_URL,
            recent_replies=recent_replies,
        )
        _save_quality_result(comment, reply, strategy, quality, template_key=strategy.template_key)
        if quality.publishable or mode == "review":
            return quality.cleaned_reply
        if mode != "dry-run":
            mark_comment_ignored(cid, "template_quality_failed:" + ",".join(quality.issues))
        log.warning("Template quality gate stopnul %s: %s", cid, quality.issues)
        return None

    max_regens = max(0, int(os.getenv("COMMENT_REPLY_MAX_REGENERATIONS", "1")))
    feedback = ""
    combined_usage: list[dict] = []
    model_name = None
    last_quality = None
    last_reply = ""
    regenerated = 0

    for attempt in range(max_regens + 1):
        result = generate_comment_reply(
            original_comment=comment["message"],
            post_topic=comment.get("post_message", "mystika"),
            tone=strategy.tone,
            post_context=strategy.brief,
            db_sentiment=comment.get("sentiment", ""),
            comment_id=cid,
            context_type=strategy.context_type,
            allowed_reply_url=strategy.allowed_url,
            tool_name=strategy.tool_name or "",
            model_tier=strategy.model_tier,
            max_tokens=strategy.max_tokens,
            quality_feedback=feedback,
            route=strategy.route,
            regenerated=attempt,
            return_metadata=True,
        )
        reply, meta = result
        last_reply = reply
        model_name = meta.get("model")
        combined_usage.extend(meta.get("usage_events", []))
        regenerated = attempt

        quality = evaluate_reply_quality(
            reply,
            comment,
            strategy,
            config.WEBSITE_URL,
            recent_replies=recent_replies,
        )
        last_quality = quality
        if quality.publishable:
            break
        feedback = build_quality_feedback(quality)
        if not feedback:
            break

    if last_quality is None:
        return None

    _save_quality_result(
        comment,
        last_reply,
        strategy,
        last_quality,
        model_meta={
            "model": model_name,
            "usage_events": combined_usage,
            "regenerated": regenerated,
        },
    )

    if last_quality.publishable or mode == "review":
        return last_quality.cleaned_reply

    if mode != "dry-run":
        mark_comment_ignored(cid, "quality_gate_failed:" + ",".join(last_quality.issues))
    log.warning("Quality gate stopnul AI odpověď %s: %s", cid, last_quality.issues)
    return None


# ══════════════════════════════════════════════════
# ZPRACOVÁNÍ JEDNOHO KOMENTÁŘE
# ══════════════════════════════════════════════════

def process_comment(comment: dict, mode: str) -> bool:
    """
    Zpracuje jeden komentář podle režimu.
    Vrací True pokud byla odeslána odpověď.
    """
    cid = comment["id"]
    reply = comment.get("suggested_reply")

    # Skryj spam/hate bez odpovědi
    if comment.get("should_hide"):
        if mode != "dry-run":
            result = hide_comment(cid, comment.get("platform", "facebook"))
            if result.get("success"):
                log.info("Skryto [%s]: %s", cid, comment["message"][:40])
            else:
                log.warning("Nepodařilo se skrýt [%s]: %s", cid, result.get("error"))
                _raise_if_meta_rate_limited(result)
        else:
            print(f"  [DRY-RUN] Skryji spam: {comment['message'][:40]}")
        return False

    # Bez návrhu odpovědi přeskoč
    if not reply:
        log.debug("Bez návrhu odpovědi, přeskakuji: %s", cid)
        return False

    if mode == "dry-run":
        print(f"  [DRY-RUN] Odpověděl bych: {reply[:80]}...")
        return False

    if mode == "auto":
        claim_token = comment.get("_claim_token") or claim_comment_for_reply(cid)
        if not claim_token:
            log.info("Komentář už je zpracovaný nebo zamčený, přeskakuji: %s", cid)
            return False
        _human_delay(mode)
        try:
            result = _reply_to_comment(cid, reply, claim_token=claim_token)
        except Exception as e:
            log.error("Nejistý stav při odpovídání %s: %s", cid, e, exc_info=True)
            return False
        if result["success"]:
            count = _increment_today_count()
            print(f"  ✅ Odpovězeno [{count}/{DAILY_LIMIT}] na [{comment['from_name']}]: {reply[:60]}...")
            log.info("Auto-odpověď odeslána: %s", cid)
            return True
        else:
            release_comment_claim(cid, claim_token, result.get("error", "reply failed"))
            print(f"  ❌ Chyba: {result.get('error')}")
            log.error("Chyba při odpovídání %s: %s", cid, result.get("error"))
            _raise_if_meta_rate_limited(result)
            return False

    if mode == "review":
        # Semi-auto: zobraz návrh, čekej na vstup nebo timeout
        print(f"\n  💬 {comment['from_name']}: {comment['message']}")
        print(f"  📝 Návrh: {reply}")
        print(f"  [Enter=odešli | s=přeskoč | e=uprav]  ", end="", flush=True)

        # Na Railway (non-interactive) — chovej se jako auto mode (s delay + counter)
        if not sys.stdin.isatty():
            print("(auto-odesílám — non-interactive)")
            claim_token = comment.get("_claim_token") or claim_comment_for_reply(cid)
            if not claim_token:
                log.info("Komentář už je zpracovaný nebo zamčený, přeskakuji: %s", cid)
                return False
            _human_delay("auto")
            try:
                result = _reply_to_comment(cid, reply, claim_token=claim_token)
            except Exception as e:
                log.error("Nejistý stav při odpovídání %s: %s", cid, e, exc_info=True)
                return False
            if result["success"]:
                _increment_today_count()
            else:
                release_comment_claim(cid, claim_token, result.get("error", "reply failed"))
                _raise_if_meta_rate_limited(result)
            return result["success"]

        try:
            import select
            rlist, _, _ = select.select([sys.stdin], [], [], 30)
            if rlist:
                choice = sys.stdin.readline().strip().lower()
            else:
                choice = ""   # timeout → odešli
        except (AttributeError, ImportError):
            # Windows nemá select pro stdin
            choice = input().strip().lower()

        if choice == "s":
            print("  ⏭ Přeskočeno")
            return False
        elif choice == "e":
            new_reply = input("  Nový text: ").strip()
            claim_token = comment.get("_claim_token") or claim_comment_for_reply(cid)
            if not claim_token:
                print("  ⏭ Komentář už je zpracovaný nebo zamčený")
                return False
            if new_reply:
                result = _reply_to_comment(cid, new_reply, claim_token=claim_token)
            else:
                result = _reply_to_comment(cid, reply, claim_token=claim_token)
        else:
            claim_token = comment.get("_claim_token") or claim_comment_for_reply(cid)
            if not claim_token:
                print("  ⏭ Komentář už je zpracovaný nebo zamčený")
                return False
            result = _reply_to_comment(cid, reply, claim_token=claim_token)

        if result["success"]:
            print(f"  ✅ Odesláno")
            return True
        else:
            release_comment_claim(cid, claim_token, result.get("error", "reply failed"))
            print(f"  ❌ Chyba: {result.get('error')}")
            _raise_if_meta_rate_limited(result)
            return False

    return False


# ══════════════════════════════════════════════════
# HLAVNÍ RUN
# ══════════════════════════════════════════════════

def run_once(mode: str, limit: int = 0, since_hours: int = None):
    """Jeden běh: sync → zpracuj → vypiš statistiky. limit=0 znamená bez omezení."""

    if not config.META_ACCESS_TOKEN:
        print("❌ META_ACCESS_TOKEN není nastaven v .env")
        sys.exit(1)

    print(f"\n{'='*60}")
    print(f"🤖 Comment Bot  |  {datetime.now().strftime('%Y-%m-%d %H:%M')}  |  mode: {mode}")
    print(f"{'='*60}")

    # 1. Synchronizuj komentáře
    print("\n📥 Synchronizuji komentáře...")
    try:
        if since_hours is not None:
            since = since_hours
        else:
            since = int(os.getenv("COMMENT_SYNC_SINCE_HOURS", "168"))
        stats = sync_comments(since_hours=since)
        print(
            f"   Staženo: {stats.get('fetched', 0)}  |  "
            f"Nové: {stats['added']}  |  Aktualizované: {stats.get('updated', 0)}  |  "
            f"Celkem v DB: {stats['total_in_db']}"
        )
    except Exception as e:
        print(f"❌ Sync selhal: {e}")
        log.error("Sync selhal: %s", e, exc_info=True)
        return

    # 2. Nejdřív moderuj spam/hate komentáře. Ty mají nízkou prioritu, ale nesmí zůstat viset.
    to_hide = get_comments_to_hide()
    if to_hide:
        print(f"\n🛡️ Komentářů ke skrytí: {len(to_hide)}")
        for comment in to_hide:
            try:
                process_comment(comment, mode)
            except MetaRateLimitStop as e:
                print(f"🛑 Meta vrátila rate limit / dočasný blok: {e}")
                log.warning("Zastavuji běh kvůli Meta rate limitu při moderaci: %s", e)
                return

    # 3. Načti nevyřízené, filtruj podle stáří komentáře a ořízni na limit
    pending = get_pending_comments(min_priority=3)

    # Filtruj jen komentáře z posledních since_hours hodin (ne celou historii DB)
    if since_hours is not None:
        # Porovnávej v UTC — FB timestamps jsou UTC, datetime.utcnow() taky UTC
        cutoff_utc = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(hours=since_hours)
        def _is_recent(c: dict) -> bool:
            try:
                ct_str = c.get("created_time", "")
                if not ct_str:
                    return False
                ct = datetime.fromisoformat(ct_str.replace("Z", "+00:00").replace("+0000", "+00:00"))
                ct_utc = ct.replace(tzinfo=None) if ct.tzinfo else ct  # strip tz → UTC naive
                return ct_utc >= cutoff_utc
            except Exception:
                return False
        before = len(pending)
        pending = [c for c in pending if _is_recent(c)]
        print(f"   Filtr {since_hours}h (UTC): {before} → {len(pending)} komentářů")

    if limit > 0:
        pending = pending[:limit]

    if not pending:
        print("\n✨ Žádné nevyřízené komentáře.")
        return

    # Zkontroluj denní limit
    today_count = _get_today_count()
    if today_count >= DAILY_LIMIT and mode != "dry-run":
        print(f"\n🛑 Denní limit {DAILY_LIMIT} odpovědí dosažen. Zítra pokračujeme.")
        return

    if mode != "dry-run":
        print(f"\n📊 Denní limit: {today_count}/{DAILY_LIMIT} odpovědí dnes")

    print(f"\n📋 Nevyřízených komentářů: {len(pending)}")
    _sep()

    # Max odpovědí na jeden post za jeden běh — zabraňuje spamu
    MAX_PER_POST = int(os.getenv("MAX_REPLIES_PER_POST", "3"))
    post_reply_counts: dict[str, int] = {}
    user_reply_counts: dict[str, int] = {}

    # 3. Generuj + pošli JEDNU odpověď najednou (generate → send → delay → generate → ...)
    replied = 0
    for idx, comment in enumerate(pending, 1):
        # Zastav při dosažení denního limitu
        if mode != "dry-run" and _get_today_count() >= DAILY_LIMIT:
            print(f"\n🛑 Denní limit {DAILY_LIMIT} dosažen, zastavuji.")
            break

        # Přeskoč pokud jsme na tomto postu už odpověděli MAX_PER_POST×
        post_id = comment.get("post_id", "")
        if post_id and mode != "dry-run":
            if post_reply_counts.get(post_id, 0) >= MAX_PER_POST:
                log.debug("Post %s: already %d replies this run, skipping", post_id, MAX_PER_POST)
                continue

        user_key = comment.get("from_id") or comment.get("from_name") or ""
        if user_key and MAX_PER_USER_PER_RUN > 0:
            if user_reply_counts.get(user_key, 0) >= MAX_PER_USER_PER_RUN:
                log.debug("User %s: already replied this run, skipping", user_key)
                continue

        # Strategii, šablonu/AI a quality gate řešíme těsně před odesláním.
        if not comment.get("needs_reply") or not comment.get("message", "").strip():
            continue
        preclaim_token = None
        if mode == "auto":
            preclaim_token = claim_comment_for_reply(comment["id"])
            if not preclaim_token:
                log.info("Komentář už je zpracovaný nebo zamčený, přeskakuji: %s", comment["id"])
                continue
            comment["_claim_token"] = preclaim_token
        try:
            reply = build_reply_for_comment(comment, mode)
            if not reply:
                if preclaim_token:
                    release_comment_claim(comment["id"], preclaim_token, "reply preparation skipped")
                continue
            comment["suggested_reply"] = reply
        except Exception as e:
            if preclaim_token:
                release_comment_claim(comment["id"], preclaim_token, str(e))
            log.warning("Nepodařilo se připravit odpověď: %s", e, exc_info=True)
            continue

        _print_comment(comment, idx)
        try:
            success = process_comment(comment, mode)
        except MetaRateLimitStop as e:
            print(f"🛑 Meta vrátila rate limit / dočasný blok: {e}")
            log.warning("Zastavuji běh kvůli Meta rate limitu při odpovídání: %s", e)
            break
        if success:
            replied += 1
            if post_id:
                post_reply_counts[post_id] = post_reply_counts.get(post_id, 0) + 1
            if user_key:
                user_reply_counts[user_key] = user_reply_counts.get(user_key, 0) + 1

    # 3. Statistiky
    _sep()
    db_stats = get_stats()
    print(f"\n📊 Statistiky: celkem {db_stats['total']} | čekajících {db_stats['pending']} | odpovězeno dnes: {replied}")
    print(f"   Sentimenty: {db_stats['by_sentiment']}")


def run_loop(mode: str):
    """Polling smyčka pro Railway"""
    print(f"🔁 Spouštím polling loop (každých {POLL_INTERVAL}s)")
    while True:
        try:
            run_once(mode)
        except KeyboardInterrupt:
            print("\n👋 Ukončuji...")
            break
        except Exception as e:
            log.error("Neočekávaná chyba v smyčce: %s", e, exc_info=True)
            print(f"⚠️ Chyba: {e} — čekám {POLL_INTERVAL}s")
        print(f"\n⏳ Čekám {POLL_INTERVAL}s do dalšího běhu...")
        time.sleep(POLL_INTERVAL)


# ══════════════════════════════════════════════════
# CLI
# ══════════════════════════════════════════════════

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Mystická Hvězda Comment Bot")
    parser.add_argument("--auto",    action="store_true", help="Automaticky odpoví bez potvrzení")
    parser.add_argument("--dry-run", action="store_true", help="Jen zobrazí, nic neposílá")
    parser.add_argument("--loop",    action="store_true", help="Polling smyčka (pro Railway)")
    parser.add_argument("--stats",   action="store_true", help="Zobrazí statistiky a skončí")
    parser.add_argument("--regen",   action="store_true", help="Přegeneruje odpovědi novou logikou")
    parser.add_argument("--limit",   type=int, default=0, help="Max počet komentářů ke zpracování")
    parser.add_argument("--since",   type=int, default=0, help="Načti komentáře z posledních N hodin (0 = výchozí)")
    args = parser.parse_args()

    if args.stats:
        s = get_stats()
        print(f"\n📊 Comment Bot statistiky")
        print(f"   Celkem v DB:  {s['total']}")
        print(f"   Čekajících:   {s['pending']}")
        print(f"   Poslední sync: {s['last_fetch']}")
        print(f"   Podle statusu: {s['by_status']}")
        print(f"   Podle sentimentu: {s['by_sentiment']}")
        sys.exit(0)

    if args.regen:
        print("Přegenerovávám odpovědi novou logikou...")
        n = regenerate_replies()
        print(f"Hotovo — přegenerováno {n} odpovědí.")
        sys.exit(0)

    mode = "dry-run" if args.dry_run else ("auto" if args.auto else "review")

    if args.loop:
        run_loop(mode)
    else:
        run_once(mode, limit=args.limit, since_hours=args.since if args.since > 0 else None)
