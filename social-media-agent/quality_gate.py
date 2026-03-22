"""
Quality Gate — dvouvrstvá kontrola kvality výstupu agenta.

Vrstva 1: Rule-Based Checks (rychlé, bez API)
  - Délka textu (per platforma)
  - Počet hashtagů
  - Zakázané fráze (brand voice compliance)
  - Kontrola CTA přítomnosti
  - Kontrola jazyka (žádná angličtina v caption)
  - Emoji count
  - Vykřičníky
  - Duplicitní obsah

Vrstva 2: AI Review (Gemini)
  - Celkový brand voice audit
  - Kontrola tónu a kvality textu
  - Kontrola image promptu vs. brand
  - Skóre 1-10 s konkrétními návrhy na zlepšení

Použití:
  result = validate_post(post_data, platform="instagram")
  if result["approved"]:
      save_post(...)
  else:
      print(result["issues"])  # co opravit
"""
import re
import sys
from pathlib import Path
from typing import Optional

sys.path.insert(0, str(Path(__file__).parent))
import config
from logger import get_logger

log = get_logger(__name__)

# Pokus o import PIL pro kontrolu obrázků (volitelný)
try:
    from PIL import Image
    HAS_PIL = True
except ImportError:
    HAS_PIL = False


# ══════════════════════════════════════════════════
# KONSTANTY PRO KONTROLU
# ══════════════════════════════════════════════════

# Fráze zakázané v brand voice
FORBIDDEN_PHRASES = [
    "věřte nebo ne",
    "fascinující",
    "neuvěřitelné",
    "ohromující",
    "dnes vám přináším",
    "sdílíme s vámi",
    "nechte to vstřebat",
    "tohle změní váš život",
    "sledujte nás pro více",
    "sledujte nás",
    "follow us",
    "link in bio",
    "like and share",
    "lajkujte a sdílejte",
]

# Fráze prozrazující AI původ (KRITICKÁ CHYBA pokud se objeví)
AI_DISCLOSURE_PHRASES = [
    "jako ai",
    "jsem ai",
    "jsem umělá inteligence",
    "umělá inteligence",
    "umela inteligence",
    "jsem bot",
    "jsem chatbot",
    "jazykový model",
    "jazykovy model",
    "strojové učení",
    "strojove uceni",
    "neuronová síť",
    "neuronova sit",
    "ai-powered",
    "ai powered",
    "generováno ai",
    "generovano ai",
    "vytvořeno ai",
    "vytvoreno ai",
    "gemini",
    "gpt",
    "openai",
    "anthropic",
    "large language model",
    "llm",
    "algoritmus generuje",
    "algoritmus vytvořil",
    "naprogramován",
    "naprogramovan",
]

# Anglická slova, která nemají být v českém textu
ENGLISH_LEAKS = [
    "amazing", "beautiful", "incredible", "journey", "vibes",
    "energy flow", "self-care", "mindset", "healing power",
    "discover", "unlock", "transform your", "manifest your",
    "spiritual awakening", "universe has", "the stars say",
    "check out", "click", "swipe up", "tap the link",
    "don't miss", "limited time", "act now", "buy now",
]

# Frázové vzorce, které jsou příliš "reklamní" / korporátní
CORPORATE_PATTERNS = [
    r"rádi bychom vám (představili|nabídli)",
    r"neváhejte nás kontaktovat",
    r"těšíme se na vaš[ie]",
    r"s radostí vám oznamujeme",
    r"rádi vám pomůžeme",
    r"nabídka platí do",
    r"pouze dnes",
    r"akce končí",
    r"sleva \d+%",
    r"objednejte (si|nyní|teď)",
]

# Minimální a optimální délky caption podle platformy
CAPTION_LIMITS = {
    "instagram": {
        "min": 80,        # příliš krátký = nezajímavý
        "optimal_min": 150,
        "optimal_max": 800,
        "max": 2200,
    },
    "facebook": {
        "min": 50,
        "optimal_min": 100,
        "optimal_max": 500,
        "max": 63206,
    },
}


