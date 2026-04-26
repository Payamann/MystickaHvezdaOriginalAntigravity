"""
Comment Manager — správa komentářů na Facebooku a Instagramu

Funkce:
  - Načtení nových komentářů z Meta Graph API
  - Detekce tónu a typu komentáře (AI)
  - Generování odpovědí (Gemini)
  - Označení komentářů jako vyřízených
  - Lokální databáze komentářů (JSON)
  - Ochrana před spamem a negativními komentáři

Stav: Plně připraveno — aktivuje se po zadání META_ACCESS_TOKEN
"""
import json
import os
import re
import tempfile
import uuid
import requests
from pathlib import Path
from datetime import datetime, date, timedelta
from typing import Optional
import sys

sys.path.insert(0, str(Path(__file__).parent))
import config
from generators.text_generator import generate_comment_reply
from logger import get_logger

log = get_logger(__name__)

# Z centrální konfigurace
GRAPH_API_URL = config.GRAPH_API_URL

# Lokální databáze komentářů
COMMENTS_DB_PATH = config.OUTPUT_DIR / "comments_db.json"

META_RATE_LIMIT_CODES = {4, 17, 32, 613, 80004}
META_RATE_LIMIT_MARKERS = (
    "rate limit",
    "too many",
    "too fast",
    "temporarily blocked",
    "try again later",
    "reduce the amount",
)


def _meta_api_result(resp: requests.Response, result: dict) -> dict:
    """Normalize Meta API errors and flag rate-limit/temporary-block responses."""
    error = result.get("error", {}) if isinstance(result, dict) else {}
    message = error.get("message", str(result))
    code = error.get("code")
    subcode = error.get("error_subcode")
    lower_message = str(message).lower()
    rate_limited = (
        resp.status_code == 429
        or code in META_RATE_LIMIT_CODES
        or any(marker in lower_message for marker in META_RATE_LIMIT_MARKERS)
    )
    return {
        "success": False,
        "error": message,
        "error_code": code,
        "error_subcode": subcode,
        "http_status": resp.status_code,
        "rate_limited": rate_limited,
    }


def _is_own_comment(comment: dict) -> bool:
    """True for comments authored by our own page/account."""
    from_id = str(comment.get("from_id", "") or "")
    from_name = str(comment.get("from_name", "") or "")
    page_id = str(getattr(config, "META_PAGE_ID", "") or "")
    return bool(page_id and from_id == page_id) or from_name.casefold() == config.BRAND_NAME.casefold()


def _build_comment_record(
    comment: dict,
    post_id: str,
    post_message: str,
    parent_id: str | None = None,
    thread_id: str | None = None,
) -> dict:
    """Normalize a Meta comment/reply object into our local DB shape."""
    cid = comment["id"]
    return {
        "id": cid,
        "platform": "facebook",
        "post_id": post_id,
        "parent_id": parent_id,
        "thread_id": thread_id or parent_id or cid,
        "post_message": post_message,
        "from_name": comment.get("from", {}).get("name", "Anonymní"),
        "from_id": comment.get("from", {}).get("id", ""),
        "message": comment.get("message", ""),
        "created_time": comment.get("created_time", ""),
        "fetched_at": datetime.now().isoformat(),
        "status": "new",           # new | processing | replied | hidden | ignored
        "suggested_reply": None,
        "actual_reply": None,
        "sentiment": None,         # positive | neutral | negative | spam
        "reply_id": None,
    }


def _fetch_facebook_replies(
    comment_id: str,
    post_id: str,
    post_message: str,
    thread_id: str,
    depth: int = 0,
    max_depth: int = 2,
) -> list[dict]:
    """Fetch replies below one Facebook comment so follow-up comments get their own reply."""
    if depth >= max_depth:
        return []

    replies = []
    url = f"{GRAPH_API_URL}/{comment_id}/comments"
    params = {
        "access_token": config.META_ACCESS_TOKEN,
        "fields": "id,from,message,created_time,can_reply_privately",
        "limit": int(os.getenv("COMMENT_SYNC_REPLY_LIMIT", "25")),
        "filter": "stream",
    }

    while url:
        try:
            resp = requests.get(url, params=params, timeout=config.HTTP_TIMEOUT)
        except requests.RequestException as e:
            log.warning("Facebook replies fetch timeout/error for %s: %s", comment_id, e)
            break
        if resp.status_code != 200:
            break

        data = resp.json()
        for reply in data.get("data", []):
            record = _build_comment_record(
                reply,
                post_id=post_id,
                post_message=post_message,
                parent_id=comment_id,
                thread_id=thread_id,
            )
            replies.append(record)
            replies.extend(_fetch_facebook_replies(
                comment_id=reply["id"],
                post_id=post_id,
                post_message=post_message,
                thread_id=thread_id,
                depth=depth + 1,
                max_depth=max_depth,
            ))

        url = data.get("paging", {}).get("next")
        params = {}

    return replies


# ══════════════════════════════════════════════════
# DATABÁZE KOMENTÁŘŮ (lokální JSON)
# ══════════════════════════════════════════════════

def _load_db() -> dict:
    if not COMMENTS_DB_PATH.exists():
        return {
            "comments": {},     # comment_id → comment record
            "last_fetch": None,
            "stats": {
                "total_fetched": 0,
                "total_replied": 0,
                "total_hidden": 0,
            }
        }
    config.OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    with open(COMMENTS_DB_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)


def _save_db(db: dict):
    """Atomický zápis DB — zapisuje do temp souboru, pak přejmenuje."""
    config.OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    fd, tmp_path = tempfile.mkstemp(
        suffix=".tmp",
        prefix="comments_db_",
        dir=str(config.OUTPUT_DIR),
    )
    try:
        with os.fdopen(fd, 'w', encoding='utf-8') as f:
            json.dump(db, f, ensure_ascii=False, indent=2)
        os.replace(tmp_path, str(COMMENTS_DB_PATH))
        log.debug("Comments DB uložena atomicky")
    except Exception:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass
        raise


