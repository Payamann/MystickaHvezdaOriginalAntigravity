"""
Text Generator — návrhy obsahu a odpovědí pro Mystickou Hvězdu.
Zachovává přirozený český hlas, ověřené informace a redakční kontrolu člověkem.
"""
import json
import re
import time
from typing import Optional
import sys
from pathlib import Path

from openai import OpenAI

sys.path.insert(0, str(Path(__file__).parent.parent))
import config
from generators.lunar_context import get_full_astrological_context
from generators.content_memory import get_variety_context
from brand_knowledge import build_knowledge_prompt, get_blog_summary_for_prompt
from comment_cost import record_comment_reply_usage, usage_to_dict
from comment_policy import should_offer_comment_link, sanitize_reply_links
from logger import get_logger

log = get_logger(__name__)
_SOCIAL_ALLOWED_TOOL_URLS = set(config.PROMOTABLE_TOOLS.values())


# ============================================================
# BRAND VOICE — SRDCE CELÉHO AGENTA
# ============================================================

BRAND_VOICE = """
Mystická Hvězda mluví česky, přirozeně a k věci. Čtenáři tyká.

HLAS ZNAČKY
- Vřelý, klidný a všímavý; obrazný jen tam, kde obraz něco objasní.
- Mluví vedle čtenáře, ne z pozice guru. Nehraje si na osobní kamarádku ani věštkyni.
- Opírá se o jednu konkrétní otázku, detail nebo myšlenku. Rytmus i délka se řídí obsahem.
- Zní jako člověk, který ví, co chce říct, a nemusí čtenáře přesvědčovat o každé větě.
- Tykání neznamená oslovovat čtenáře v každé větě. Nepřeháněj řečnické otázky, jednovětné odstavce ani mystické obrazy pro efekt.

PŘIROZENÁ ČEŠTINA
- Piš současnou, idiomatickou češtinou. Vynech doslovné překlady z angličtiny, reklamní výplň a naučené motivační fráze.
- Nepoužívej lomené rodové tvary. Větu přeformuluj jen tehdy, když to zní přirozeně; kvůli neutralitě nevyráběj kostrbaté obraty.
- Nepředstírej vlastní zážitky, zákaznické příběhy, citace, výsledky ani lidskou konzultaci.
- Neopakuj vzorce z příkladů. Příklady jsou jen ukázkou střídmosti a konkrétnosti.

DŮVĚRA A PŘESNOST
- Tarot, astrologii a numerologii popisuj jako symbolické rámce k zamyšlení, ne jako důkaz, diagnózu nebo jistou předpověď.
- Nevyvozuj z karet či hvězd, co si myslí jiný člověk, a netvrď, že rituál léčí nebo zaručuje výsledek.
- Nevymýšlej astrologická data, výpočty, vlastnosti nástrojů, URL, cenu, slevu, recenzi ani naléhavost. Když zdroj chybí, tvrzení vynech.
- Automaticky vytvářený výklad nevydávej za osobní práci člověka. Pokud se někdo přímo zeptá na AI či automatizaci, odpověz pravdivě.

CO VYNECHAT
- Prázdné úvody typu „Dnes se podíváme na…“ a závěry typu „A to je tvoje znamení“.
- Všudypřítomné „vesmír ti posílá znamení“, „otevři se nové energii“, „všechno má svůj důvod“ a podobné fráze bez konkrétního významu.
- Povinný hook, otázku, CTA, emoji, hashtagy, promo, seznam tipů ani dramatický obrat. Použij je jen tehdy, když je potřebuje zadání a opravdu sedí.
- Falešnou naléhavost, strach, žárlivost, engagement bait a tvrzení o dosahu nebo algoritmu bez podkladů.
"""

FORMATTING_RULES = """
FORMÁTOVÁNÍ
- Přizpůsob text skutečně požadovanému místu: běžný Facebook příspěvek, Reel, Stories a carousel mají jiné potřeby.
- Použij přirozené odstavce a interpunkci. Hook nemusí být samostatný řádek; emoji ani prázdné řádky nejsou povinné.
- Nezkracuj myšlenku kvůli nepodloženému limitu znaků nebo slov. U technického limitu ověř aktuální rozhraní platformy.
- Hashtagy a CTA jsou volitelné. Když nepřidají hodnotu, vrať prázdný seznam nebo text.
- Zachovej autorský text odděleně od metadat a image promptu.
"""

# ============================================================
# SETUP
# ============================================================

# Statické instrukce sdílené všemi generate funkcemi.
_BRAND_SYSTEM = BRAND_VOICE + "\n\n" + FORMATTING_RULES

# Singleton — jeden OpenAI klient pro celou session
_openai_client: OpenAI | None = None

def setup_openai(use_pro: bool = False, use_fast: bool = False):
    """Inicializuje OpenAI klienta; role fast/standard/pro zachovává kvůli API volajícím."""
    global _openai_client
    if not config.OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY není nastaven v .env souboru!")
    if _openai_client is None:
        _openai_client = OpenAI(api_key=config.OPENAI_API_KEY)
    if use_fast:
        model_name = config.TEXT_MODEL_FAST
    elif use_pro:
        model_name = config.TEXT_MODEL_PRO
    else:
        model_name = config.TEXT_MODEL
    return _openai_client, model_name


def _system_text(system) -> str:
    """Převede dřívější seznam systémových bloků na instrukce pro Responses API."""
    if system is None:
        system = _BRAND_SYSTEM
    if isinstance(system, str):
        return system
    if isinstance(system, (list, tuple)):
        return "\n\n".join(
            str(block.get("text", "")) if isinstance(block, dict) else str(block)
            for block in system
            if block
        )
    return str(system)