# ══════════════════════════════════════════════════
# VRSTVA 1: RULE-BASED CHECKS
# ══════════════════════════════════════════════════

def _check_caption_length(caption: str, platform: str) -> list[dict]:
    """Zkontroluje délku caption textu"""
    issues = []
    limits = CAPTION_LIMITS.get(platform, CAPTION_LIMITS["instagram"])
    length = len(caption)

    if length < limits["min"]:
        issues.append({
            "severity": "error",
            "check": "caption_length",
            "message": f"Caption je příliš krátký ({length} znaků, minimum {limits['min']})",
        })
    elif length > limits["max"]:
        issues.append({
            "severity": "error",
            "check": "caption_length",
            "message": f"Caption překračuje limit platformy ({length}/{limits['max']} znaků)",
        })
    elif length < limits["optimal_min"]:
        issues.append({
            "severity": "warning",
            "check": "caption_length",
            "message": f"Caption je pod optimální délkou ({length} znaků, doporučeno {limits['optimal_min']}+)",
        })
    elif length > limits["optimal_max"]:
        issues.append({
            "severity": "info",
            "check": "caption_length",
            "message": f"Caption je delší než optimum ({length} znaků, ideál pod {limits['optimal_max']})",
        })

    return issues


def _check_ai_disclosure(caption: str) -> list[dict]:
    """KRITICKÁ KONTROLA: detekuje zmínky o AI, botu, umělé inteligenci"""
    issues = []
    caption_lower = caption.lower()

    for phrase in AI_DISCLOSURE_PHRASES:
        if phrase in caption_lower:
            issues.append({
                "severity": "error",
                "check": "ai_disclosure",
                "message": f"KRITICKÉ: Text prozrazuje AI původ — nalezeno \"{phrase}\". Agent nesmí nikdy zmínit AI!",
            })

    return issues


def _check_hashtags(hashtags: list, platform: str) -> list[dict]:
    """Zkontroluje hashtags"""
    issues = []
    settings = config.PLATFORM_SETTINGS.get(platform, {})
    max_tags = settings.get("max_hashtags", 30)

    if not hashtags:
        issues.append({
            "severity": "warning",
            "check": "hashtags",
            "message": "Chybí hashtags — doporučeno přidat alespoň 5",
        })
    elif len(hashtags) > max_tags:
        issues.append({
            "severity": "error",
            "check": "hashtags",
            "message": f"Příliš mnoho hashtagů ({len(hashtags)}, max {max_tags} pro {platform})",
        })
    elif len(hashtags) < 3:
        issues.append({
            "severity": "warning",
            "check": "hashtags",
            "message": f"Málo hashtagů ({len(hashtags)}), doporučeno alespoň 5",
        })

    # Kontrola formátu (#)
    for tag in hashtags:
        if not tag.startswith("#"):
            issues.append({
                "severity": "error",
                "check": "hashtags",
                "message": f"Hashtag '{tag}' nezačíná znakem #",
            })
            break

    # Kontrola duplicit
    unique = set(t.lower() for t in hashtags)
    if len(unique) < len(hashtags):
        issues.append({
            "severity": "warning",
            "check": "hashtags",
            "message": "Nalezeny duplicitní hashtags",
        })

    return issues


def _check_forbidden_phrases(caption: str) -> list[dict]:
    """Zkontroluje zakázané fráze z brand voice"""
    issues = []
    caption_lower = caption.lower()

    for phrase in FORBIDDEN_PHRASES:
        if phrase.lower() in caption_lower:
            issues.append({
                "severity": "error",
                "check": "brand_voice",
                "message": f"Zakázaná fráze nalezena: \"{phrase}\"",
            })

    return issues


def _check_english_leaks(caption: str) -> list[dict]:
    """Detekuje anglická slova, která nepatří do českého textu"""
    issues = []
    caption_lower = caption.lower()

    for phrase in ENGLISH_LEAKS:
        if phrase.lower() in caption_lower:
            issues.append({
                "severity": "warning",
                "check": "language",
                "message": f"Anglický výraz nalezen: \"{phrase}\" — použij český ekvivalent",
            })

    return issues


