"""
Quality Gate — dvouvrstvá kontrola kvality výstupu agenta.

Vrstva 1: rychlá kontrola prázdného textu, zjevných klišé, pravopisu hashtagů a technických problémů.

Vrstva 2: volitelná editorská kontrola s konkrétní zpětnou vazbou. CTA, hashtagy, emoji ani délka nejsou povinné.

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

# Přesná klišé, která mohou být užitečným upozorněním; nejde o automatický zákaz.
FORBIDDEN_PHRASES = [
    "vesmír ti posílá znamení",
    "otevři se nové energii",
    "všechno se děje z nějakého důvodu",
    "dovol si zazářit",
    "objev svůj potenciál",
    "tvoje cesta začíná právě teď",
    "nenech si ujít tuto jedinečnou příležitost",
]

# Několik reklamních frází, jejichž angličtina obvykle do českého textu nezapadá.
ENGLISH_LEAKS = [
    "click here", "swipe up", "tap the link", "don't miss",
    "limited time", "act now", "game changer", "life changing",
]

# Frázové vzorce, které jsou příliš "reklamní" / korporátní
CORPORATE_PATTERNS = [
    r"jedinečn(?:á|é|ou)\s+nabídk[ayu]",
    r"kupte?\s+(?:nyní|teď)(?:\s+se\s+slevou)?",
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

# ══════════════════════════════════════════════════
# VRSTVA 1: RULE-BASED CHECKS
# ══════════════════════════════════════════════════

def _check_caption_length(caption: str, platform: str) -> list[dict]:
    """Povolí krátké i delší texty; kontroluje jen prázdný výstup."""
    if caption.strip():
        return []
    return [{
        "severity": "error",
        "check": "caption_length",
        "message": "Caption je prázdný.",
    }]


def _check_hashtags(hashtags: list, platform: str) -> list[dict]:
    """Hashtagy jsou volitelné; kontroluje se jen jejich zápis a duplicity."""
    issues = []

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
                "severity": "warning",
                "check": "brand_voice",
                "message": f"Zvaž konkrétnější formulaci místo klišé „{phrase}“.",
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


def _check_boilerplate_intro(caption: str) -> list[dict]:
    """Upozorní jen na několik generických úvodů; krátký úvod není chyba."""
    lines = caption.strip().split("\n")
    first_line = lines[0].strip().lower() if lines else ""
    weak_starts = ("dnes se podíváme na", "dnes bychom si řekli", "vítej u dalšího")
    for phrase in weak_starts:
        if first_line.startswith(phrase):
            return [{
                "severity": "warning",
                "check": "boilerplate_intro",
                "message": "Úvod působí jako obecná šablona; zvaž začít konkrétním detailem.",
            }]
    return []


def _check_image(image_path: Optional[str | Path]) -> list[dict]:
    """Ověří připojený soubor; vzhled, jas a poměr stran posuzuje člověk podle umístění."""
    if not image_path:
        return []

    path = Path(image_path)
    if not path.exists():
        return [{
            "severity": "error",
            "check": "image",
            "message": f"Připojený obrázek neexistuje: {path.name}",
        }]

    if path.stat().st_size == 0:
        return [{
            "severity": "error",
            "check": "image",
            "message": f"Soubor obrázku je prázdný: {path.name}",
        }]

    valid_formats = {".jpg", ".jpeg", ".png", ".webp"}
    if path.suffix.lower() not in valid_formats:
        return [{
            "severity": "error",
            "check": "image",
            "message": f"Nepodporovaná přípona souboru: {path.suffix}",
        }]

    if HAS_PIL:
        try:
            with Image.open(path) as image:
                image.verify()
        except Exception as exc:
            return [{
                "severity": "error",
                "check": "image",
                "message": f"Soubor nejde otevřít jako obrázek: {exc}",
            }]
    return []


def _check_image_prompt(image_prompt: str) -> list[dict]:
    """Vizuální směr je volitelný a nemá předepsaný styl."""
    if not image_prompt or not image_prompt.strip():
        return []
    if re.search(r"\[(?:doplň|prompt|téma|subject|style)\]", image_prompt, re.IGNORECASE):
        return [{
            "severity": "warning",
            "check": "image_prompt",
            "message": "Image prompt obsahuje nevyplněný placeholder.",
        }]
    return []


# ══════════════════════════════════════════════════
# VRSTVA 2: AI REVIEW
# ══════════════════════════════════════════════════


def ai_review(post_data: dict, platform: str = "instagram") -> dict:
    """
    Hloubková AI kontrola kvality pomocí GPT-6 Luna.
    Vrací skóre 1-10 a konkrétní návrhy na zlepšení.

    Returns:
        dict: {score, verdict, strengths, improvements, rewritten_caption}
    """
    try:
        from generators.text_generator import setup_openai, _call_openai, _parse_json_response
    except ImportError as e:
        return {
            "score": -1,
            "verdict": f"AI review nedostupné: {e}",
            "strengths": [],
            "improvements": [],
            "rewritten_caption": None,
        }

    client, model_name = setup_openai(use_fast=True)

    caption = post_data.get("caption", "")
    hashtags = post_data.get("hashtags", [])
    image_prompt = post_data.get("image_prompt", "")
    topic = post_data.get("topic", "")
    post_type = post_data.get("post_type", "")

    prompt = f"""Jsi pečlivý český editor značky Mystická Hvězda. Zkontroluj tento návrh podle tématu a cílové platformy.