def _call_openai(
    client: OpenAI,
    model: str,
    contents: str,
    temperature: float = 0.8,
    max_tokens: int = 2048,
    max_retries: int = 3,
    system: str | list | None = None,
):
    """
    Volá OpenAI Responses API s GPT-6 Luna a automatickým retry při dočasných chybách.
    Zachovává rozhraní .text/.usage/.model, které používají generátory a logování.
    """
    class _Response:
        def __init__(self, text: str, usage=None, model: str | None = None):
            self.text = text
            self.usage = usage
            self.model = model

    instructions = _system_text(system)
    # U reasoning effort != none API nepřijímá temperature. Původní volající ji
    # stále předávají, ale záměrně ji neposíláme.
    del temperature
    output_budget = max(int(max_tokens or 0), config.TEXT_MAX_OUTPUT_TOKENS)

    for attempt in range(max_retries):
        try:
            response = client.responses.create(
                model=model,
                reasoning={"effort": config.TEXT_REASONING_EFFORT},
                instructions=instructions,
                input=contents,
                max_output_tokens=output_budget,
            )
            if getattr(response, "status", None) == "incomplete":
                details = getattr(response, "incomplete_details", None)
                reason = getattr(details, "reason", "neznámý důvod")
                raise RuntimeError(f"OpenAI Responses API dokončilo odpověď neúplně: {reason}")
            response_text = getattr(response, "output_text", "") or ""
            if not response_text.strip():
                raise RuntimeError("OpenAI Responses API vrátilo prázdný textový výstup")
            return _Response(response_text, usage=getattr(response, "usage", None), model=model)
        except Exception as e:
            error_msg = str(e).lower()
            retriable = any(kw in error_msg for kw in [
                "408", "409", "429", "rate", "quota", "500", "502", "503", "504",
                "timeout", "temporarily unavailable", "overloaded", "connection error",
            ])
            if retriable and attempt < max_retries - 1:
                wait = 2 ** (attempt + 1)
                log.info("OpenAI API dočasná chyba, retry za %ds... (%d/%d)", wait, attempt + 1, max_retries)
                time.sleep(wait)
            else:
                raise


def _parse_json_response(text: str) -> Optional[dict]:
    """Robustní parsování JSON z odpovědi modelu"""
    text = text.strip()

    # Odstraň markdown code bloky
    text = re.sub(r'```json\s*', '', text)
    text = re.sub(r'```\s*', '', text)

    # Pokus 1: celý text jako JSON
    try:
        return json.loads(text)
    except (json.JSONDecodeError, ValueError, TypeError):
        pass

    # Pokus 2: najdi JSON objekt
    match = re.search(r'\{[\s\S]*\}', text)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass

    # Pokus 3: oprav běžné chyby v JSON (neescapované newlines v hodnotách)
    try:
        # Nahraď skutečné newlines uvnitř stringů za \n
        fixed = re.sub(r'(?<=": ")(.*?)(?="[,\}])', lambda m: m.group().replace('\n', '\\n'), text, flags=re.DOTALL)
        return json.loads(fixed)
    except (json.JSONDecodeError, ValueError, TypeError):
        pass

    return None


# ============================================================
# HLAVNÍ FUNKCE: GENEROVÁNÍ POSTU
# ============================================================