def _check_corporate_tone(caption: str) -> list[dict]:
    """Detekuje příliš korporátní/reklamní fráze"""
    issues = []
    caption_lower = caption.lower()

    for pattern in CORPORATE_PATTERNS:
        if re.search(pattern, caption_lower):
            match = re.search(pattern, caption_lower).group()
            issues.append({
                "severity": "warning",
                "check": "tone",
                "message": f"Příliš korporátní fráze: \"{match}\" — přepiš přirozeněji",
            })

    return issues


def _check_exclamation_marks(caption: str) -> list[dict]:
    """Max 1 vykřičník na post (brand voice pravidlo)"""
    issues = []
    count = caption.count("!")

    if count > 2:
        issues.append({
            "severity": "warning",
            "check": "punctuation",
            "message": f"Příliš mnoho vykřičníků ({count}), max 1-2 — značka komunikuje klidně",
        })

    return issues


def _check_emoji_count(caption: str) -> list[dict]:
    """Kontrola rozumného množství emoji"""
    issues = []
    # Unicode emoji ranges
    emoji_pattern = re.compile(
        "[\U0001F600-\U0001F64F"  # emoticons
        "\U0001F300-\U0001F5FF"   # symbols & pictographs
        "\U0001F680-\U0001F6FF"   # transport & map
        "\U0001F1E0-\U0001F1FF"   # flags
        "\U00002702-\U000027B0"
        "\U0001F900-\U0001F9FF"   # supplemental
        "\U00002600-\U000026FF"   # misc symbols
        "\U0000FE00-\U0000FE0F"   # variation selectors
        "\U0000200D"              # ZWJ
        "\U00002B50"              # star
        "\U0000270D"              # writing hand
        "\U00002764"              # heart
        "]+", flags=re.UNICODE
    )
    emoji_count = len(emoji_pattern.findall(caption))

    if emoji_count > 6:
        issues.append({
            "severity": "warning",
            "check": "emoji",
            "message": f"Příliš mnoho emoji ({emoji_count}), doporučeno max 5 — působí neprofesionálně",
        })
    elif emoji_count == 0:
        issues.append({
            "severity": "info",
            "check": "emoji",
            "message": "Žádné emoji — zvažte přidat 1-3 pro vizuální přitažlivost",
        })

    return issues


def _check_cta(caption: str, call_to_action: str = "") -> list[dict]:
    """Kontrola přítomnosti výzvy k akci"""
    issues = []
    has_cta = bool(call_to_action and call_to_action.strip())

    # Hledání CTA v textu
    cta_patterns = [
        r"napiš", r"napiste", r"podělte se", r"podelte se",
        r"zkus", r"vyzkoušej", r"mrkni na", r"přečti",
        r"sdílej", r"nasdílej", r"ulož si", r"komentuj",
        r"dej nám vědět", r"jak to máš ty", r"jak to vidíš",
        r"co myslíš", r"souhlasíš", r"co říkáš",
        r"odkaz v bio", r"link v biu", r"na blogu",
        r"mystickahvezda\.cz",
    ]
    caption_lower = caption.lower()
    has_cta_in_text = any(re.search(p, caption_lower) for p in cta_patterns)

    if not has_cta and not has_cta_in_text:
        issues.append({
            "severity": "warning",
            "check": "cta",
            "message": "Chybí CTA (výzva k akci) — post by měl čtenáře k něčemu pozvat",
        })

    return issues


def _check_hook(caption: str) -> list[dict]:
    """Kontrola síly prvních 2 řádků (hook)"""
    issues = []
    lines = caption.strip().split("\n")
    first_line = lines[0].strip() if lines else ""

    if len(first_line) < 15:
        issues.append({
            "severity": "warning",
            "check": "hook",
            "message": f"Úvodní řádek je příliš krátký ({len(first_line)} znaků) — hook musí zaujmout",
        })

    # Slabé začátky
    weak_starts = [
        "ahoj", "hezký den", "dobrý den", "přeji", "dnes bych",
        "chtěla bych", "ráda bych", "v dnešním",
    ]
    first_lower = first_line.lower()
    for weak in weak_starts:
        if first_lower.startswith(weak):
            issues.append({
                "severity": "warning",
                "check": "hook",
                "message": f"Slabý hook — začíná \"{weak}...\", zkus silnější úvod (otázka, fakt, provokace)",
            })
            break

    return issues


