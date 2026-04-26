"""
Buffer Publisher — publikování a plánování postů přes Buffer API.

Buffer nahrazuje přímé Meta API pro publishing postů.
Komentáře stále vyžadují Meta API.

Použití:
    from buffer_publisher import publish_now, schedule_post, get_profiles, verify_access

Dokumentace: https://buffer.com/developers/api
"""
import base64
import json
from pathlib import Path
from typing import Optional
import sys

sys.path.insert(0, str(Path(__file__).parent))
import config
from logger import get_logger

log = get_logger(__name__)

# Lazy import requests — nevyžadujeme při startu pokud není Buffer nakonfigurován
def _requests():
    try:
        import requests as r
        return r
    except ImportError:
        raise ImportError("Chybí knihovna 'requests'. Spusť: pip install requests")


BUFFER_API = "https://api.bufferapp.com/1"


# ══════════════════════════════════════════════════
# POMOCNÉ FUNKCE
# ══════════════════════════════════════════════════

def _auth_params() -> dict:
    """Vrátí autentizační parametry pro Buffer API"""
    if not config.BUFFER_ACCESS_TOKEN:
        raise ValueError(
            "BUFFER_ACCESS_TOKEN není nastaven v .env souboru!\n"
            "Získej token na: https://buffer.com/developers/apps"
        )
    return {"access_token": config.BUFFER_ACCESS_TOKEN}


def _upload_image_imgbb(image_path: Path) -> Optional[str]:
    """
    Nahraje obrázek na imgbb.com a vrátí veřejnou URL.
    Vyžaduje IMGBB_API_KEY v .env (zdarma na imgbb.com).
    """
    if not config.IMGBB_API_KEY:
        log.debug("IMGBB_API_KEY není nastaven — přeskakuji nahrávání obrázku")
        return None

    requests = _requests()
    try:
        with open(image_path, "rb") as f:
            encoded = base64.b64encode(f.read()).decode("utf-8")

        resp = requests.post(
            "https://api.imgbb.com/1/upload",
            data={"key": config.IMGBB_API_KEY, "image": encoded},
            timeout=30,
        )
        resp.raise_for_status()
        url = resp.json()["data"]["url"]
        log.info("Obrázek nahrán na imgbb: %s", url)
        return url
    except Exception as e:
        log.warning("Nepodařilo se nahrát obrázek na imgbb: %s", e)
        return None


def _get_profile_id() -> str:
    """Vrátí Buffer profile ID z configu nebo vyvolá chybu s návodem"""
    if not config.BUFFER_PROFILE_ID:
        raise ValueError(
            "BUFFER_PROFILE_ID není nastaven v .env souboru!\n"
            "Spusť: python agent.py buffer-profiles — zobrazí seznam profilů s jejich ID"
        )
    return config.BUFFER_PROFILE_ID


# ══════════════════════════════════════════════════
# HLAVNÍ FUNKCE
# ══════════════════════════════════════════════════

def get_profiles() -> list[dict]:
    """
    Vrátí seznam všech připojených sociálních profilů v Buffer účtu.
    Použij pro zjištění BUFFER_PROFILE_ID.
    """
    requests = _requests()
    resp = requests.get(
        f"{BUFFER_API}/profiles.json",
        params=_auth_params(),
        timeout=config.HTTP_TIMEOUT,
    )
    resp.raise_for_status()
    profiles = resp.json()
    log.info("Nalezeno %d Buffer profilů", len(profiles))
    return profiles


def publish_now(
    caption: str,
    hashtags: list[str],
    image_path: Optional[Path] = None,
    profile_id: Optional[str] = None,
) -> dict:
    """
    Okamžitě publikuje post přes Buffer.

    Args:
        caption:    text příspěvku (bez hashtagů)
        hashtags:   seznam hashtagů (přidají se na konec)
        image_path: cesta k lokálnímu obrázku (volitelné)
        profile_id: Buffer profile ID (výchozí z BUFFER_PROFILE_ID v .env)

    Returns:
        dict: odpověď Buffer API {success, buffer_id, ...}
    """
    return _create_update(
        caption=caption,
        hashtags=hashtags,
        image_path=image_path,
        profile_id=profile_id,
        now=True,
        scheduled_at=None,
    )