def generate_post(
    post_type: str,
    topic: str,
    platform: str = "instagram",
    blog_url: Optional[str] = None,
    blog_title: Optional[str] = None,
    extra_context: Optional[str] = None,
    use_astro_context: bool = True,
    variations: int = 1,
    content_intent: Optional[str] = None,
) -> dict:
    """
    Generuje kompletní post pro sociální sítě.

    Args:
        post_type: educational | quote | question | tip | blog_promo | daily_energy |
                   daily_check_in | myth_bust | story | challenge | carousel_plan
        topic: téma postu
        platform: instagram | facebook
        blog_url: URL blogu (pro blog_promo)
        blog_title: název článku
        extra_context: dodatečný kontext
        use_astro_context: zda vložit do promptu aktuální astro kontext
        variations: kolik verzí vygenerovat (1-3)
        content_intent: pure_value | soft_promo | direct_promo
                        None = pure_value, kromě výslovně zadaného blog_promo

    Returns:
        dict nebo list[dict] (pokud variations > 1)
    """
    # Promo nikdy nevzniká jen z historického procenta; bez zadání tvoříme hodnotný post.
    if content_intent is None:
        content_intent = "direct_promo" if post_type == "blog_promo" else "pure_value"
    client, model_name = setup_openai()

    # Astrologický kontext
    astro_section = ""
    if use_astro_context:
        try:
            astro = get_full_astrological_context()

            astro_section = f"""
Aktuální symbolický kontext (použij pouze tehdy, když se hodí k tématu):
{astro['content_brief']}
Fáze Měsíce: {astro['moon']['phase_cs']}
Nejde o vědeckou příčinu ani jistou předpověď; nepřidávej žádný další výklad.
"""
        except Exception as e:
            log.warning("Astro kontext nedostupný, post bude bez astrologického kontextu: %s", e)

    # Anti-repetition kontext
    variety = get_variety_context(platform=platform)
    # Historie se používá až níže jako jemná kontrola podobnosti formulací.

    # Blog sekce — s deep read pokud je k dispozici
    blog_section = ""
    if blog_url and blog_title:
        # Deep read: přečti skutečný obsah článku
        blog_deep = ""
        if post_type == "blog_promo":
            try:
                from brand_knowledge import get_blog_deep_context
                # Extrahuj slug z URL
                import re as _re
                slug_match = _re.search(r'/blog/([\w-]+)\.html', blog_url)
                if slug_match:
                    blog_deep = get_blog_deep_context(slug_match.group(1), blog_title)
            except Exception:
                pass  # fallback na základní info

        if blog_deep:
            blog_section = blog_deep
        else:
            blog_section = f"""
BLOG ČLÁNEK K PROPAGACI:
Název: {blog_title}
URL: {blog_url}
Popis: {extra_context or ''}
Podklad je určen jen pro záměr promo. Vysvětli věcně, proč může být článek relevantní.
Nevyráběj clickbait ani tvrzení, která v článku nejsou. Použij pouze uvedenou URL a jen tehdy,
když promo výslovně patří k zadání.
"""

    # Znalostní báze — jen relevantní info podle intentu (šetří tokeny, zlepšuje fokus)
    if content_intent == "pure_value":
        # Vzdělávací post — nepotřebuje ceník ani nástroje
        knowledge_section = build_knowledge_prompt(
            include_tools=False,
            include_pricing=False,
            include_blog=False,
            include_usp=False,
            compact=True,
        )
    elif content_intent == "soft_promo":
        # Soft promo — jen relevantní nástroj a blog, bez ceníku
        knowledge_section = build_knowledge_prompt(
            include_tools=True,
            include_pricing=False,
            include_blog=True,
            include_usp=False,
            compact=True,
            allowed_tool_urls=_SOCIAL_ALLOWED_TOOL_URLS,
        )
    else:  # direct_promo
        # Plná propagace — vše relevantní
        knowledge_section = build_knowledge_prompt(
            include_tools=True,
            include_pricing=False,
            include_blog=True,
            include_usp=False,
            compact=True,
            allowed_tool_urls=_SOCIAL_ALLOWED_TOOL_URLS,
        )

    # Nedávné captiony slouží jako kontrola podobnosti, ne jako vzor k napodobení.
    recent_examples = "\n".join(
        f"- {caption[:180]}" for caption in variety.get("recent_captions", [])[-5:] if caption
    ) or "(v paměti nejsou nedávné texty)"
    performance_context = variety.get("performance_context", "") or ""
    variation_rule = (
        f"Vrať přesně {variations} odlišné návrhy s různým úhlem nebo formou; neopakuj stejný text v synonymních obměnách."
        if variations > 1 else "Vrať jeden hotový návrh."
    )
    prompt = f"""Napiš obsah pro Mystickou Hvězdu.

ZADÁNÍ
Platforma: {platform}
Téma: {topic}
Formátový hint: {post_type}. Ber ho jen jako vodítko, ne jako povinnou osnovu.
Záměr: {content_intent}
{variation_rule}

KONTEXT PRODUKTU
{knowledge_section}

DODANÝ KONTEXT
{extra_context or "(žádný)"}

OVĚŘENÉ PODKLADY K ČLÁNKU / NÁSTROJI
{blog_section or "(žádné zvláštní podklady)"}

MOŽNÝ ASTROLOGICKÝ KONTEXT
{astro_section or "Není k dispozici nebo nebyl vyžádán. Nic aktuálního si nevymýšlej."}

HLAS A KVALITA
{BRAND_VOICE}
{FORMATTING_RULES}
- Postav text na jedné konkrétní myšlence, ne na seznamu naučených marketingových triků.
- Zvol přirozený začátek podle tématu. Ne každý text potřebuje hook, příběh, otázku nebo pointu v odděleném řádku.
- Napiš jen to, co lze opřít o téma a dodaný kontext. Nedoplňuj vymyšlenou ukázku, číslo, výsledek, citaci, recenzi ani osobní zážitek.
- U širokého tématu si vyber svěží detail nebo užitečné rozlišení. Nekopíruj starší formulace.
- Nedělej z astrologie, tarotu ani numerologie jistou příčinu nebo předpověď. Pokud se symbolický kontext nehodí, úplně ho vynech.
- Při záměru pure_value nepřidávej produkt, nabídku ani URL. U promo záměru propaguj pouze funkci a adresu doloženou v kontextu; nevkládej prodejní větu násilím.
- Přidej CTA pouze tehdy, když čtenáři přirozeně pomůže pokračovat. Bez smysluplné výzvy vrať prázdný text.
- Hashtagy jsou nepovinné. Pokud nebyly výslovně požadovány a nepomáhají tomuto konkrétnímu umístění, vrať [].
- Vizuální směr navrhni podle hlavní myšlenky. Noční modrá, tlumená fialová a měkké zlato jsou možné akcenty značky, ne povinná paleta. Střídej médium, kompozici, texturu a měřítko. Neopakuj automaticky hvězdné pozadí, krystal, kartu, centrální 3D předmět ani rámeček.
- Image prompt napiš anglicky, stručně a konkrétně. Neuváděj rozměry ani poměr stran, pokud je zadání neurčuje. Žádný text, logo ani watermark v obrázku, pokud o ně uživatel nepožádal.

Nedávné captiony jsou jen pro kontrolu shodného úhlu. Nekopíruj z nich obraty, metafory, začátky, délku odstavců ani jejich rytmus:
{recent_examples}

VÝSLEDKY ZVEŘEJNĚNÉHO OBSAHU (jen srovnatelná měření, popisný signál):
{performance_context or "Zatím není dost srovnatelných měření. Výsledky neodhaduj."}
Nepřizpůsobuj nový příspěvek mechanicky číslům. Výsledek může být ovlivněný tématem, dosahem, časem i propagací.

VRAŤ POUZE PLATNÝ JSON. Nikdy nevkládej JSON příklad do captionu.
Při jedné verzi použij tvar:
{{
  "caption": "hotový text",
  "hashtags": [],
  "image_prompt": "konkrétní obrazová režie v angličtině, nebo prázdný řetězec",
  "call_to_action": "přirozená CTA, nebo prázdný řetězec"
}}
Při více verzích vrať pole variations s objekty caption, pole hashtags, image_prompt, call_to_action a recommended_variation.
"""

    response = _call_openai(client, model_name, prompt, temperature=0.8)

    result = _parse_json_response(response.text)

    if result is None:
        # Fallback — pokus vytáhnout caption z odpovědi i přes nefunkční JSON
        raw = response.text.strip()
        caption_match = re.search(r'"caption"\s*:\s*"([\s\S]*?)(?:"\s*[,\}])', raw)
        if caption_match:
            fallback_caption = caption_match.group(1).replace('\\n', '\n').strip()
        else:
            # Odstraň JSON wrapper a použij čistý text
            fallback_caption = re.sub(r'^\s*\{\s*"caption"\s*:\s*"?', '', raw)
            fallback_caption = re.sub(r'"?\s*[,\}]\s*"hashtags"[\s\S]*$', '', fallback_caption)
            fallback_caption = fallback_caption.replace('\\n', '\n').strip()[:500]

        log.warning("JSON parsing selhal, používám fallback extrakci caption")
        result = {
            "caption": fallback_caption or raw[:500],
            "hashtags": [],
            "image_prompt": "",
            "call_to_action": "",
            "hook_formula": "",
        }

    # Vždy přidej content_intent do výsledku (pro agent.py a post_saver)
    result["content_intent"] = content_intent
    result["hook_formula"] = ""  # historické pole zachováváme kvůli kompatibilitě starších záznamů

    # ── Grammar check — automatická oprava češtiny ──
    caption_raw = result.get("caption", "")
    if caption_raw:
        gc = grammar_check_post(caption_raw, client=client, model_name=model_name)
        if gc["had_errors"]:
            result["caption"] = gc["corrected"]
            result["grammar_changes"] = gc["changes"]
            log.info("Grammar check: opraveno %d chyb — %s", len(gc["changes"]), gc["changes"])
        else:
            result["grammar_changes"] = []

    return result


# ============================================================
# GRAMMAR CHECK — kontrola češtiny po generování
# ============================================================