def _check_image(image_path: Optional[str | Path]) -> list[dict]:
    """Zkontroluje obrázek — existence, formát, rozměry"""
    issues = []

    if not image_path:
        issues.append({
            "severity": "info",
            "check": "image",
            "message": "Žádný obrázek — post bez obrázku má nižší reach",
        })
        return issues

    path = Path(image_path)
    if not path.exists():
        issues.append({
            "severity": "error",
            "check": "image",
            "message": f"Obrázek neexistuje: {path.name}",
        })
        return issues

    # Kontrola velikosti souboru
    file_size_mb = path.stat().st_size / (1024 * 1024)
    if file_size_mb > 8:
        issues.append({
            "severity": "error",
            "check": "image",
            "message": f"Obrázek je příliš velký ({file_size_mb:.1f} MB, max 8 MB pro sociální sítě)",
        })
    elif file_size_mb < 0.01:
        issues.append({
            "severity": "warning",
            "check": "image",
            "message": f"Obrázek je podezřele malý ({file_size_mb*1024:.0f} KB) — možná placeholder?",
        })

    # Kontrola formátu
    valid_formats = {".jpg", ".jpeg", ".png", ".webp"}
    if path.suffix.lower() not in valid_formats:
        issues.append({
            "severity": "error",
            "check": "image",
            "message": f"Nepodporovaný formát obrázku: {path.suffix} (povoleno: {', '.join(valid_formats)})",
        })

    # Kontrola rozměrů (vyžaduje PIL)
    if HAS_PIL:
        try:
            with Image.open(path) as img:
                w, h = img.size

                if w < 600 or h < 600:
                    issues.append({
                        "severity": "error",
                        "check": "image",
                        "message": f"Obrázek má příliš nízké rozlišení ({w}x{h}), min 600x600",
                    })

                # Kontrola poměru stran
                ratio = w / h
                if ratio > 2.5 or ratio < 0.3:
                    issues.append({
                        "severity": "warning",
                        "check": "image",
                        "message": f"Neobvyklý poměr stran ({ratio:.2f}) — může být oříznutý na sítích",
                    })

                # Kontrola jasu (příliš tmavý / příliš světlý)
                try:
                    grayscale = img.convert("L")
                    pixels = list(grayscale.getdata())
                    avg_brightness = sum(pixels) / len(pixels)

                    if avg_brightness < 30:
                        issues.append({
                            "severity": "warning",
                            "check": "image",
                            "message": f"Obrázek je velmi tmavý (jas {avg_brightness:.0f}/255) — text nebude čitelný",
                        })
                    elif avg_brightness > 240:
                        issues.append({
                            "severity": "warning",
                            "check": "image",
                            "message": f"Obrázek je téměř bílý (jas {avg_brightness:.0f}/255) — slabý vizuální dojem",
                        })
                except Exception:
                    pass  # Přeskočit pokud nelze analyzovat jas

        except Exception as e:
            issues.append({
                "severity": "warning",
                "check": "image",
                "message": f"Nelze otevřít obrázek pro analýzu: {e}",
            })

    return issues