TÉMA: {topic}
FORMÁT: {post_type}
PLATFORMA: {platform}
TEXT:
{caption}
HASHTAGY (pokud nějaké): {' '.join(hashtags)}
VIZUÁLNÍ SMĚR (pokud je dodán): {image_prompt}

Zaměř se na:
1. Přirozenou, konkrétní češtinu a vlastní hlas značky: vřelý, klidný, obrazný jen když obraz pomáhá.
2. Jednu jasnou myšlenku, čitelnost a rytmus odpovídající formátu.
3. Pravdivost: žádné vymyšlené osobní zkušenosti, reference, výsledky, URL, vlastnosti služby nebo jisté předpovědi.
4. Originalitu: text nemá působit jako obecná motivační šablona ani kopie ukázky.

Neodečítej body za krátký text, chybějící otázku, CTA, hashtagy, emoji ani za jiný vizuální styl. Hodnoť jen prvky, které návrh skutečně potřebuje. U astrologie/tarotu ber symbolický jazyk jako reflexi, ne jako důkaz či jistotu.

Vrať JSON s klíči overall_score (1–10), verdict, strengths (seznam), improvements (seznam) a rewritten_caption (null, pokud není nutná konkrétní oprava; jinak úplný přepis). Přepisuj jen při věcné nebo jasné stylistické vadě, ne kvůli osobní preferenci.
"""

    try:
        response = _call_openai(client, model_name, prompt, temperature=0.3, max_tokens=1024)
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
    # ── Vrstva 1: Rule-Based Checks ──
    issues = []
    issues.extend(_check_caption_length(caption, platform))
    issues.extend(_check_hashtags(hashtags, platform))
    issues.extend(_check_forbidden_phrases(caption))
    issues.extend(_check_english_leaks(caption))
    issues.extend(_check_corporate_tone(caption))
    issues.extend(_check_boilerplate_intro(caption))
    issues.extend(_check_image(image_path))
    issues.extend(_check_image_prompt(image_prompt))

    # Spočítej skóre z pravidel
    errors = [i for i in issues if i["severity"] == "error"]
    warnings = [i for i in issues if i["severity"] == "warning"]
    infos = [i for i in issues if i["severity"] == "info"]

    # Rule-based skóre (10 - vážené penalizace)
    rule_score = 10.0
    rule_score -= len(errors) * 2.0    # error = -2 body

    # Varování mají různou váhu podle důležitosti
    HIGH_IMPACT_CHECKS = {"brand_voice", "ai_disclosure"}
    for w in warnings:
        check = w.get("check", "")
        if check in HIGH_IMPACT_CHECKS:
            rule_score -= 1.0   # skutečná chyba hlasu nebo disclosure
        else:
            rule_score -= 0.3   # ostatní = -0.3

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
                "brand_voice": "Hlas značky",
                "value": "Přínos pro čtenáře",
                "language": "Jazyk",
                "image_prompt": "Vizuální směr",
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
    # Lokální příklad redakční kontroly; bez vymyšlené personalizace nebo povinné CTA.
    test_post = {
        "caption": (
            "Tarotová karta nemusí předpovídat, co se stane. Může posloužit jako "
            "podnět k otázce: co v téhle situaci přehlížím, protože už hledám "
            "jediné správné řešení? Výklad pak začíná tím, co v kartě skutečně "
            "vidíš a jak to souvisí s tím, co právě řešíš."
        ),
        "hashtags": [],
        "image_prompt": "",
        "call_to_action": "",
        "topic": "tarot jako nástroj k zamyšlení",
        "post_type": "educational",
    }

    print("Spouštím Quality Gate test...\n")
    result = validate_post(
        post_data=test_post,
        platform="instagram",
        run_ai_review=False,
    )
    print_quality_report(result)