def grammar_check_post(caption: str, client=None, model_name: str = None) -> dict:
    """
    Zkontroluje a opraví gramatiku a pravopis českého caption.

    Returns:
        {
            "corrected": str,       # opravený text (nebo originál pokud bez chyb)
            "changes": list[str],   # popis provedených změn
            "had_errors": bool,     # True pokud byly nalezeny chyby
        }
    """
    if client is None:
        client, model_name = setup_openai()
    if model_name is None:
        model_name = config.TEXT_MODEL

    prompt = f"""Jsi korektor současné češtiny. Oprav jen pravopis, interpunkci a jednoznačné gramatické chyby. Zachovej význam, rytmus, slovník i hlas autora. Nevylepšuj styl podle vlastní preference a nic nepřidávej.

Nevynucuj konkrétní délku vět, přítomný čas ani rodové přeformulování. Lomené tvary s lomítkem nepoužívej; případný problém oprav jen přirozeně, bez kostrbaté věty. Když si nejsi jistý, text ponech.

TEXT:
---
{caption}
---

Vrať pouze JSON: {{"corrected": "text", "changes": [], "had_errors": false}}. Pokud nic jednoznačně chybného nenajdeš, vrať text beze změny a prázdný seznam změn.
"""

    try:
        response = _call_openai(client, model_name, prompt, temperature=0.1, max_tokens=512)
        result = _parse_json_response(response.text)
        if result and "corrected" in result:
            return {
                "corrected": result.get("corrected", caption),
                "changes": result.get("changes", []),
                "had_errors": result.get("had_errors", False),
            }
    except Exception as e:
        log.warning("Grammar check selhal: %s", e)

    # Fallback — vrať originál
    return {"corrected": caption, "changes": [], "had_errors": False}


# ============================================================
# SELF-REFINEMENT — vylepšení postu na základě QG zpětné vazby
# ============================================================

def refine_post(
    post_data: dict,
    qg_result: dict,
    topic: str,
    post_type: str,
    platform: str = "instagram",
    iteration: int = 1,
) -> dict:
    """
    Vezme existující post + zpětnou vazbu z Quality Gate a vygeneruje
    vylepšenou verzi cíleně opravující nalezené problémy.

    Args:
        post_data:  aktuální post (caption, hashtags, image_prompt, ...)
        qg_result:  výsledek z validate_post() — obsahuje issues a ai_review
        topic:      téma postu
        post_type:  typ postu
        platform:   instagram | facebook
        iteration:  číslo iterace (1 nebo 2) — pro logging

    Returns:
        dict: vylepšený post (stejná struktura jako generate_post)
    """
    client, model_name = setup_openai()
    platform_info = config.PLATFORM_SETTINGS.get(platform, config.PLATFORM_SETTINGS["instagram"])

    original_caption = post_data.get("caption", "")
    original_hashtags = post_data.get("hashtags", [])
    original_image_prompt = post_data.get("image_prompt", "")
    content_intent = post_data.get("content_intent", "pure_value")

    # ── Sestavení přesné zpětné vazby z QG ──
    rule_issues = []
    for issue in qg_result.get("issues", []):
        sev = issue.get("severity", "info")
        msg = issue.get("message", "")
        if sev == "error":
            rule_issues.append(f"  [{sev.upper()}] {msg}")

    # Zachovej záměr i věcný obsah; nepřidávej nové prodejní prvky.
    if content_intent == "pure_value":
        intent_instruction = "Jde o obsah bez propagace. Nepřidávej produkt, nabídku ani URL."
    elif content_intent == "soft_promo":
        intent_instruction = "Jemné pozvání je volitelné. Zachovej jen ověřený odkaz, který už byl v návrhu a opravdu navazuje."
    else:
        intent_instruction = "Zachovej jen doloženou propagaci z původního návrhu. Nevymýšlej vlastnosti, ceny ani URL."

    refinement_prompt = f"""━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ÚKOL: VYLEPŠENÍ EXISTUJÍCÍHO POSTU (iterace {iteration})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Téma: {topic}
Typ postu: {post_type}
Platforma: {platform.upper()}

═══ PŮVODNÍ POST ═══
CAPTION:
{original_caption}

HASHTAGS: {' '.join(original_hashtags)}
IMAGE PROMPT: {original_image_prompt}
════════════════════

═══ KONKRÉTNÍ PROBLÉMY K OPRAVENÍ ═══
{chr(10).join(rule_issues) if rule_issues else "  Žádná konkrétní chyba"}
═════════════════════════════════════

PRAVIDLA PRO VYLEPŠENÍ:
1. Zachovej téma, záměr, fakta i případný autorský tón.
2. Oprav pouze výše uvedené konkrétní chyby. Zbytek textu ponech co nejvíc beze změny; nepřepisuj styl ani rytmus podle vlastního vkusu.
3. Nevymýšlej příklady, zkušenosti, fakta, vlastnosti služby ani URL.
4. Nepřidávej hook, otázku, CTA, hashtagy ani emoji, pokud to není součást konkrétní opravy.
5. Zachovej přiměřenou délku a čitelnost pro zvolenou platformu; žádný pevný počet slov.
6. {intent_instruction}

Odpověz STRIKTNĚ jako JSON:
{{
  "caption": "nový vylepšený text...",
  "hashtags": [],
  "image_prompt": "ponech původní nebo dolaď jen při konkrétní připomínce; jinak prázdný řetězec",
  "call_to_action": "ponech původní nebo prázdný řetězec",
  "refinement_changes": "stručně co a proč bylo změněno (1-2 věty)"
}}"""

    response = _call_openai(client, model_name, refinement_prompt, temperature=0.75)

    result = _parse_json_response(response.text)

    if result is None:
        log.warning("Refinement iterace %d: nepodařilo se parsovat odpověď, vracím původní", iteration)
        return post_data

    # Zachovej content_intent a přidej refinement metadata
    result["content_intent"] = content_intent
    result["hook_formula"] = post_data.get("hook_formula", "")
    result["refined"] = True
    result["refinement_iteration"] = iteration
    result["refinement_changes"] = result.get("refinement_changes", "")
    log.info("Refinement iterace %d dokončena. Změny: %s", iteration, result.get("refinement_changes", ""))
    return result


# ============================================================
# STORIES GENERÁTOR
# ============================================================