# ══════════════════════════════════════════════════
# META API — NAČTENÍ KOMENTÁŘŮ
# ══════════════════════════════════════════════════

def fetch_facebook_comments(
    limit_per_post: int = 100,
    since_hours: int = 168,
) -> list[dict]:
    """
    Načte komentáře ze všech postů na Facebook stránce
    z posledních X hodin.

    Returns:
        list komentářů se strukturou:
        {id, post_id, post_message, from_name, message, created_time, platform}
    """
    if not config.META_ACCESS_TOKEN or not config.META_PAGE_ID:
        raise ValueError("META_ACCESS_TOKEN a META_PAGE_ID musí být nastaveny v .env")

    token = config.META_ACCESS_TOKEN
    page_id = config.META_PAGE_ID
    comments = []
    limit_per_post = int(os.getenv("COMMENT_SYNC_LIMIT_PER_POST", str(limit_per_post)))
    fetch_replies = os.getenv("COMMENT_SYNC_FETCH_REPLIES", "1").strip().lower() not in {"0", "false", "no"}

    # Krok 1: Načti poslední posty. Neomezujeme je podle stáří postu, protože
    # nový komentář může přijít i pod starší příspěvek.
    since_ts = int((datetime.now() - timedelta(hours=since_hours)).timestamp())
    post_limit = int(os.getenv("COMMENT_SYNC_POST_LIMIT", "50"))
    posts_url = f"{GRAPH_API_URL}/{page_id}/posts"
    posts_resp = requests.get(posts_url, params={
        "access_token": token,
        "fields": "id,message,created_time",
        "limit": post_limit,
    }, timeout=config.HTTP_TIMEOUT)

    if posts_resp.status_code != 200:
        raise Exception(f"Chyba načítání postů: {posts_resp.text}")

    posts = posts_resp.json().get("data", [])

    # Krok 2: Pro každý post načti komentáře
    for post in posts:
        post_id = post["id"]
        post_message = post.get("message", "")[:100]

        comments_url = f"{GRAPH_API_URL}/{post_id}/comments"
        params = {
            "access_token": token,
            "fields": "id,from,message,created_time,can_reply_privately",
            "limit": limit_per_post,
            "filter": "stream",
            "since": since_ts,  # jen komentáře z daného okna, ne celá historie
        }
        page_comments = []
        while comments_url:
            try:
                comments_resp = requests.get(comments_url, params=params, timeout=config.HTTP_TIMEOUT)
            except requests.RequestException as e:
                log.warning("Facebook comments fetch timeout/error for post %s: %s", post_id, e)
                comments_resp = None
                break
            if comments_resp.status_code != 200:
                log.warning("Facebook comments fetch failed for post %s: %s", post_id, comments_resp.text[:300])
                break
            data = comments_resp.json()
            page_comments.extend(data.get("data", []))
            comments_url = data.get("paging", {}).get("next")
            params = {}  # next URL already contains all params

        if comments_resp is None or comments_resp.status_code != 200:
            continue

        for comment in page_comments:
            record = _build_comment_record(
                comment,
                post_id=post_id,
                post_message=post_message,
                thread_id=comment["id"],
            )
            comments.append(record)
            if fetch_replies:
                comments.extend(_fetch_facebook_replies(
                    comment_id=comment["id"],
                    post_id=post_id,
                    post_message=post_message,
                    thread_id=comment["id"],
                ))

    return comments


def fetch_instagram_comments(
    limit_per_post: int = 25,
    since_hours: int = 48,
) -> list[dict]:
    """
    Načte komentáře z Instagram Business účtu
    z posledních X hodin.
    """
    if not config.META_ACCESS_TOKEN or not config.INSTAGRAM_ACCOUNT_ID:
        raise ValueError("META_ACCESS_TOKEN a INSTAGRAM_ACCOUNT_ID musí být nastaveny v .env")

    token = config.META_ACCESS_TOKEN
    ig_id = config.INSTAGRAM_ACCOUNT_ID
    comments = []

    # Načti nedávná media
    since_ts = int((datetime.now() - timedelta(hours=since_hours)).timestamp())
    media_url = f"{GRAPH_API_URL}/{ig_id}/media"
    media_resp = requests.get(media_url, params={
        "access_token": token,
        "fields": "id,caption,timestamp",
        "limit": 20,
    }, timeout=config.HTTP_TIMEOUT)

    if media_resp.status_code != 200:
        raise Exception(f"Chyba načítání IG médií: {media_resp.text}")

    for media in media_resp.json().get("data", []):
        media_id = media["id"]
        post_caption = media.get("caption", "")[:100]

        # Zkontroluj timestamp
        ts_str = media.get("timestamp", "")
        if ts_str:
            try:
                post_ts = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
                if (datetime.now().astimezone() - post_ts).total_seconds() > since_hours * 3600:
                    continue
            except (ValueError, TypeError):
                pass

        # Načti komentáře k tomuto médiu
        comm_url = f"{GRAPH_API_URL}/{media_id}/comments"
        comm_resp = requests.get(comm_url, params={
            "access_token": token,
            "fields": "id,username,text,timestamp,replies{id,username,text,timestamp}",
            "limit": limit_per_post,
        }, timeout=config.HTTP_TIMEOUT)

        if comm_resp.status_code != 200:
            continue

        for comment in comm_resp.json().get("data", []):
            comments.append({
                "id": comment["id"],
                "platform": "instagram",
                "post_id": media_id,
                "post_message": post_caption,
                "from_name": comment.get("username", ""),
                "from_id": comment.get("username", ""),
                "message": comment.get("text", ""),
                "created_time": comment.get("timestamp", ""),
                "fetched_at": datetime.now().isoformat(),
                "status": "new",
                "suggested_reply": None,
                "actual_reply": None,
                "sentiment": None,
                "reply_id": None,
            })

    return comments