def _check_image_prompt(image_prompt: str) -> list[dict]:
    """Zkontroluje kvalitu image promptu pro Imagen 3"""
    issues = []

    if not image_prompt or not image_prompt.strip():
        issues.append({
            "severity": "info",
            "check": "image_prompt",
            "message": "Chybí image prompt — nebude generován obrázek",
        })
        return issues

    prompt = image_prompt.strip()

    # Příliš krátký prompt
    if len(prompt) < 30:
        issues.append({
            "severity": "warning",
            "check": "image_prompt",
            "message": f"Image prompt je příliš krátký ({len(prompt)} znaků) — nedostaneš kvalitní obrázek",
        })

    # Měl by být anglicky (Imagen 3 nejlépe rozumí EN)
    czech_words = ["obrázek", "fotka", "krásný", "měsíc", "hvězda", "noc"]
    prompt_lower = prompt.lower()
    if any(w in prompt_lower for w in czech_words):
        issues.append({
            "severity": "warning",
            "check": "image_prompt",
            "message": "Image prompt obsahuje česká slova — Imagen 3 funguje nejlépe s anglickým promptem",
        })

    # Kontrola brand stylu (měl by obsahovat mystické elementy)
    brand_style_words = [
        "mystical", "cosmic", "celestial", "spiritual", "ethereal",
        "moon", "stars", "crystal", "tarot", "candle", "meditation",
        "purple", "indigo", "gold", "deep blue", "dark",
    ]
    has_brand_style = any(w in prompt_lower for w in brand_style_words)
    if not has_brand_style:
        issues.append({
            "severity": "info",
            "check": "image_prompt",
            "message": "Image prompt neobsahuje brand stylistické prvky (mystical, cosmic, indigo, gold...)",
        })

    # Nevhodný obsah v promptu
    forbidden_image_terms = [
        "text", "words", "letters", "logo", "watermark",
        "face", "person", "portrait", "selfie",
    ]
    for term in forbidden_image_terms:
        if term in prompt_lower:
            issues.append({
                "severity": "warning",
                "check": "image_prompt",
                "message": f"Image prompt obsahuje '{term}' — Imagen 3 špatně generuje text/obličeje",
            })

    return issues


# ══════════════════════════════════════════════════
# VRSTVA 2: AI REVIEW (Gemini)
# ══════════════════════════════════════════════════

def ai_review(post_data: dict, platform: str = "instagram") -> dict:
    """
    Hloubková AI kontrola kvality pomocí Gemini.
    Vrací skóre 1-10 a konkrétní návrhy na zlepšení.

    Returns:
        dict: {score, verdict, strengths, improvements, rewritten_caption}
    """
    try:
        from generators.text_generator import setup_gemini, _call_gemini, _parse_json_response, BRAND_VOICE
        from google.genai import types as genai_types
    except ImportError as e:
        return {
            "score": -1,
            "verdict": f"AI review nedostupné: {e}",
            "strengths": [],
            "improvements": [],
            "rewritten_caption": None,
        }

    client, model_name = setup_gemini()

    caption = post_data.get("caption", "")
    hashtags = post_data.get("hashtags", [])
    image_prompt = post_data.get("image_prompt", "")
    cta = post_data.get("call_to_action", "")
    topic = post_data.get("topic", "")
    post_type = post_data.get("post_type", "")

    prompt = f"""Jsi přísný ale férový editor obsahu pro značku Mystická Hvězda.
Tvůj úkol je zhodnotit kvalitu postu pro {platform} a dát KONKRÉTNÍ zpětnou vazbu.

{BRAND_VOICE}

═══ POST K HODNOCENÍ ═══
Téma: {topic}
Typ postu: {post_type}
Platforma: {platform}

CAPTION:
{caption}

HASHTAGS: {' '.join(hashtags)}
CTA: {cta}
IMAGE PROMPT: {image_prompt}
════════════════════════

HODNOŤ TYTO OBLASTI (1-10 bodů za každou):

1. HOOK SÍLA (první 2 řádky) — Zastaví scrollování? Vyvolá zvědavost?
2. BRAND VOICE — Zní to jako Mystická Hvězda? Teplý, moudrý, přístupný tón?
3. HODNOTA PRO ČTENÁŘE — Naučí se něco? Cítí něco? Je důvod to přečíst?
4. JAZYK A STYL — Přirozená čeština? Žádné klišé? Plynulý text?
5. CTA A ENGAGEMENT — Motivuje k interakci? Láká na web?
6. IMAGE PROMPT KVALITA — Je dostatečně detailní? Pasuje ke značce?
7. HASHTAGS STRATEGIE — Relevantní mix? Správný počet?

DŮLEŽITÁ PRAVIDLA HODNOCENÍ:
- Buď PŘÍSNÝ ale konstruktivní — průměr kolem 6-7, ne 9-10
- Pokud je caption generický/plochý, dej nízké skóre
- Pokud chybí konkrétní mystické znalosti (jen vágní "energie"), strhni body
- Pokud hook nezastaví scrollování, strhni body
- Pokud text obsahuje zakázané fráze nebo korporátní jazyk, VELKÁ PENALIZACE

POKUD je celkové skóre pod 7, napiš PŘEPSANÝ caption (lepší verze).
POKUD je celkové skóre 7+, napiš jen drobné návrhy.

Odpověz STRIKTNĚ jako JSON:
{{
  "scores": {{
    "hook": 7,
    "brand_voice": 8,
    "value": 6,
    "language": 7,
    "engagement": 5,
    "image_prompt": 7,
    "hashtags": 8
  }},
  "overall_score": 7,
  "verdict": "SCHVÁLENO" nebo "PŘEPRACOVAT" nebo "DOBRÝ ZÁKLAD",
  "strengths": ["silná stránka 1", "silná stránka 2"],
  "improvements": ["konkrétní vylepšení 1", "konkrétní vylepšení 2"],
  "rewritten_caption": null nebo "vylepšený text pokud skóre < 7"
}}"""

    try:
        response = _call_gemini(
            client, model_name, prompt,
            config_obj=genai_types.GenerateContentConfig(
                temperature=0.3,  # Nízká teplota pro konzistentní hodnocení
                response_mime_type="application/json",
            ),
        )
        result = _parse_json_response(response.text)

        if result:
            return result
        else:
            return {
                "score": -1,
                "verdict": "Nepodařilo se zpracovat AI odpověď",
                "strengths": [],
                "improvements": [],
                "rewritten_caption": None,
            }

    except Exception as e:
        return {
            "score": -1,
            "verdict": f"AI review chyba: {e}",
            "strengths": [],
            "improvements": [],
            "rewritten_caption": None,
        }