def generate_story_sequence(
    topic: str,
    story_count: int = 5,
) -> list[dict]:
    """
    Generuje sérii Instagram Stories (5-7 slidů) pro dané téma.
    Stories jsou jiný formát než feed posty — kratší, dynamičtější, interaktivnější.
    """
    client, model_name = setup_openai()

    astro_context = ""
    try:
        astro = get_full_astrological_context()
        astro_context = astro.get("content_brief", "")
    except Exception:
        log.info("Aktuální astrologický kontext pro stories není k dispozici.")

    prompt = f"""Připrav sérii {story_count} Instagram Stories k tématu: {topic}

Piš v přirozeném hlasu Mystické Hvězdy:
{BRAND_VOICE}

Základní kontext
- Téma: {topic}
- Astrologická poznámka (jen pokud se opravdu hodí; symbolický rámec, ne jistota): {astro_context or "není k dispozici"}

Každý slide má nést jednu srozumitelnou myšlenku a být čitelný na telefonu. Střídej rytmus podle obsahu; nevyráběj umělé cliffhangery. Hlasování, otázka, odkaz nebo výzva jsou volitelné a patří jen tam, kde dávají smysl. Nevymýšlej osobní příběh, výsledky ani astrologická data. Vizuální nápad odvoď od konkrétního sdělení, ne z opakované kosmické šablony.

Vrať JSON pole přesně {story_count} položek:
[
  {{
    "slide": 1,
    "type": "info|reflection|question|poll|example|closing",
    "text": "stručný český text pro slide",
    "visual": "konkrétní vizuální směr v angličtině",
    "interactive": null,
    "sticker_suggestion": null
  }}
]"""

    response = _call_openai(client, model_name, prompt, max_tokens=1024)

    text = response.text.strip()
    text = re.sub(r'```json\s*', '', text)
    text = re.sub(r'```\s*', '', text)

    match = re.search(r'\[[\s\S]*\]', text)
    if match:
        try:
            return json.loads(match.group())
        except (json.JSONDecodeError, ValueError):
            pass

    return []


# ============================================================
# CAROUSEL GENERÁTOR
# ============================================================

def generate_carousel(
    topic: str,
    slides: int = 7,
    platform: str = "instagram",
) -> dict:
    """
    Generuje obsah pro karusel post (série obrázků).
    Ideální pro vzdělávací obsah — průměrně 3x více dosahu než single post.
    """
    client, model_name = setup_openai()

    prompt = f"""Vytvoř KARUSEL obsah pro {platform.upper()} na téma: **{topic}**
Počet slidů: {slides}
Platforma je pouze formátový kontext; neslibuj dosah ani výkon algoritmu.

Piš v přirozeném hlasu Mystické Hvězdy:
{BRAND_VOICE}

Rozděl myšlenku do srozumitelných slidů. První slide může pojmenovat téma, závěr může shrnout pointu; povinný hook ani CTA nejsou nutné. Každý slide má přidat vlastní informaci a nepřetěžuj ho textem. Neopakuj body v captionu. Nevymýšlej zkušenosti, fakta, výsledky ani osobní výklady. Vizuální styl přizpůsob tématu; nepoužívej automaticky 3D krystal, zlatou filigránovou dekoraci ani mlhovinu.

Odpověz JSON:
{{
  "cover_caption": "přirozený popisek pro feed; může být stručný",
  "hashtags": [],
  "slides": [
    {{
      "slide": 1,
      "headline": "nadpis slidu (max 8 slov)",
      "body": "text na slidu (max 30 slov)",
      "visual": "popis vizuálu v angličtině",
      "design_note": "tip pro grafika (barvy, styl, prvky)"
    }},
    ...
  ],
  "image_prompt_cover": "konkrétní anglický vizuální směr, nebo prázdný řetězec"
}}"""

    response = _call_openai(client, model_name, prompt)
    result = _parse_json_response(response.text)

    if result is None:
        return {
            "cover_caption": "",
            "hashtags": [],
            "slides": [],
            "image_prompt_cover": "",
        }

    return result


# ============================================================
# ODPOVĚDI NA KOMENTÁŘE
# ============================================================

# Cached knowledge base pro comment replies — sestaví se jednou za session
_COMMENT_KB_SYSTEM: str | None = None

def _get_comment_system() -> str:
    """Vrátí systémové instrukce se znalostní bází pro odpovědi na komentáře."""
    global _COMMENT_KB_SYSTEM
    if _COMMENT_KB_SYSTEM is None:
        kb = build_knowledge_prompt(
            include_tools=True,
            include_pricing=False,
            include_blog=False,
            include_usp=True,
            include_faq=True,
            compact=True,
            allowed_tool_urls=_SOCIAL_ALLOWED_TOOL_URLS,
        )
        _COMMENT_HARD_RULES = """PRAVIDLA ODPOVĚDÍ NA KOMENTÁŘE:
- Odpověz přirozenou češtinou, tykej a reaguj na konkrétní obsah komentáře. Obvykle stačí jedna až tři věty.
- Vřelost drž klidnou a opravdovou. Nezačínej automatickým „Rozumím“ ani univerzální útěchou, pokud neodpovídá situaci.
- Nepoužívej rodové tvary s lomítkem. Pohlaví neodvozuj ze jména ani profilu; když z komentáře není jasné, formuluj větu přirozeně bez rodového příčestí. Když se člověk sám jasně označí, respektuj jeho jazyk.
- Nevymýšlej URL, cenu, vlastnost služby, lidskou konzultaci, osobní zkušenost ani výsledek výkladu. Odkaz použij jen z dodaných ověřených podkladů a jen když pomáhá.
- Tarot ani astrologii nepodávej jako jistotu o budoucnosti, zdraví nebo pocitech jiné osoby. Neslibuj léčbu ani výsledek.
- Pokud se někdo přímo zeptá na AI nebo automatizaci, odpověz pravdivě a stručně. Nikdy netvrď, že automatickou odpověď napsal člověk.
- U smutku, ztráty nebo strachu nejdřív uznej konkrétní prožitek; netlač hned radu ani nabídku."""

        _COMMENT_KB_SYSTEM = "\n\n".join((BRAND_VOICE, kb, _COMMENT_HARD_RULES))
    return _COMMENT_KB_SYSTEM



# ── Slovníky pro detekci kontextu ──
_ZNAMENI = {
    "beran": "Beran ♈", "byk": "Býk ♉", "blizenci": "Blíženci ♊", "blíženci": "Blíženci ♊",
    "rak": "Rak ♋", "lev": "Lev ♌", "panna": "Panna ♍",
    "vahy": "Váhy ♎", "váhy": "Váhy ♎", "stir": "Štír ♏", "štír": "Štír ♏",
    "strelec": "Střelec ♐", "střelec": "Střelec ♐", "kozoroh": "Kozoroh ♑",
    "vodnar": "Vodnář ♒", "vodnář": "Vodnář ♒", "ryby": "Ryby ♓",
}