def fetch_all_comments(since_hours: int = 48) -> list[dict]:
    """
    Načte komentáře ze všech dostupných platforem.
    Přeskočí platformy kde chybí credentials.
    """
    all_comments = []
    errors = []

    if config.META_ACCESS_TOKEN and config.META_PAGE_ID:
        try:
            fb_comments = fetch_facebook_comments(since_hours=since_hours)
            all_comments.extend(fb_comments)
            log.info("Facebook: %d nových komentářů", len(fb_comments))
        except Exception as e:
            errors.append(f"Facebook: {e}")

    # Instagram API v2.4+ má deprecated endpoint — dočasně vypnuto
    # if config.META_ACCESS_TOKEN and config.INSTAGRAM_ACCOUNT_ID:
    #     ig_comments = fetch_instagram_comments(since_hours=since_hours)

    if errors:
        for e in errors:
            log.warning("%s", e)

    return all_comments


# ══════════════════════════════════════════════════
# ANALÝZA SENTIMENTU & PRIORITIZACE
# ══════════════════════════════════════════════════

def analyze_comment_sentiment(message: str) -> dict:
    """
    Keyword-based analýza sentimentu + off-topic detekce.
    Dostatečně přesná pro třídění bez nutnosti API volání.

    Returns:
        dict: sentiment, priority, needs_reply, should_hide, is_off_topic
    """
    text = message.lower()

    # ── ON-TOPIC klíčová slova (oblast Mystické Hvězdy) ──
    ON_TOPIC_SIGNALS = [
        # Astrologie
        "znamení", "znameni", "horoskop", "planeta", "saturn", "jupiter",
        "merkur", "venuše", "venuse", "mars", "neptun", "uran", "pluto",
        "ascendent", "beran", "býk", "byk", "blíženci", "blizenci",
        "rak", "lev", "panna", "váhy", "vahy", "štír", "stir",
        "střelec", "strelec", "kozoroh", "vodnář", "vodnar", "ryby",
        "retrográd", "retrograd", "tranzit",
        # Tarot
        "tarot", "karta", "karty", "výklad", "vyklad", "arkána", "arkana",
        # Krystaly a kameny
        "krystal", "kámen", "kamen", "ametyst", "růženín", "ruzenin",
        "obsidián", "obsidian", "citrín", "citrin", "turmalín", "turmalin",
        "minerál", "mineral",
        # Numerologie
        "numerolog", "číslo", "cislo", "životní cesta", "zivotni cesta",
        # Rituály a meditace
        "rituál", "ritual", "meditac", "mantra", "vizualizac", "svíčk",
        "svick", "kadidl", "očist", "ocist", "afirmac",
        # Energie a duchovní růst
        "energi", "čakr", "cakr", "aura", "duchovn", "spirituál",
        "spiritual", "intuic", "vesmír", "vesmir", "manifest",
        # Měsíc a cykly
        "měsíc", "mesic", "luná", "luna", "úplněk", "uplnek",
        "novoluní", "novoluni", "dorůstaj", "dorustaj", "couvaj",
        # Bylinky v mystice
        "bylinka", "byliny", "šalvěj", "salvej", "levandule",
        # Web
        "mystická hvězda", "mysticka hvezda", "mystickahvezda", "článek", "clanek",
        "blog", "stránk", "strank", "web",
    ]

    # ── OFF-TOPIC signály (témata mimo naši oblast) ──
    OFF_TOPIC_SIGNALS = [
        # Vaření a jídlo
        "recept", "polévk", "polevk", "polívk", "polivk", "vaření", "vareni",
        "pečení", "peceni", "jídlo", "jidlo", "oběd", "obed", "večeře", "vecere",
        "snídaně", "snidane", "koření", "koreni", "těsto", "testo", "mouka",
        "cukr", "máslo", "maslo", "ingredien",
        # Sport
        "fotbal", "hokej", "hokejov", "tenis", "liga", "zápas", "zapas", "góly", "goly",
        "olympi", "mistrovství", "mistrovstvi",
        # Politika
        "politik", "vláda", "vlada", "volby", "volit", "voleb", "strana", "prezident",
        "parlament", "senát", "senat", "zákon", "zakon",
        # Finance / investice
        "akcie", "investic", "investov", "bitcoin", "krypto", "burza", "půjčk", "pujck",
        "hypotéka", "hypoteka", "úrok", "urok",
        # Technologie (nesouvisející)
        "programov", "softwar", "iphone", "android", "počítač", "pocitac",
        "windows", "linux",
        # Medicínské rady
        "doktor", "nemoc", "lék", "lek", "bolest", "diagnóz", "diagnoz",
        "operac", "nemocnic", "antibiotik", "očkován", "ockovani",
    ]

    # Spam / negativní / skrýt
    SPAM_SIGNALS = [
        "follow back", "check my", "dm me", "link in bio", "crypto",
        "earn money", "bitcoin", "forex", "click here", "free gift",
        "❤️❤️❤️❤️❤️",  # spam emoji floods
    ]
    SEVERE_HIDE_SIGNALS = [
        "chcíp", "chcip", "zabij", "drž hubu", "drz hubu",
        "vyhrož", "vyhroz", "nahlásím vás", "nahlasim vas",
    ]
    RUDE_SIGNALS = [
        "blbost", "kraviny", "kravina", "hovadina", "debilní", "debilni",
        "debilové", "debilove", "idioti", "hlupáci", "hlupaci",
        "šarlatán", "sarlatán", "sarlatan", "podvod",
        "nesmysl", "fake", "scam", "lhář", "lhar", "lžete", "lzete",
        "trapné", "trapne", "bullshit",
    ]
    NEGATIVE_SIGNALS = [
        "nevím", "nevim", "pochybuji", "nefunguje", "nesmysl",
        "nevěřím", "neverim", "pochybuju", "nefunguji",
        "škoda", "skoda", "zklamání", "zklamani", "špatně", "spatne",
        "nedava smysl", "nedává smysl",
    ]
    POSITIVE_SIGNALS = [
        "díky", "dekuji", "děkuji", "diky", "super", "skvělé", "skvele",
        "nádherné", "nadherné", "úžasné", "uzasne", "krásné", "krasne",
        "přesně", "presne", "pravda", "souhlasím", "souhlasim",
        "miluju", "miluji", "❤", "💜", "🙏", "moc pěkné", "moc pekne",
    ]
    QUESTION_SIGNALS = [
        "?", "jak", "proc", "proč", "co znamená", "co znamena",
        "muzete", "můžeš", "mohla", "pomoc", "porad", "poraď",
        "nevite", "nevíte", "jak se", "co to",
    ]

    # Emocionální výpovědi — lidi co se svěřují se STAVEM, ne ptají
    EMOTIONAL_STATE_SIGNALS = [
        "cítím se", "citim se", "cítím", "jsem unavená", "jsem unavený",
        "jsem smutná", "jsem smutný", "jsem vyčerpaná", "je mi smutno",
        "mám se špatně", "mam se spatne", "mám se blbě", "mam se blbe",
        "je mi špatně", "je mi spatne", "je mi blbě", "je mi blbe",
        "trápím se", "trapim se",
        "je mi těžko", "je mi tezko", "cítím únavu", "mám špatnou náladu",
        "jsem v depresi", "cítím bolest", "nejsem dobře", "nejsem v pořádku",
        "chybí mi", "chybi mi", "nemám nikoho", "nemam nikoho",
        "nevím co dál", "nevim co dal", "už nemůžu", "uz nemuzu",
        "nemůžu dál", "nemuzu dal", "nezvládám", "nezvladam",
        "jsem ztracená", "jsem ztraceny", "jsem ztracený", "jsem ztraceny",
        "brečím", "brecim", "rozchod", "samota", "osaměl", "osamel",
        "som unavená", "som smutná",  # slovenština
        "jsem tady :(", "tady :(",    # "jsem tady" bez kontextu = signál osamělosti
    ]
    CRISIS_SIGNALS = [
        "nechci žít", "nechci zit", "chci umřít", "chci umrit",
        "zabiju se", "ublížit si", "ublizit si", "si ublížit", "si ublizit", "ukončit život", "ukoncit zivot",
        "nemá cenu žít", "nema cenu zit",
    ]

    # ── Klasifikace ──

    # 1. Spam — vždy skrýt
    if any(s in text for s in SPAM_SIGNALS):
        return {"sentiment": "spam", "priority": 0, "needs_reply": False, "should_hide": True, "is_off_topic": True}

    # 2. Výhrůžky / extrémní útok — skrýt
    if any(s in text for s in SEVERE_HIDE_SIGNALS):
        return {"sentiment": "negative", "priority": 1, "needs_reply": False, "should_hide": True, "is_off_topic": False}

    # 3. Off-topic detekce — kontrola zda komentář NENÍ o mystice
    is_on_topic = any(s in text for s in ON_TOPIC_SIGNALS)
    is_off_topic = any(s in text for s in OFF_TOPIC_SIGNALS) and not is_on_topic

    # 4. Krize / sebezraňování — odpovědět podpůrně, bez mystiky a bez promo
    if any(s in text for s in CRISIS_SIGNALS):
        return {"sentiment": "crisis", "priority": 10, "needs_reply": True, "should_hide": False, "is_off_topic": False}

    # 5. Hrubá nebo dehonestující zpráva — neskrývat automaticky, odpovědět klidně
    if any(s in text for s in RUDE_SIGNALS):
        return {"sentiment": "rude", "priority": 6, "needs_reply": True, "should_hide": False, "is_off_topic": is_off_topic}

    # 6. Nízkosignálové reakce — lajknout ručně, ale neplnit vlákno botími odpověďmi
    plain = re.sub(r"[^\w\sáčďéěíňóřšťúůýž]", " ", text, flags=re.IGNORECASE)
    words = [w for w in plain.split() if w]
    compact = " ".join(words)
    low_signal_reactions = {
        "ok", "oki", "ano", "jo", "jj", "ne", "hm", "hmm",
        "super", "top", "krásné", "krasne", "hezké", "hezke",
        "zajímavé", "zajimave", "pravda", "souhlas", "přesně", "presne",
        "díky", "diky", "děkuji", "dekuji",
    }
    if not is_on_topic and "?" not in text and len(words) <= 3 and compact in low_signal_reactions:
        return {"sentiment": "low_signal", "priority": 1, "needs_reply": False, "should_hide": False, "is_off_topic": False}

    # 7. Emocionální výpověď — priorita před "otázkou" (obsahuje "jak se" ale je to vyznání)
    #    Podmínka: >20 znaků nebo explicitní emocionální fraze
    has_emotional_signal = any(s in text for s in EMOTIONAL_STATE_SIGNALS)
    if has_emotional_signal and not is_off_topic:
        # Delší emocionální komentáře jsou zlatý obsah — vysoká priorita
        priority = 9 if len(message) > 40 else 7
        return {"sentiment": "emotional", "priority": priority, "needs_reply": True, "should_hide": False, "is_off_topic": False}

    # 8. Otázka (ale ne pokud je to jen "jak se cítíš" — to je emocionální)
    if any(s in text for s in QUESTION_SIGNALS):
        if is_off_topic:
            return {"sentiment": "off_topic", "priority": 2, "needs_reply": True, "should_hide": False, "is_off_topic": True}
        return {"sentiment": "question", "priority": 10, "needs_reply": True, "should_hide": False, "is_off_topic": False}

    # 9. Skeptik
    if any(s in text for s in NEGATIVE_SIGNALS):
        return {"sentiment": "skeptical", "priority": 7, "needs_reply": True, "should_hide": False, "is_off_topic": is_off_topic}

    # 10. Pochvala
    if any(s in text for s in POSITIVE_SIGNALS):
        return {"sentiment": "positive", "priority": 5, "needs_reply": True, "should_hide": False, "is_off_topic": False}

    # 11. Off-topic bez otázky — nízká priorita
    if is_off_topic:
        return {"sentiment": "off_topic", "priority": 1, "needs_reply": False, "should_hide": False, "is_off_topic": True}

    return {"sentiment": "neutral", "priority": 3, "needs_reply": True, "should_hide": False, "is_off_topic": False}