# ══════════════════════════════════════════════════
# HLAVNÍ FUNKCE: VALIDATE POST
# ══════════════════════════════════════════════════

def validate_post(
    post_data: dict,
    platform: str = "instagram",
    image_path: Optional[str | Path] = None,
    run_ai_review: bool = True,
) -> dict:
    """
    Kompletní kontrola kvality postu.

    Args:
        post_data: dict s caption, hashtags, image_prompt, call_to_action, atd.
        platform: "instagram" nebo "facebook"
        image_path: cesta k vygenerovanému obrázku (volitelné)
        run_ai_review: True = spustí i AI kontrolu (pomalejší, potřebuje API)

    Returns:
        dict: {
            approved: bool,
            score: float (0-10),
            issues: list[dict],       # {severity, check, message}
            ai_review: dict | None,   # AI hodnocení (pokud run_ai_review=True)
            summary: str,             # textový souhrn
        }
    """
    caption = post_data.get("caption", "")
    hashtags = post_data.get("hashtags", [])
    image_prompt = post_data.get("image_prompt", "")
    cta = post_data.get("call_to_action", "")

    # ── Vrstva 1: Rule-Based Checks ──
    issues = []
    issues.extend(_check_ai_disclosure(caption))  # KRITICKÉ — vždy první
    issues.extend(_check_caption_length(caption, platform))
    issues.extend(_check_hashtags(hashtags, platform))
    issues.extend(_check_forbidden_phrases(caption))
    issues.extend(_check_english_leaks(caption))
    issues.extend(_check_corporate_tone(caption))
    issues.extend(_check_exclamation_marks(caption))
    issues.extend(_check_emoji_count(caption))
    issues.extend(_check_cta(caption, cta))
    issues.extend(_check_hook(caption))
    issues.extend(_check_image(image_path))
    issues.extend(_check_image_prompt(image_prompt))

    # Spočítej skóre z pravidel
    errors = [i for i in issues if i["severity"] == "error"]
    warnings = [i for i in issues if i["severity"] == "warning"]
    infos = [i for i in issues if i["severity"] == "info"]

    # Rule-based skóre (10 - penalizace)
    rule_score = 10.0
    rule_score -= len(errors) * 2.0    # error = -2 body
    rule_score -= len(warnings) * 0.5  # warning = -0.5 bodu
    rule_score -= len(infos) * 0.1     # info = -0.1 bodu
    rule_score = max(0.0, min(10.0, rule_score))

    # ── Vrstva 2: AI Review ──
    ai_result = None
    if run_ai_review:
        ai_result = ai_review(post_data, platform)

    # Celkové skóre (kombinace obou vrstev)
    if ai_result and ai_result.get("overall_score", -1) > 0:
        ai_score = ai_result["overall_score"]
        # 40% pravidla + 60% AI (AI je přesnější pro kvalitu obsahu)
        final_score = round(rule_score * 0.4 + ai_score * 0.6, 1)
    else:
        final_score = round(rule_score, 1)

    # Verdikt
    has_critical_errors = len(errors) > 0
    approved = final_score >= 6.0 and not has_critical_errors

    # Textový souhrn
    if has_critical_errors:
        summary = f"BLOKOVÁNO — {len(errors)} kritických chyb musí být opraveno"
    elif final_score >= 8.0:
        summary = f"VÝBORNÉ ({final_score}/10) — post je připraven k publikaci"
    elif final_score >= 6.0:
        summary = f"SCHVÁLENO ({final_score}/10) — drobné nedostatky, ale lze publikovat"
    elif final_score >= 4.0:
        summary = f"PŘEPRACOVAT ({final_score}/10) — post potřebuje vylepšení"
    else:
        summary = f"ZAMÍTNUTO ({final_score}/10) — výrazné problémy s kvalitou"

    return {
        "approved": approved,
        "score": final_score,
        "rule_score": round(rule_score, 1),
        "ai_score": ai_result.get("overall_score", -1) if ai_result else -1,
        "issues": issues,
        "errors": len(errors),
        "warnings": len(warnings),
        "ai_review": ai_result,
        "summary": summary,
    }