_EMOCE = {
    "unavená": "únava", "unavena": "únava", "unavený": "únava", "unavene": "únava",
    "unaveně": "únava", "vyčerpaný": "vyčerpání", "vycerpany": "vyčerpání",
    "opuštěná": "osamělost", "opustena": "osamělost", "opuštěně": "osamělost", "opustene": "osamělost",
    "osamělý": "osamělost", "osamely": "osamělost", "osamělá": "osamělost", "osamela": "osamělost",
    "skleslá": "sklíčenost", "sklesla": "sklíčenost", "sklesle": "sklíčenost",
    "smutná": "smutek", "smutný": "smutek", "smutne": "smutek", "smutna": "smutek", "smutno": "smutek",
    "znechutena": "znechucení", "znechucena": "znechucení",
    "rezignovaně": "rezignace", "rezignovane": "rezignace",
    "sám": "osamělost", "sama": "osamělost",
    "úzkost": "úzkost", "uzkost": "úzkost", "panika": "úzkost",
    "vyčerpaná": "vyčerpání", "vycerpana": "vyčerpání",
    "ztracená": "ztráta", "ztracený": "ztráta", "ztracena": "ztráta", "ztraceny": "ztráta",
    "zlostná": "zlost", "nastvana": "zlost", "naštvaná": "zlost",
    "spokojená": "spokojenost", "spokojená": "spokojenost",
    "vděčná": "vděčnost", "vdecna": "vděčnost",
    "nadšená": "nadšení", "nadsena": "nadšení",
    "špatně": "těžký stav", "spatne": "těžký stav", "blbě": "těžký stav", "blbe": "těžký stav",
    "nezvládám": "přetížení", "nezvladam": "přetížení", "nemůžu": "přetížení", "nemuzu": "přetížení",
    "rozchod": "bolest po rozchodu", "brečím": "pláč", "brecim": "pláč",
}

def _detect_comment_context(message: str) -> dict:
    """Detekuje klíčový kontext komentáře — znamení, emoce, typ."""
    lower = message.lower().strip()
    ctx = {"znameni": None, "emoce": None, "typ": "neutral"}

    # Detekce znamení
    for klic, hodnota in _ZNAMENI.items():
        if klic in lower:
            ctx["znameni"] = hodnota
            break

    # Detekce emoce
    for klic, hodnota in _EMOCE.items():
        if klic in lower:
            ctx["emoce"] = hodnota
            break

    # Detekce humoru — před ostatními typy
    humor_signals = ["😂", "😄", "😁", "🤣", "😅", "😆", "haha", "hehe", ":D", "lol"]
    rude_signals = ["blbost", "kravina", "kraviny", "debil", "nesmysl", "podvod", "fake", "scam", "šarlat", "sarlat", "lžete", "lzete", "trapn", "hovadina"]
    crisis_signals = ["nechci žít", "nechci zit", "chci umřít", "chci umrit", "zabiju se", "ublížit si", "ublizit si", "si ublížit", "si ublizit", "ukončit život", "ukoncit zivot"]
    support_signals = ["mám se špatně", "mam se spatne", "mám se blbě", "mam se blbe", "je mi špatně", "je mi spatne", "je mi blbě", "je mi blbe", "už nemůžu", "uz nemuzu", "nemůžu dál", "nemuzu dal", "nejsem dobře", "nejsem v pořádku", "nejsem v pohode", "trápím se", "trapim se"]
    if any(s in lower for s in crisis_signals):
        ctx["typ"] = "krize"
    elif any(s in lower for s in rude_signals):
        ctx["typ"] = "hruby_komentar"
    elif any(s in lower for s in support_signals):
        ctx["typ"] = "emocionalni_stav"
        if not ctx["emoce"]:
            ctx["emoce"] = "těžký stav"
    elif any(s in lower for s in humor_signals) or (message.count("😂") + message.count("🤣")) >= 1:
        ctx["typ"] = "humor"
    elif "?" in message:
        ctx["typ"] = "otazka"
    elif ctx["znameni"] and len(lower) < 30:
        ctx["typ"] = "identifikace_znameni"  # "Jsem Štír 🦂"
    elif ctx["emoce"]:
        ctx["typ"] = "emocionalni_stav"
    # Krátký negativní komentář — "Špatně", "Spatne", "Smutno", "Jsem tady :(" apod.
    elif len(lower.replace("🫣","").replace("😞","").replace(":(","").strip()) <= 30 and any(
        w in lower for w in ["špatně", "spatne", "špatne", "smutně", "smutn", "špatno",
                              "je mi spatn", "je mi špatn", "jsem tady", "je mi smutno",
                              "cítím se špatn", "citim se špatn", "unaveně", "unavene"]
    ):
        ctx["typ"] = "kratky_negativni"
    elif any(w in lower for w in ["díky", "dekuji", "děkuji", "super", "skvěl", "krásn", "úžasn", "přesn", "pravda", "❤", "💜", "🙏"]):
        ctx["typ"] = "pochvala"
    elif any(w in lower for w in ["nevím", "nevim", "pochyb", "nefunguje", "nevěřím", "neverim", "škoda", "zklamán"]):
        ctx["typ"] = "skeptik"
    elif ctx["znameni"]:
        ctx["typ"] = "prinos_znameni"  # delší komentář se znamením

    return ctx