def _normalize_message_for_dedupe(message: str) -> str:
    """Normalize public comment text so repeated short reactions collapse."""
    text = message.strip().lower()
    text = re.sub(r"[^\w\sáčďéěíňóřšťúůýž]", " ", text, flags=re.IGNORECASE)
    return " ".join(text.split())


def _parse_meta_time(value: str) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00").replace("+0000", "+00:00")).replace(tzinfo=None)
    except (ValueError, TypeError):
        return None


def _has_recent_reply_to_user(comment: dict, all_comments: dict, cooldown_hours: int) -> bool:
    """True if the same user already received a reply during the cooldown window."""
    if cooldown_hours <= 0:
        return False

    user_key = comment.get("from_id") or comment.get("from_name")
    if not user_key:
        return False

    cutoff = datetime.now() - timedelta(hours=cooldown_hours)
    platform = comment.get("platform")
    for other_id, other in all_comments.items():
        if other_id == comment.get("id"):
            continue
        if other.get("status") != "replied":
            continue
        other_key = other.get("from_id") or other.get("from_name")
        if other_key != user_key or other.get("platform") != platform:
            continue
        replied_at = _parse_meta_time(other.get("replied_at", ""))
        if replied_at and replied_at >= cutoff:
            return True
    return False


def claim_comment_for_reply(comment_id: str) -> str | None:
    """
    Reserve one exact comment before generation/sending.

    This prevents multiple bot runs from sending several replies to the same
    comment ID. A later user reply has a different comment ID, so it can still
    receive its own answer.
    """
    db = _load_db()
    comment = db["comments"].get(comment_id)
    if not comment:
        return None
    if comment.get("status") not in ("new", None):
        return None
    if comment.get("should_hide", False) or not comment.get("needs_reply", False):
        return None
    if _is_own_comment(comment):
        return None

    token = uuid.uuid4().hex
    comment["status"] = "processing"
    comment["processing_started_at"] = datetime.now().isoformat()
    comment["processing_token"] = token
    db["comments"][comment_id] = comment
    _save_db(db)
    return token