# ══════════════════════════════════════════════════
# PRETTY PRINT (pro CLI)
# ══════════════════════════════════════════════════

def print_quality_report(result: dict, verbose: bool = True):
    """Vytiskne vizuální report z validate_post výsledku"""
    try:
        from rich.console import Console
        from rich.panel import Panel
        from rich.table import Table
        from rich import box
        console = Console()
    except ImportError:
        # Fallback bez rich
        print(f"\n{'='*50}")
        print(f"  QUALITY GATE: {result['summary']}")
        print(f"{'='*50}")
        for issue in result["issues"]:
            icon = {"error": "X", "warning": "!", "info": "i"}[issue["severity"]]
            print(f"  [{icon}] {issue['message']}")
        return

    # Hlavní panel
    score = result["score"]
    if score >= 8:
        color = "bold green"
        bar = "[green]" + "█" * int(score) + "░" * (10 - int(score)) + "[/green]"
    elif score >= 6:
        color = "bold yellow"
        bar = "[yellow]" + "█" * int(score) + "░" * (10 - int(score)) + "[/yellow]"
    else:
        color = "bold red"
        bar = "[red]" + "█" * int(score) + "░" * (10 - int(score)) + "[/red]"

    console.print(Panel(
        f"  {bar}  [{color}]{score}/10[/{color}]\n\n"
        f"  {result['summary']}\n"
        f"  Pravidla: {result['rule_score']}/10 | AI: {result['ai_score']}/10",
        title="[bold]QUALITY GATE[/bold]",
        border_style="cyan" if result["approved"] else "red",
    ))

    # Tabulka issues
    if result["issues"] and verbose:
        table = Table(title="Kontrolní body", box=box.SIMPLE)
        table.add_column("", width=3)
        table.add_column("Oblast", style="cyan", width=16)
        table.add_column("Nález", width=60)

        severity_icons = {
            "error": "[bold red]✗[/bold red]",
            "warning": "[yellow]⚠[/yellow]",
            "info": "[dim]ℹ[/dim]",
        }

        for issue in result["issues"]:
            table.add_row(
                severity_icons.get(issue["severity"], "?"),
                issue["check"],
                issue["message"],
            )
        console.print(table)

    # AI Review detaily
    ai = result.get("ai_review")
    if ai and ai.get("overall_score", -1) > 0 and verbose:
        # Scores tabulka
        scores = ai.get("scores", {})
        if scores:
            score_table = Table(title="AI Hodnocení (detail)", box=box.SIMPLE)
            score_table.add_column("Oblast", style="cyan")
            score_table.add_column("Skóre", justify="center")
            score_table.add_column("Vizuál")

            area_names = {
                "hook": "Hook síla",
                "brand_voice": "Brand voice",
                "value": "Hodnota",
                "language": "Jazyk",
                "engagement": "Engagement",
                "image_prompt": "Image prompt",
                "hashtags": "Hashtags",
            }

            for key, label in area_names.items():
                s = scores.get(key, 0)
                bar_color = "green" if s >= 7 else "yellow" if s >= 5 else "red"
                mini_bar = f"[{bar_color}]{'█' * s}{'░' * (10 - s)}[/{bar_color}]"
                score_table.add_row(label, str(s), mini_bar)

            console.print(score_table)

        # Silné stránky
        strengths = ai.get("strengths", [])
        if strengths:
            console.print("\n[green]✓ Silné stránky:[/green]")
            for s in strengths:
                console.print(f"  [green]•[/green] {s}")

        # Vylepšení
        improvements = ai.get("improvements", [])
        if improvements:
            console.print("\n[yellow]→ Návrhy na zlepšení:[/yellow]")
            for s in improvements:
                console.print(f"  [yellow]•[/yellow] {s}")

        # Přepsaný caption
        rewritten = ai.get("rewritten_caption")
        if rewritten:
            console.print(Panel(
                rewritten,
                title="[bold magenta]AI Návrh vylepšeného caption[/bold magenta]",
                border_style="magenta",
            ))

    # Verdikt
    if result["approved"]:
        console.print("\n[bold green]✓ POST SCHVÁLEN — připraven k uložení/publikaci[/bold green]")
    else:
        console.print("\n[bold red]✗ POST NESCHVÁLEN — opravte chyby výše[/bold red]")