def generate_comment_reply(
    original_comment: str,
    post_topic: str,
    tone: str = "friendly",
    post_context: str = "",
    db_sentiment: str = "",
    comment_id: str = "",
    context_type: str = "",
    allowed_reply_url: str | None = None,
    tool_name: str = "",
    model_tier: str = "fast",
    max_tokens: int = 250,
    quality_feedback: str = "",
    route: str = "ai_cheap",
    regenerated: int = 0,
    return_metadata: bool = False,
) -> str | tuple[str, dict]:
    """
    Generuje specifickou, duší nabitou odpověď na komentář.
    Rozpoznává znamení, emoce, typ komentáře a přizpůsobuje tón i obsah.
    db_sentiment: sentiment z DB (přepíše detekci pokud je 'emotional')
    """
    model_tier = (model_tier or "fast").strip().lower()
    if model_tier not in {"fast", "standard", "pro"}:
        model_tier = "fast"
    client, model_name = setup_openai(
        use_fast=model_tier == "fast",
        use_pro=model_tier == "pro",
    )
    usage_events: list[dict] = []

    ctx = _detect_comment_context(original_comment)
    # Pokud DB klasifikovala komentář jako emocionální výpověď, respektuj to
    if db_sentiment == "crisis":
        ctx["typ"] = "krize"
        if not ctx["emoce"]:
            ctx["emoce"] = "krizový stav"
    elif db_sentiment == "rude":
        ctx["typ"] = "hruby_komentar"
    elif db_sentiment == "emotional" and ctx["typ"] not in ("humor", "identifikace_znameni"):
        ctx["typ"] = "emocionalni_stav"
        if not ctx["emoce"]:
            ctx["emoce"] = "těžký stav"
    if context_type:
        ctx["typ"] = {
            "emotional": "emocionalni_stav",
            "crisis": "krize",
            "rude": "hruby_komentar",
            "otazka": "otazka",
            "pochvala": "pochvala",
            "skeptical": "skeptik",
        }.get(context_type, context_type)

    # Pokyny pro odpověď vycházejí z komentáře; nejde o pevné textové šablony.
    if ctx["typ"] == "identifikace_znameni":
        instrukce = "Osoba zmiňuje své znamení. Reaguj přirozeně a stručně; nepřipisuj jí vlastnosti podle znamení."
    elif ctx["typ"] == "emocionalni_stav":
        instrukce = (
            f"Osoba vyjadřuje {ctx['emoce']}. Odpověz na konkrétní slova bez zlehčování, "
            "okamžité rady, astrologie nebo nabídky. Další otázku polož jen tehdy, když pomůže rozhovoru."
        )
    elif ctx["typ"] == "krize":
        instrukce = (
            "Komentář může naznačovat bezprostřední ohrožení nebo sebepoškození. Ber ho vážně, "
            "odpověz přímo a citlivě, povzbuď k okamžitému kontaktu s důvěryhodnou osobou nebo "
            "místní tísňovou pomocí. Bez mystiky, diagnózy, slibů a webové nabídky."
        )
    elif ctx["typ"] == "otazka":
        instrukce = "Odpověz přímo na otázku a drž se ověřených informací. Pokud odpověď neznáš, přiznej to."
    elif ctx["typ"] == "pochvala":
        instrukce = "Poděkuj stručně a přirozeně. Nepřidávej vymyšlený osobní pocit ani prodejní pozvání."
    elif ctx["typ"] == "skeptik":
        instrukce = "Odpověz klidně na konkrétní pochybnost. Nevymýšlej osobní zkušenost a nesnaž se člověka přesvědčit."
    elif ctx["typ"] == "hruby_komentar":
        instrukce = (
            "Reaguj klidně, stručně a s respektem. Neoplácej útokem ani nepřidávej URL. "
            "Pokud komentář obsahuje věcnou otázku, odpověz na ni; jinak může stačit krátké vymezení."
        )
    elif ctx["typ"] == "prinos_znameni":
        instrukce = "Odpověz na zkušenost, kterou člověk popsal. Nevysvětluj jeho chování astrologií, pokud o to nežádá."
    elif ctx["typ"] == "humor":
        instrukce = "Reaguj lehce, pokud to nepůsobí nuceně. Nemusíš přidávat vlastní vtip."
    elif ctx["typ"] == "kratky_negativni":
        instrukce = (
            "Komentář stručně vyjadřuje nepohodu. Odpověz na jeho konkrétní obsah bez hotové fráze, "
            "rady nebo astrologického výkladu. Otázku přidej jen tehdy, když je citlivá a užitečná."
        )
    else:
        instrukce = "Odpověz na konkrétní sdělení přátelsky a přiměřeně jeho délce. Nevnucuj otázku, astrologii ani CTA."

    # Relevantní nástroj/odkaz — konzervativně, aby odpovědi nepůsobily jako spam.
    comment_tool = None
    if not allowed_reply_url:
        offer_link, comment_tool = should_offer_comment_link(
            original_comment=original_comment,
            post_topic=post_topic,
            context_type=ctx["typ"],
            db_sentiment=db_sentiment,
        )
        allowed_reply_url = f"{config.WEBSITE_URL.rstrip('/')}{comment_tool.url}" if offer_link and comment_tool else None
    recommendation = "\nODKAZY: V této odpovědi NEPIŠ žádnou URL."
    if allowed_reply_url:
        display_tool_name = tool_name or (comment_tool.name if comment_tool else "relevantní nástroj")
        recommendation = f"""
JEMNÉ POZVÁNÍ:
- Odpověď musí nejdřív reálně pomoct v kontextu komentáře.
- Pokud to sedí jako přirozený další krok, můžeš v poslední větě jemně pozvat na {display_tool_name}.
- Použij POUZE tento odkaz, doslova: {allowed_reply_url}
- Žádný prodejní tón. Nepiš "klikni", "sleduj nás", "mrkni na web" ani "odkaz v biu".
- Odkaz max jednou a pouze v poslední větě."""

    from datetime import date as _date
    _d = _date.today()
    _today_str = f"{_d.day}. {_d.month}. {_d.year}"

    prompt = f"""Dnes je {_today_str}. Post byl publikován dříve — NEodkazuj na datum postu jako na budoucnost ani přítomnost. Pokud post zmiňuje konkrétní datum které už proběhlo, mluv o něm v minulém čase nebo vůbec.

Post byl o: "{post_topic}"
{f'Kontext: {post_context[:200]}' if post_context else ''}
Komentář: "{original_comment}"

INSTRUKCE PRO TUTO ODPOVĚĎ:
{instrukce}
{recommendation}
{f'OPRAVA PO QUALITY GATE: {quality_feedback}' if quality_feedback else ''}

PEVNÁ PRAVIDLA — porušení není přípustné:
- Piš česky, přirozeně, tykej (2. os. j.č.)
- Emoji použij jen tehdy, pokud se hodí k tónu komentáře.
- Nezačínaj "Ahoj!", "Děkujeme!", "To je skvělé že...", "To je krásné že..."
- Nepoužívej lomené rodové tvary. Pohlaví neodvozuj ze jména ani profilu; respektuj jen to, jak se člověk sám označí. Když si nejsi jistý, zvol běžnou větu, která rod nepotřebuje.
- NIKDY nevymýšlej URL adresy — odkaz použij POUZE pokud je explicitně uveden výše v sekci "JEMNÉ POZVÁNÍ"
- NIKDY nepouži medicínské/vědecké termíny pokud si nejsi 100% jistý (raději vynech)
- Nezaváděj téma AI ani automatizace bez souvislosti s komentářem. Pokud se komentář přímo zeptá, odpověz pravdivě a stručně: "Mystická Hvězda používá při tvorbě odpovědí AI a automatizaci."
- Reaguj na konkrétní slova člověka; nevkládej univerzální soucitnou frázi ani vymyšlenou zkušenost

Odpověz POUZE textem odpovědi."""

    max_tokens = max(80, min(int(max_tokens or 180), 320))
    response = _call_openai(client, model_name, prompt, temperature=0.82, max_tokens=max_tokens,
                            system=_get_comment_system())
    usage_events.append(usage_to_dict(getattr(response, "usage", None)))
    result = response.text.strip()

    # Zkus opravit jen jasnou technickou chybu ve výstupu, ne běžné české tvary.
    import re as _re
    def _has_issues(text: str) -> str | None:
        if _re.search(r'[А-Яа-яЁё]', text):
            return "cyrilici místo češtiny"
        without_urls = _re.sub(r"https?://\S+|www\.\S+", "", text)
        if _re.search(r"\b\w+\s*/\s*\w+\b", without_urls):
            return "rodový tvar s lomítkem"
        return None

    for _attempt in range(2):
        issue = _has_issues(result)
        if not issue:
            break
        log.warning("Opravuji technickou chybu v české odpovědi (pokus %d): %s", _attempt + 1, issue)
        response = _call_openai(
            client,
            model_name,
            prompt + f"\n\nOprav jen tuto konkrétní chybu: {issue}. Zachovej význam i přirozenou češtinu.",
            temperature=0.55,
            max_tokens=max_tokens,
            system=_get_comment_system(),
        )
        usage_events.append(usage_to_dict(getattr(response, "usage", None)))
        result = response.text.strip()

    # Vždy odstraň markdown formátování (*tučné*, _kurzíva_) — na FB vypadají špatně
    result = _re.sub(r'\*([^*]+)\*', r'\1', result)   # *slovo* → slovo
    result = _re.sub(r'_([^_]+)_', r'\1', result)     # _slovo_ → slovo
    result = sanitize_reply_links(result, config.WEBSITE_URL, allowed_reply_url)

    metadata = {
        "model": model_name,
        "usage_events": usage_events,
        "route": route,
        "regenerated": regenerated,
        "final_chars": len(result),
    }
    if comment_id and not return_metadata:
        record_comment_reply_usage(
            comment_id=comment_id,
            route=route,
            model=model_name,
            usage_events=usage_events,
            final_chars=len(result),
            regenerated=regenerated,
        )

    if return_metadata:
        return result, metadata
    return result