def release_comment_claim(comment_id: str, claim_token: str, error: str = "") -> None:
    """Release a processing claim when generation/API fails before a reply is sent."""
    db = _load_db()
    comment = db["comments"].get(comment_id)
    if not comment:
        return
    if comment.get("status") != "processing" or comment.get("processing_token") != claim_token:
        return

    comment["status"] = "new"
    comment.pop("processing_token", None)
    comment.pop("processing_started_at", None)
    if error:
        comment["last_processing_error"] = error
    db["comments"][comment_id] = comment
    _save_db(db)


def _merge_fetched_comment(existing: dict, fetched: dict) -> tuple[dict, bool]:
    """
    Upsert fresh Meta fields while preserving local reply/moderation state.

    Returns:
        (merged_comment, message_changed)
    """
    old_message_key = _normalize_message_for_dedupe(existing.get("message", ""))
    new_message_key = _normalize_message_for_dedupe(fetched.get("message", ""))
    message_changed = old_message_key != new_message_key

    merged = dict(existing)
    for key in (
        "id",
        "platform",
        "post_id",
        "parent_id",
        "thread_id",
        "post_message",
        "from_name",
        "from_id",
        "message",
        "created_time",
    ):
        if key in fetched:
            merged[key] = fetched.get(key)

    merged["fetched_at"] = datetime.now().isoformat()
    merged.setdefault("suggested_reply", existing.get("suggested_reply"))
    merged.setdefault("actual_reply", existing.get("actual_reply"))
    merged.setdefault("reply_id", existing.get("reply_id"))
    merged.setdefault("status", existing.get("status", "new"))
    return merged, message_changed


def _clear_stale_reply_metadata(comment: dict) -> None:
    """Remove generated reply metadata after an unreplied comment text changes."""
    for key in (
        "suggested_reply",
        "reply_strategy",
        "reply_quality",
        "reply_quality_score",
        "reply_quality_issues",
        "reply_cta_type",
        "reply_url_count",
        "reply_generated_at",
        "reply_route",
        "reply_context_type",
        "reply_allowed_url",
        "reply_template_key",
    ):
        comment.pop(key, None)
    comment["suggested_reply"] = None


# ══════════════════════════════════════════════════
# SYNCHRONIZACE A ULOŽENÍ
# ══════════════════════════════════════════════════

def regenerate_replies() -> int:
    """
    Přegeneruje odpovědi pro všechny nevyřízené komentáře v DB.
    Použij po změně reply logiky.
    """
    db = _load_db()
    count = 0
    for cid, comment in db["comments"].items():
        if comment.get("status") not in ("new", None):
            continue
        if not comment.get("needs_reply"):
            continue
        if not comment.get("message", "").strip():
            continue
        try:
            tone_map = {"question": "educational", "positive": "friendly",
                        "skeptical": "empathetic", "neutral": "friendly", "off_topic": "friendly",
                        "emotional": "empathetic", "crisis": "empathetic", "rude": "calm"}
            tone = tone_map.get(comment.get("sentiment", "neutral"), "friendly")
            suggested = generate_comment_reply(
                original_comment=comment["message"],
                post_topic=comment.get("post_message", "mystika"),
                tone=tone,
            )
            comment["suggested_reply"] = suggested
            db["comments"][cid] = comment
            count += 1
        except Exception as e:
            log.warning("Regen selhal pro %s: %s", cid, e)
    _save_db(db)
    return count