# ══════════════════════════════════════════════════
# CLI TEST
# ══════════════════════════════════════════════════

if __name__ == "__main__":
    # Test s ukázkovým postem
    test_post = {
        "caption": (
            "Věděla jsi, že tvoje číslo životní cesty ovlivňuje, "
            "jaké krystaly ti budou nejlépe rezonovat?\n\n"
            "Číslo 7 — introspektivní hledač pravdy — si skvěle rozumí "
            "s ametystem. Obě energie táhnou dovnitř, k tichému poznání.\n\n"
            "Číslo 3 — tvořivý optimista — potřebuje citrín. "
            "Zesilovač radosti a kreativity, přesně to, co trojka hledá.\n\n"
            "A co tvoje číslo? Napiš ho do komentáře a já ti poradím tvůj krystal ✨"
        ),
        "hashtags": [
            "#numerologie", "#krystaly", "#cislozivotnícesty",
            "#ametyst", "#citrin", "#mystickahvezda",
            "#duchovnost", "#energie",
        ],
        "image_prompt": (
            "Mystical flat lay of numbered crystals on dark velvet, "
            "amethyst and citrine glowing softly, golden number symbols floating, "
            "deep indigo and gold color palette, soft candlelight, "
            "ethereal atmosphere, high quality product photography"
        ),
        "call_to_action": "Napiš své číslo životní cesty do komentáře",
        "topic": "numerologie a krystaly",
        "post_type": "educational",
    }

    print("Spouštím Quality Gate test...\n")
    result = validate_post(
        post_data=test_post,
        platform="instagram",
        run_ai_review=False,  # True pokud máš GEMINI_API_KEY
    )
    print_quality_report(result)