def schedule_post(
    caption: str,
    hashtags: list[str],
    scheduled_at: str,
    image_path: Optional[Path] = None,
    profile_id: Optional[str] = None,
) -> dict:
    """
    Naplánuje post v Buffer frontě.

    Args:
        caption:      text příspěvku
        hashtags:     seznam hashtagů
        scheduled_at: ISO 8601 čas publikace, např. "2026-03-23T10:00:00+01:00"
        image_path:   cesta k lokálnímu obrázku (volitelné)
        profile_id:   Buffer profile ID

    Returns:
        dict: odpověď Buffer API
    """
    return _create_update(
        caption=caption,
        hashtags=hashtags,
        image_path=image_path,
        profile_id=profile_id,
        now=False,
        scheduled_at=scheduled_at,
    )


def add_to_queue(
    caption: str,
    hashtags: list[str],
    image_path: Optional[Path] = None,
    profile_id: Optional[str] = None,
) -> dict:
    """
    Přidá post na konec Buffer fronty (nejjednodušší volba —
    Buffer sám vybere optimální čas publikace).
    """
    return _create_update(
        caption=caption,
        hashtags=hashtags,
        image_path=image_path,
        profile_id=profile_id,
        now=False,
        scheduled_at=None,
    )


def _create_update(
    caption: str,
    hashtags: list[str],
    image_path: Optional[Path],
    profile_id: Optional[str],
    now: bool,
    scheduled_at: Optional[str],
) -> dict:
    """Interní funkce — vytvoří Buffer update (post/naplánování/fronta)"""
    requests = _requests()
    pid = profile_id or _get_profile_id()

    # Složení textu: caption + hashtagy oddělené prázdným řádkem
    tags_str = " ".join(hashtags) if hashtags else ""
    full_text = f"{caption}\n\n{tags_str}".strip() if tags_str else caption

    params = _auth_params()
    data: dict = {
        "text": full_text,
        "profile_ids[]": pid,
    }

    if now:
        data["now"] = "true"
    elif scheduled_at:
        data["scheduled_at"] = scheduled_at

    # Obrázek — nahraj na imgbb pokud je dostupný
    image_url = None
    if image_path and Path(image_path).exists():
        image_url = _upload_image_imgbb(Path(image_path))

    if image_url:
        data["media[photo]"] = image_url
        log.info("Post bude obsahovat obrázek: %s", image_url)
    else:
        log.info("Post bude bez obrázku (IMGBB_API_KEY není nastaven nebo upload selhal)")

    resp = requests.post(
        f"{BUFFER_API}/updates/create.json",
        params=params,
        data=data,
        timeout=config.HTTP_TIMEOUT,
    )

    try:
        resp.raise_for_status()
    except Exception as e:
        log.error("Buffer API chyba: %s — odpověď: %s", e, resp.text[:300])
        raise

    result = resp.json()
    log.info(
        "Buffer post vytvořen: success=%s, updates=%d",
        result.get("success"),
        len(result.get("updates", [])),
    )
    return result


def verify_access() -> dict:
    """
    Ověří Buffer přístupový token a vrátí info o účtu.
    Použij pro test připojení.
    """
    requests = _requests()
    try:
        resp = requests.get(
            f"{BUFFER_API}/user.json",
            params=_auth_params(),
            timeout=config.HTTP_TIMEOUT,
        )
        resp.raise_for_status()
        user = resp.json()
        log.info("Buffer přístup ověřen: %s", user.get("name", "?"))
        return {"ok": True, "user": user}
    except Exception as e:
        log.error("Buffer ověření selhalo: %s", e)
        return {"ok": False, "error": str(e)}


def get_pending_posts(profile_id: Optional[str] = None) -> list[dict]:
    """Vrátí seznam naplánovaných postů čekajících ve frontě"""
    requests = _requests()
    pid = profile_id or _get_profile_id()
    resp = requests.get(
        f"{BUFFER_API}/profiles/{pid}/updates/pending.json",
        params=_auth_params(),
        timeout=config.HTTP_TIMEOUT,
    )
    resp.raise_for_status()
    data = resp.json()
    updates = data.get("updates", [])
    log.info("Buffer fronta: %d čekajících postů", len(updates))
    return updates