def sync_comments(since_hours: int = 48) -> dict:
    """
    Hlavní sync funkce:
    1. Načte aktuální komentáře z API
    2. Upsertne všechny načtené komentáře do lokální DB
    3. Filtruje duplicity
    4. Analyzuje sentiment
    5. Návrhy odpovědí se generují až těsně před odesláním

    Returns:
        dict: statistiky synchronizace
    """
    db = _load_db()
    db.setdefault("comments", {})
    db.setdefault("stats", {})

    log.info("Načítám komentáře z posledních %d hodin...", since_hours)
    fetched_comments = fetch_all_comments(since_hours=since_hours)

    added = 0
    updated = 0
    skipped = 0

    # Sleduj duplicity komentářů per post (max 3 stejné odpovědi), včetně starší DB
    post_msg_counts: dict[str, dict[str, int]] = {}
    for existing in db["comments"].values():
        post_id = existing.get("post_id", "")
        msg_key = _normalize_message_for_dedupe(existing.get("message", ""))
        if not post_id or not msg_key:
            continue
        post_msg_counts.setdefault(post_id, {})
        post_msg_counts[post_id][msg_key] = post_msg_counts[post_id].get(msg_key, 0) + 1

    import unicodedata
    def _is_junk(msg: str) -> bool:
        """True pokud je komentář prázdný, příliš krátký nebo jen emoji/znaky."""
        stripped = msg.strip()
        if len(stripped) < 4:
            return True
        # Odstraň emoji a interpunkci, zkontroluj zda zbyde aspoň 1 písmeno
        letters = [c for c in stripped if unicodedata.category(c).startswith("L")]
        return len(letters) < 3

    for comment in fetched_comments:
        cid = comment["id"]

        if cid in db["comments"]:
            existing = db["comments"][cid]
            merged, message_changed = _merge_fetched_comment(existing, comment)
            if _is_own_comment(merged) and merged.get("status") in ("new", None):
                merged["status"] = "ignored"
                merged["sentiment"] = "own_comment"
                merged["priority"] = 0
                merged["needs_reply"] = False
            elif message_changed and merged.get("status") in ("new", None, "ignored"):
                _clear_stale_reply_metadata(merged)
                analysis = analyze_comment_sentiment(merged["message"])
                merged.update(analysis)
                if not merged.get("needs_reply") and not merged.get("should_hide"):
                    merged["status"] = "ignored"
                else:
                    merged["status"] = "new"
            db["comments"][cid] = merged
            updated += 1
            continue

        msg = _normalize_message_for_dedupe(comment["message"])
        post_id = comment.get("post_id", "")

        if _is_own_comment(comment):
            comment["status"] = "ignored"
            comment["sentiment"] = "own_comment"
            comment["priority"] = 0
            comment["needs_reply"] = False
            db["comments"][cid] = comment
            added += 1
            continue

        # Přeskoč junk komentáře (prázdné, emoji-only, < 4 znaky)
        if _is_junk(comment["message"]):
            comment["status"] = "ignored"
            comment["sentiment"] = "junk"
            comment["priority"] = 0
            comment["needs_reply"] = False
            db["comments"][cid] = comment
            added += 1
            continue

        # Přeskoč duplicity (max 3 stejné odpovědi na stejném postu)
        if post_id not in post_msg_counts:
            post_msg_counts[post_id] = {}
        post_msg_counts[post_id][msg] = post_msg_counts[post_id].get(msg, 0) + 1
        if post_msg_counts[post_id][msg] > 3:
            comment["status"] = "ignored"
            comment["sentiment"] = "duplicate"
            comment["priority"] = 0
            comment["needs_reply"] = False
            db["comments"][cid] = comment
            added += 1
            continue

        # Analýza sentimentu
        analysis = analyze_comment_sentiment(comment["message"])
        comment.update(analysis)
        if not comment.get("needs_reply") and not comment.get("should_hide"):
            comment["status"] = "ignored"

        # Odpověď se generuje lazy — až těsně před odesláním v get_pending_comments()
        # Tady jen uložíme komentář bez odpovědi (šetří API náklady při syncu)

        db["comments"][cid] = comment
        db["stats"]["total_fetched"] = db["stats"].get("total_fetched", 0) + 1
        added += 1

    db["last_fetch"] = datetime.now().isoformat()
    db["last_sync"] = {
        "fetched": len(fetched_comments),
        "added": added,
        "updated": updated,
        "skipped": skipped,
        "since_hours": since_hours,
        "finished_at": db["last_fetch"],
    }
    _save_db(db)

    return {
        "fetched": len(fetched_comments),
        "added": added,
        "updated": updated,
        "skipped": skipped,
        "total_in_db": len(db["comments"]),
    }


def get_pending_comments(
    platform: str = None,
    sentiment: str = None,
    min_priority: int = 0,
) -> list[dict]:
    """
    Vrátí nevyřízené komentáře seřazené podle priority. Žádné Claude API volání.

    Args:
        platform: filtr platformy (facebook | instagram | None = obě)
        sentiment: filtr sentimentu (question | positive | skeptical | neutral)
        min_priority: minimum priority skóre (0-10)
    """
    db = _load_db()
    pending = []
    user_cooldown_hours = int(os.getenv("USER_REPLY_COOLDOWN_HOURS", "0"))

    for cid, comment in db["comments"].items():
        if comment.get("status") not in ("new", None):
            continue
        if platform and comment.get("platform") != platform:
            continue
        if sentiment and comment.get("sentiment") != sentiment:
            continue
        if comment.get("priority", 0) < min_priority:
            continue
        if comment.get("should_hide", False):
            continue
        # Přeskoč odpovědi stránky samotné (bot nesmí odpovídat sám sobě)
        if _is_own_comment(comment):
            continue
        if _has_recent_reply_to_user(comment, db["comments"], user_cooldown_hours):
            continue

        pending.append(comment)

    # Recency bonus — nové komentáře mají přednost (boostuje FB engagement window)
    now = datetime.now()
    def _score(c: dict) -> float:
        priority = c.get("priority", 0)
        try:
            ct = datetime.fromisoformat(c["created_time"].replace("Z", "+00:00").replace("+0000", "+00:00"))
            age_hours = (now - ct.replace(tzinfo=None)).total_seconds() / 3600
        except Exception:
            age_hours = 9999
        if age_hours < 1:
            recency = 8      # do hodiny — zlaté okno FB algoritmu
        elif age_hours < 6:
            recency = 5
        elif age_hours < 24:
            recency = 3
        elif age_hours < 72:
            recency = 1
        else:
            recency = 0
        return -(priority + recency)   # záporné = řazení sestupně

    pending.sort(key=_score)
    return pending