# ============================================================
# TÝDENNÍ PLÁN
# ============================================================

def generate_weekly_content_plan(
    week_number: int,
    year: int | None = None,
) -> list[dict]:
    """
    Připraví sedm různých námětů; plán není doporučením publikovat každý den.
    """
    client, model_name = setup_openai()

    from datetime import date, timedelta
    year = year or date.today().year
    week_start = date.fromisocalendar(year, week_number, 1)

    # Astro kontext je pouze volitelná inspirace; plán na něm nesmí stát.
    daily_contexts = []
    for i in range(7):
        day = week_start + timedelta(days=i)
        try:
            ctx = get_full_astrological_context(day)
            daily_contexts.append({
                "day_name": ["Pondělí", "Úterý", "Středa", "Čtvrtek", "Pátek", "Sobota", "Neděle"][i],
                "date": day.isoformat(),
                "moon": ctx["moon"]["phase_cs"],
                "moon_energy": ctx["moon"]["energy_type"],
                "universal_day": ctx["universal_day"],
            })
        except Exception:
            daily_contexts.append({
                "day_name": ["Pondělí", "Úterý", "Středa", "Čtvrtek", "Pátek", "Sobota", "Neděle"][i],
                "date": (week_start + timedelta(days=i)).isoformat(),
                "moon": "", "moon_energy": "", "universal_day": 1,
            })

    # Předchozí obsah pomáhá rozpoznat podobné formulace, témata nezakazuje.
    variety = get_variety_context()
    avoid_text = variety.get("avoid_instruction", "")

    contexts_text = "\n".join(
        f"  {d['day_name']} ({d['date']}): Měsíc={d['moon']}, energie='{d['moon_energy']}', Num.den={d['universal_day']}"
        for d in daily_contexts
    )

    # Znalostní báze — blog články a nástroje pro plánování obsahu
    blog_knowledge = get_blog_summary_for_prompt()

    prompt = f"""Navrhni sedm různorodých námětů pro obsah Mystické Hvězdy v týdnu {week_number}/{year}.
Jde o zásobník možností k výběru, ne o pokyn publikovat každý den.
Začátek týdne: {week_start.isoformat()}

HLAS ZNAČKY
{BRAND_VOICE}

TÉMATA A FORMÁTY
- Vybírej z témat: {', '.join(config.CONTENT_THEMES)}
- Formát může být vzdělávací příspěvek, krátká úvaha, otázka, praktický tip, příběh, carousel nebo promo.
- Promo navrhni jen tehdy, když pro něj existuje ověřený podklad; plán nemusí obsahovat žádnou reklamu.
- Astrologický kontext je volitelný a symbolický. Neuváděj ho, pokud k tématu nic nepřidá.
- Časy publikování, počet hashtagů, otázka ani CTA nejsou součástí každého námětu.

ASTRO KONTEXT (jen pokud je pro námět přirozeně relevantní):
{contexts_text}

OVĚŘENÉ ZNALOSTI O ČLÁNCÍCH A FUNKCÍCH
{blog_knowledge}

KONTEXT PŘEDCHOZÍCH NÁVRHŮ
{avoid_text or "Bez zvláštních poznámek."}

Každý námět formuluj konkrétně, s jiným úhlem nebo typem hodnoty. Nevymýšlej zkušenosti, citace, data, výsledky, URL ani vlastnosti služby.

Vrať JSON pole 7 objektů:
[
  {{
    "day": "název dne",
    "date": "YYYY-MM-DD",
    "post_type": "typ",
    "topic": "konkrétní téma nebo otázka",
    "brief": "stručně: co čtenáři přinese a jaký úhel zvolit",
    "relevant_context": "ověřený kontext, nebo prázdný řetězec"
  }},
  ...
]"""

    response = _call_openai(client, model_name, prompt, max_tokens=2048)

    text = response.text.strip()
    text = re.sub(r'```json\s*', '', text)
    text = re.sub(r'```\s*', '', text)

    match = re.search(r'\[[\s\S]*\]', text)
    if match:
        try:
            return json.loads(match.group())
        except (json.JSONDecodeError, ValueError):
            pass

    return []


if __name__ == "__main__":
    from rich.console import Console
    from rich.panel import Panel

    console = Console()
    console.print("[bold purple]🔮 Test Text Generatoru v2[/bold purple]\n")

    result = generate_post(
        post_type="myth_bust",
        topic="tarot — jak karty skutečně fungují",
        platform="instagram",
        variations=1,
        use_astro_context=True,
    )

    if result:
        caption = result.get("caption", "")
        hashtags = " ".join(result.get("hashtags", []))

        console.print(Panel(
            f"[bold]Caption:[/bold]\n{caption}\n\n"
            f"[bold]Hashtags:[/bold]\n{hashtags}\n\n"
            f"[bold]CTA:[/bold] {result.get('call_to_action', '')}",
            title="✨ Vygenerovaný Post",
            border_style="purple"
        ))