def get_comments_to_hide(platform: str = None) -> list[dict]:
    """Vrátí nové komentáře, které mají být moderované bez odpovědi."""
    db = _load_db()
    comments = []

    for comment in db["comments"].values():
        if comment.get("status") not in ("new", None):
            continue
        if platform and comment.get("platform") != platform:
            continue
        if not comment.get("should_hide", False):
            continue
        if _is_own_comment(comment):
            continue
        comments.append(comment)

    return comments


def save_comment_reply(comment_id: str, suggested_reply: str) -> None:
    """Uloží navrhovanou odpověď do DB. Volá se z comment_bot před odesláním."""
    db = _load_db()
    if comment_id in db["comments"]:
        db["comments"][comment_id]["suggested_reply"] = suggested_reply
        _save_db(db)


def save_comment_replies_batch(replies: dict[str, str]) -> None:
    """Uloží více navrhovaných odpovědí najednou. 1× disk I/O místo N×."""
    if not replies:
        return
    db = _load_db()
    for cid, reply in replies.items():
        if cid in db["comments"]:
            db["comments"][cid]["suggested_reply"] = reply
    _save_db(db)


def save_comment_reply_metadata(
    comment_id: str,
    suggested_reply: str,
    strategy: dict | None = None,
    quality: dict | None = None,
) -> None:
    """Uloží návrh odpovědi včetně strategie a quality gate výsledku."""
    db = _load_db()
    comment = db["comments"].get(comment_id)
    if not comment:
        return
    comment["suggested_reply"] = suggested_reply
    comment["reply_generated_at"] = datetime.now().isoformat()
    if strategy:
        comment["reply_strategy"] = strategy
        comment["reply_route"] = strategy.get("route")
        comment["reply_context_type"] = strategy.get("context_type")
        comment["reply_allowed_url"] = strategy.get("allowed_url")
        comment["reply_template_key"] = strategy.get("template_key")
    if quality:
        comment["reply_quality"] = quality
        comment["reply_quality_score"] = quality.get("score")
        comment["reply_quality_issues"] = quality.get("issues", [])
        comment["reply_cta_type"] = quality.get("cta_type", "none")
        comment["reply_url_count"] = quality.get("url_count", 0)
    db["comments"][comment_id] = comment
    _save_db(db)


def mark_comment_ignored(comment_id: str, reason: str) -> None:
    """Označí komentář jako ignorovaný, aby se v dalších bězích znovu neřešil."""
    db = _load_db()
    comment = db["comments"].get(comment_id)
    if not comment:
        return
    comment["status"] = "ignored"
    comment["ignored_reason"] = reason
    comment["ignored_at"] = datetime.now().isoformat()
    db["comments"][comment_id] = comment
    _save_db(db)


def _extract_urls(text: str) -> list[str]:
    return re.findall(r"(?:https?://)?(?:www\.)?mystickahvezda\.cz/[^\s]+|https?://[^\s]+", text or "")


def _detect_reply_cta(reply: str) -> str:
    lower = (reply or "").lower()
    if _extract_urls(reply):
        return "web_link"
    if "?" in (reply or ""):
        return "question"
    if any(word in lower for word in ("ulož", "uloz", "save")):
        return "save"
    if any(word in lower for word in ("pošli", "posli", "sdílej", "sdilej")):
        return "share"
    return "none"


def get_comment_thread_memory(comment_id: str, limit: int = 5) -> dict:
    """
    Vrátí kompaktní paměť vlákna pro anti-repetition a lepší návaznost.

    Ukládáme jen krátké poslední odpovědi/CTA/URL, ne celé dlouhé vlákno.
    """
    db = _load_db()
    current = db["comments"].get(comment_id)
    if not current:
        return {"recent_replies": [], "recent_user_comments": [], "used_urls": []}

    thread_id = current.get("thread_id") or current.get("parent_id") or current.get("id")
    related = []
    for comment in db["comments"].values():
        same_thread = (
            comment.get("id") == thread_id
            or comment.get("thread_id") == thread_id
            or comment.get("parent_id") == thread_id
            or comment.get("id") == current.get("parent_id")
        )
        if same_thread:
            related.append(comment)

    def _sort_key(comment: dict):
        parsed = _parse_meta_time(comment.get("created_time", "")) or _parse_meta_time(comment.get("replied_at", ""))
        return parsed or datetime.min

    related.sort(key=_sort_key)
    previous = [comment for comment in related if comment.get("id") != comment_id]

    recent_replies: list[str] = []
    recent_user_comments: list[str] = []
    used_urls: list[str] = []
    last_cta_type = "none"

    for comment in previous:
        reply = comment.get("actual_reply") or ""
        if reply:
            recent_replies.append(reply)
            used_urls.extend(_extract_urls(reply))
            last_cta_type = comment.get("reply_cta_type") or _detect_reply_cta(reply)
        message = comment.get("message") or ""
        if message and not _is_own_comment(comment):
            recent_user_comments.append(message)

    return {
        "thread_id": thread_id,
        "recent_replies": recent_replies[-limit:],
        "recent_user_comments": recent_user_comments[-limit:],
        "last_bot_reply": recent_replies[-1] if recent_replies else "",
        "last_user_comment": recent_user_comments[-1] if recent_user_comments else "",
        "last_cta_type": last_cta_type,
        "used_urls": used_urls[-limit:],
    }


# ══════════════════════════════════════════════════
# ODPOVÍDÁNÍ NA KOMENTÁŘE
# ══════════════════════════════════════════════════

def post_reply_facebook(comment_id: str, reply_text: str) -> dict:
    """Pošle odpověď na Facebook komentář přes Graph API"""
    if not config.META_ACCESS_TOKEN:
        return {"success": False, "error": "META_ACCESS_TOKEN chybí"}

    url = f"{GRAPH_API_URL}/{comment_id}/comments"
    resp = requests.post(url, data={
        "message": reply_text,
        "access_token": config.META_ACCESS_TOKEN,
    }, timeout=config.HTTP_TIMEOUT)

    result = resp.json()
    if "id" in result:
        return {"success": True, "reply_id": result["id"]}
    return _meta_api_result(resp, result)


def post_reply_instagram(comment_id: str, reply_text: str) -> dict:
    """Pošle odpověď na Instagram komentář přes Graph API"""
    if not config.META_ACCESS_TOKEN:
        return {"success": False, "error": "META_ACCESS_TOKEN chybí"}

    url = f"{GRAPH_API_URL}/{comment_id}/replies"
    resp = requests.post(url, data={
        "message": reply_text,
        "access_token": config.META_ACCESS_TOKEN,
    }, timeout=config.HTTP_TIMEOUT)

    result = resp.json()
    if "id" in result:
        return {"success": True, "reply_id": result["id"]}
    return _meta_api_result(resp, result)


def reply_to_comment(comment_id: str, reply_text: str, mark_done: bool = True) -> dict:
    """
    Odpoví na komentář na správné platformě a uloží do DB.

    Args:
        comment_id: ID komentáře
        reply_text: text odpovědi
        mark_done: označí komentář jako vyřízený
    """
    return _reply_to_comment(comment_id, reply_text, mark_done=mark_done, claim_token=None)


def _reply_to_comment(
    comment_id: str,
    reply_text: str,
    mark_done: bool = True,
    claim_token: str | None = None,
) -> dict:
    """Internal reply function with optional processing-claim enforcement."""
    db = _load_db()
    comment = db["comments"].get(comment_id)

    if not comment:
        return {"success": False, "error": f"Komentář {comment_id} nenalezen v DB"}

    status = comment.get("status")
    if status == "replied":
        return {"success": False, "error": f"Komentář {comment_id} už má odpověď", "already_replied": True}
    if status == "hidden":
        return {"success": False, "error": f"Komentář {comment_id} je skrytý"}
    if status == "ignored":
        return {"success": False, "error": f"Komentář {comment_id} je ignorovaný"}
    if status == "processing":
        if not claim_token or comment.get("processing_token") != claim_token:
            return {"success": False, "error": f"Komentář {comment_id} se už zpracovává", "in_progress": True}
    elif status not in ("new", None):
        return {"success": False, "error": f"Komentář {comment_id} není připravený k odpovědi (status: {status})"}

    platform = comment.get("platform", "facebook")

    if platform == "facebook":
        result = post_reply_facebook(comment_id, reply_text)
    elif platform == "instagram":
        result = post_reply_instagram(comment_id, reply_text)
    else:
        return {"success": False, "error": f"Neznámá platforma: {platform}"}

    if result["success"] and mark_done:
        comment["status"] = "replied"
        comment["actual_reply"] = reply_text
        comment["replied_at"] = datetime.now().isoformat()
        comment["reply_id"] = result.get("reply_id")
        comment.pop("processing_token", None)
        comment.pop("processing_started_at", None)
        db["comments"][comment_id] = comment
        db["stats"]["total_replied"] = db["stats"].get("total_replied", 0) + 1
        _save_db(db)

    return result


def hide_comment(comment_id: str, platform: str = "facebook") -> dict:
    """Skryje nevhodný komentář (spam, hate)"""
    if not config.META_ACCESS_TOKEN:
        return {"success": False, "error": "META_ACCESS_TOKEN chybí"}

    if platform == "facebook":
        url = f"{GRAPH_API_URL}/{comment_id}"
        resp = requests.post(url, data={
            "is_hidden": True,
            "access_token": config.META_ACCESS_TOKEN,
        }, timeout=config.HTTP_TIMEOUT)
        result = resp.json()
        success = result.get("success", False)
    else:
        # Instagram nemá hide, ale lze použít delete
        url = f"{GRAPH_API_URL}/{comment_id}"
        resp = requests.delete(url, params={"access_token": config.META_ACCESS_TOKEN}, timeout=config.HTTP_TIMEOUT)
        success = resp.status_code == 200
        result = {"success": success}

    if success:
        db = _load_db()
        if comment_id in db["comments"]:
            db["comments"][comment_id]["status"] = "hidden"
            db["stats"]["total_hidden"] = db["stats"].get("total_hidden", 0) + 1
            _save_db(db)

    if success:
        return {"success": True, "error": ""}
    return _meta_api_result(resp, result)


def get_stats() -> dict:
    """Statistiky správy komentářů"""
    db = _load_db()
    all_comments = list(db["comments"].values())

    by_status = {}
    by_platform = {}
    by_sentiment = {}

    for c in all_comments:
        s = c.get("status", "new")
        by_status[s] = by_status.get(s, 0) + 1

        p = c.get("platform", "unknown")
        by_platform[p] = by_platform.get(p, 0) + 1

        sent = c.get("sentiment", "unknown")
        by_sentiment[sent] = by_sentiment.get(sent, 0) + 1

    pending = [c for c in all_comments if c.get("status") == "new" and not c.get("should_hide")]

    return {
        "total": len(all_comments),
        "pending": len(pending),
        "by_status": by_status,
        "by_platform": by_platform,
        "by_sentiment": by_sentiment,
        "last_fetch": db.get("last_fetch", "nikdy"),
        "db_stats": db.get("stats", {}),
    }
