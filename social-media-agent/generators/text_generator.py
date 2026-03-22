"""
Text Generator — Gemini Flash pro generování obsahu.
Obsahuje brand voice systém, storytelling frameworky,
hook knihovnu a anti-repetition paměť.
"""
import json
import re
import time
from typing import Optional
import sys
from pathlib import Path

from google import genai
from google.genai import types as genai_types

sys.path.insert(0, str(Path(__file__).parent.parent))
import config
from generators.lunar_context import get_full_astrological_context
from generators.content_memory import get_variety_context
from brand_knowledge import build_knowledge_prompt, find_relevant_blog, find_relevant_tool, get_blog_summary_for_prompt
from logger import get_logger

log = get_logger(__name__)


# ============================================================
# BRAND VOICE — SRDCE CELÉHO AGENTA
# ============================================================

BRAND_VOICE = """
IDENTITA ZNAČKY: Mystická Hvězda
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OSOBNOST: Jsi jako moudrá, teplá přítelkyně, která strávila roky studiem mystiky.
Neodsuzuješ, nezesměšňuješ. Máš hluboké znalosti, ale mluvíš přístupně —
jako by ses bavila u šálku čaje, ne přednášela na univerzitě.

TÓN: Teplý • Zvídavý • Moudrý bez arogance • Poetický ale srozumitelný •
       Laskavě provokativní (ptáš se otázky, nepodáváš jen odpovědi)

JAZYK: Česky. Přirozený, plynný text. Žádné překlady z angličtiny.
       Žádná cizí slova tam, kde existuje krásný český výraz.

NESMÍŠ ŘÍKAT (tyto fráze jsou přespříliš otřepané):
- "Věřte nebo ne", "Fascinující", "Neuvěřitelné", "Ohromující"
- "Dnes vám přináším", "Sdílíme s vámi"
- "Nechte to vstřebat", "Tohle změní váš život"
- Příliš mnoho vykřičníků (max 1 na post)
- "Sledujte nás pro více" (ztráta důvěry)

PŘÍSNÝ ZÁKAZ — NIKDY NEZMIŇUJ AI:
- NIKDY neříkej že jsi AI, bot, umělá inteligence, chatbot, jazykový model, algoritmus
- NIKDY nepoužívej fráze: "jako AI", "jsem naprogramován", "můj algoritmus", "generováno AI",
  "vytvořeno umělou inteligencí", "AI-powered", "strojové učení", "neuronová síť"
- NIKDY neprozrazuj technologii za sebou — neříkej "Gemini", "GPT", "LLM", "model"
- Vystupuješ VÝHRADNĚ jako tým Mystické Hvězdy — skuteční lidé s vášní pro mystiku
- Pokud se někdo zeptá "Jsi robot/AI?", odpověz lidsky a s humorem:
  "Za Mystickou Hvězdou stojí tým lidí, kteří žijí mystikou každý den ✨"
- V popisu nástrojů platformy NEŘÍKEJ "AI výklad" — říkej "personalizovaný výklad",
  "hloubkový rozbor", "detailní interpretace"

SMÍŠ A MÁŠ:
- Začít post silným, nezvyklým úhlem pohledu
- Sdílet konkrétní mystické znalosti (ne vágní obecnosti)
- Ptát se čtenáře na jeho zkušenosti
- Používat druhou osobu ("Kdy jsi naposledy...")
- Vytvářet pocit komunity ("My — lidé, kteří věříme...")
- Odkazovat na aktuální astrologický kontext

FILOSOFIE OBSAHU:
Nevěnujeme se mystice jako módnímu trendu nebo estetice.
Mystická Hvězda věří, že každý člověk má přístup k hlubší moudrosti —
skrze tarot, čísla, hvězdy nebo intuici. Naším posláním je tuto moudrost
zprostředkovat srozumitelně, bez dogmat a s laskavostí.
"""


# ============================================================
# HOOK KNIHOVNA — 20 OVĚŘENÝCH VZORCŮ
# ============================================================

HOOK_FORMULAS = {
    "curiosity_gap": 'Vzorec: "Jedna věc o [téma], která ti možná nikdy nebyla řečena..."',
    "bold_statement": 'Vzorec: Začni odvážným tvrzením, které čtenáře zastaví. Pak ho rozvin.',
    "personal_question": 'Vzorec: "Kdy jsi naposledy [akce spojená s tématem]?"',
    "number_hook": 'Vzorec: "3 důvody proč [téma] funguje jinak, než si myslíš"',
    "story_open": 'Vzorec: Začni krátkým příběhem nebo scénou ("Bylo pozdě večer, a...").',
    "contrarian": 'Vzorec: Zpochybni běžný mýtus o tématu ("Většina lidí si myslí X, ale ve skutečnosti...")',
    "before_after": 'Vzorec: Ukaž kontrast stavu před a po ("Před tím než jsem pochopil/a X...")',
    "secret_reveal": 'Vzorec: "To, co ti astrologové málokdy řeknou o [téma]..."',
    "direct_address": 'Vzorec: Oslovi specifický typ čtenáře ("Pokud tě přitahuje [téma], čti dál...")',
    "moon_hook": 'Vzorec: Navěž na aktuální fázi Měsíce a co to znamená pro čtenáře DNES.',
    "zodiac_hook": 'Vzorec: Navěž na aktuální sluneční znamení a jeho energetický vliv.',
    "numerology_hook": 'Vzorec: Propoj téma s universálním dnem nebo numerologickým číslem.',
    "myth_bust": 'Vzorec: "Největší nepravda o [téma], které většina lidí věří..."',
    "how_to_feel": 'Vzorec: Popiš pocit/emocionální zážitek, než vysvětlíš co ho způsobuje.',
    "community": 'Vzorec: "Pokud jsi jako většina z nás, kteří studujeme mystiku, tak..."',
    "daily_ritual": 'Vzorec: "Každé ráno dělám jednu věc, která [přínos]. Dnes se podělím o proč."',
    "challenge": 'Vzorec: Navrhni čtenáři jednoduchý 1-3 denní výzvu.',
    "historic_wisdom": 'Vzorec: "Staré civilizace věděly o [téma] něco, co jsme zapomněli..."',
    "synchronicity": 'Vzorec: "Není náhoda, že čteš toto právě teď..."',
    "season_energy": 'Vzorec: Propoj téma s aktuální roční dobou nebo sezónou.',
}


# ============================================================
# SETUP
# ============================================================

# Singleton — jeden klient pro celou session
_gemini_client: genai.Client | None = None

def setup_gemini(use_pro: bool = False):
    """Inicializuje Gemini (singleton klient, nový google-genai SDK)"""
    global _gemini_client
    if not config.GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY není nastaven v .env souboru!")
    if _gemini_client is None:
        _gemini_client = genai.Client(api_key=config.GEMINI_API_KEY)
    model_name = "gemini-2.5-pro-preview-03-25" if use_pro else config.TEXT_MODEL
    return _gemini_client, model_name


def _call_gemini(client, model: str, contents: str, config_obj=None, max_retries: int = 3):
    """
    Volá Gemini API s automatickým retry při dočasných chybách.
    Exponential backoff: 2s, 4s, 8s.
    """
    for attempt in range(max_retries):
        try:
            kwargs = {"model": model, "contents": contents}
            if config_obj:
                kwargs["config"] = config_obj
            return client.models.generate_content(**kwargs)
        except Exception as e:
            error_msg = str(e).lower()
            # Retry pouze na dočasné chyby (rate limit, server error, timeout)
            retriable = any(kw in error_msg for kw in [
                "429", "rate", "quota", "500", "503", "timeout",
                "unavailable", "overloaded", "resource_exhausted",
            ])
            if retriable and attempt < max_retries - 1:
                wait = 2 ** (attempt + 1)
                log.info("Gemini API dočasná chyba, retry za %ds... (%d/%d)", wait, attempt + 1, max_retries)
                time.sleep(wait)
            else:
                raise


def _parse_json_response(text: str) -> Optional[dict]:
    """Robustní parsování JSON z Gemini odpovědi"""
    text = text.strip()

    # Odstraň markdown code bloky
    text = re.sub(r'```json\s*', '', text)
    text = re.sub(r'```\s*', '', text)

    # Najdi JSON objekt
    match = re.search(r'\{[\s\S]*\}', text)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass

    # Zkus parsovat celý text
    try:
        return json.loads(text)
    except (json.JSONDecodeError, ValueError, TypeError):
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
) -> dict:
    """
    Generuje kompletní post pro sociální sítě.

    Args:
        post_type: educational | quote | question | tip | blog_promo | daily_energy |
                   myth_bust | story | challenge | carousel_plan
        topic: téma postu
        platform: instagram | facebook
        blog_url: URL blogu (pro blog_promo)
        blog_title: název článku
        extra_context: dodatečný kontext
        use_astro_context: zda vložit do promptu aktuální astro kontext
        variations: kolik verzí vygenerovat (1-3)

    Returns:
        dict nebo list[dict] (pokud variations > 1)
    """
    client, model_name = setup_gemini()

    platform_info = config.PLATFORM_SETTINGS.get(platform, config.PLATFORM_SETTINGS["instagram"])
    max_hashtags = platform_info["max_hashtags"]

    # Astrologický kontext
    astro_section = ""
    if use_astro_context:
        try:
            astro = get_full_astrological_context()
            astro_section = f"""
AKTUÁLNÍ ASTROLOGICKÝ KONTEXT (využij v obsahu pokud to dává smysl):
{astro['content_brief']}
Měsíční energie pro obsah: {astro['moon']['content_angle']}
Rituální tip dne: {astro['moon']['ritual_tip']}
Duchovní témata dne: {astro['moon']['spiritual_theme']}
"""
        except Exception:
            pass

    # Anti-repetition kontext
    variety = get_variety_context()
    variety_section = variety.get("avoid_instruction", "")

    # Blog sekce
    blog_section = ""
    if blog_url and blog_title:
        blog_section = f"""
BLOG ČLÁNEK K PROPAGACI:
Název: {blog_title}
URL: {blog_url}
Popis: {extra_context or ''}
DŮLEŽITÉ: Caption musí vyvolat zvědavost a přimět kliknout. Neprozrazuj vše — naznač.
Vlož URL přirozeně na konci, nikoli jako suchý odkaz.
"""

    # Výběr hook formule (pryč od nedávno použitých)
    available_hooks = {k: v for k, v in HOOK_FORMULAS.items()
                      if k not in variety.get("recent_hooks", [])}
    hook_suggestions = list(available_hooks.values())[:5]
    hooks_text = "\n".join(f"  - {h}" for h in hook_suggestions)

    # Typ postu — rozšířené instrukce
    POST_INSTRUCTIONS = {
        "educational": """
Vzdělávací post. Strukturuj jako: HOOK → ZNALOST (konkrétní, ne vágní) → PRAKTICKÁ APLIKACE → OTÁZKA.
Čtenář si má odnést JEDNU konkrétní věc, co se naučil. Ne přehled tématu.
Příklad: místo "Tarot má 78 karet" napiš co ti konkrétní karta může říct o tvém vztahu DNES.
""",
        "quote": """
Inspirativní post. Ne generický citát z internetu — vytvoř původní myšlenku nebo moudrost
specificky pro mystické téma. Formát: Krátká silná sentence (1-2 řádky) + rozvití v 3-4 větách.
Citát musí být takový, že ho čtenář chce sdílet nebo uložit.
""",
        "question": """
Zapojovací post. Začni kontroverznější otázkou než je obvyklé. Ne "Jaké je tvoje znamení?"
ale "Kdy jsi naposledy ignoroval/a svou intuici? Co se pak stalo?"
Otázka musí být osobní a trochu provokativní — vyvolat reflexi a chuť odpovědět.
""",
        "tip": """
Praktický rituál nebo tip. Konkrétní, proveditelný. Ne "medituj každý den",
ale "Udělej toto: ráno před telefonem, 2 minuty, ruce na srdci, 3 záměry."
Čtenář musí mít jasný návod co přesně dělat.
""",
        "blog_promo": """
Propagace blogu. NESMÍŠ: shrnutí článku. MUSÍŠ: vyvolat zvědavost.
Technika: Řekni co se čtenář dozví, ale nezdvoj to. Přidej 1 lákavou detail.
Konec: "Celý článek najdeš v odkazu v biu" nebo konkrétní URL.
""",
        "daily_energy": """
Denní energetická předpověď. Propoj s aktuální fází Měsíce a slunečním znamením.
Formát: Co dnes energie přináší + jak to využít + krátký rituál nebo záměr pro dnešek.
Tón: jemný, poetický ale konkrétní.
""",
        "myth_bust": """
Odhalení mýtu. Začni tím co si VĚTŠINA LIDÍ myslí (a proč je to špatně).
Pak vysvětli pravdu. Buď odvážný — neboj se říct "takhle to nefunguje".
Tón: přátelský ale sebejistý. Cíl: čtenář se dozví něco překvapivého.
""",
        "story": """
Příběhový post. Začni KONKRÉTNÍ scénou (čas, místo, akce). Ne "jednou se mi stalo".
Příběh musí mít obrat nebo lekci. Může být o klientovi (anonymně), historické postavě,
nebo o samotném tématu personifikovaném. Konec: stručná moudrost nebo otázka.
""",
        "challenge": """
Výzva pro komunitu. Navrhni jednoduchou 3-7 denní výzvu spojenou s tématem.
Buď KONKRÉTNÍ: co dělat, kdy, jak dlouho, co zaznamenat.
Přidej motivaci proč to za to stojí (co se může změnit).
""",
        "carousel_plan": """
Plán pro karusel (série slidů). Vygeneruj PLÁN obsahu pro 5-7 slidů.
Slide 1: silný hook. Slide 2-N: obsah. Poslední: CTA.
Caption je krátký teaser, který říká "přejeď doprava pro X".
""",
    }

    type_instruction = POST_INSTRUCTIONS.get(post_type, POST_INSTRUCTIONS["educational"])

    # Znalostní báze značky — agent zná celou platformu
    knowledge_section = build_knowledge_prompt(
        include_tools=True,
        include_pricing=True,
        include_blog=True,
        include_usp=True,
        compact=True,
    )

    # Relevantní blog články pro toto téma (pro přirozené odkazování)
    relevant_blogs = find_relevant_blog(topic, max_results=3)
    blog_tips = ""
    if relevant_blogs and post_type != "blog_promo":
        blog_links = [f"  • \"{b['title']}\" → {config.WEBSITE_URL}/blog/{b['slug']}.html"
                     for b in relevant_blogs]
        blog_tips = (
            "\nRELEVANTNÍ ČLÁNKY NA WEBU (můžeš přirozeně odkázat čtenáře):\n"
            + "\n".join(blog_links)
        )

    # Relevantní nástroj
    tool = find_relevant_tool(topic)
    tool_tip = ""
    if tool:
        tool_url = tool.get("url", "")
        tool_tip = (
            f"\nRELEVANTNÍ NÁSTROJ NA WEBU: {tool['name']} "
            f"({config.WEBSITE_URL}{tool_url}) — "
            f"{tool['description'][:100]}"
        )

    # Počet variací
    var_instruction = ""
    if variations > 1:
        var_instruction = f"""
GENERUJ {variations} RŮZNÉ VERZE captionů v poli "variations".
Každá verze musí mít jiný hook a jiný úhel pohledu na stejné téma.
Formát odpovědi (PŘESNĚ):
{{
  "variations": [
    {{ "caption": "...", "hook_formula": "název vzorce" }},
    {{ "caption": "...", "hook_formula": "název vzorce" }},
    ...
  ],
  "hashtags": [...],
  "image_prompt": "...",
  "call_to_action": "...",
  "recommended_variation": 0
}}
"""
    else:
        var_instruction = """
Formát odpovědi (PŘESNĚ, JSON):
{
  "caption": "text postu...",
  "hashtags": ["#tag1", ...],
  "image_prompt": "detailed English description...",
  "call_to_action": "výzva k akci",
  "hook_formula": "název použitého vzorce"
}
"""

    prompt = f"""{BRAND_VOICE}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ZNALOST ZNAČKY (znáš celou platformu do detailu):
{knowledge_section}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ÚKOL: Vytvoř post pro {platform.upper()} na téma: **{topic}**
Typ postu: {post_type}

INSTRUKCE PRO TENTO TYP:
{type_instruction}
{astro_section}
{blog_section}
{blog_tips}
{tool_tip}
{variety_section}

DŮLEŽITÉ PRO ODKAZOVÁNÍ:
- Pokud je téma relevantní, přirozeně odkaž na nástroj nebo blog na mystickahvezda.cz
- Nikdy nepiš "klikni na odkaz" — místo toho vzbuď zvědavost a pak přidej URL
- Příklad: "Zajímá tě, co o tobě říká tvoje číslo osudu? Na mystickahvezda.cz/kalkulacka-cisla-osudu.html to zjistíš za minutu ✨"
- Nemusíš odkazovat v každém postu — jen když to přirozeně sedí

HOOK — začátek postu (klíčové!):
Zvol jeden z těchto nepoužitých vzorců:
{hooks_text}

CAPTION POŽADAVKY:
- Jazyk: čeština, přirozený tok
- Délka: {'max 150 slov' if platform == 'instagram' else 'max 250 slov'}
- Struktura: HOOK → HODNOTA/PŘÍBĚH → INSIGHT → CTA
- Emoji: 2-4 strategicky, ne dekorativně
- NESMÍŠ použít fráze ze zakázaného seznamu výše

HASHTAGS ({min(max_hashtags, 20)} tagů):
- Vždy: #mystickahvezda
- Mix: česky (#tarot #numerologie) + anglicky (#spirituality #tarotreading)
- Niche tagy specifické pro téma
- Žádné generické (#love #life #inspiration)

IMAGE PROMPT (pro Imagen 3, anglicky):
- Konkrétní, neobvyklý vizuál (ne jen "tarot cards on table")
- Specifické osvětlení, kompozice, atmosféra
- Brand estetika: hluboká tmavá fialová, zlaté akcenty, hvězdné motivy
- NO text, NO people, photorealistic OR painterly style
- Příklad kvality: "Close-up of weathered tarot card The Moon lying on dark velvet,
  dewdrops on silver moonstone crystals beside it, single candle flame reflection,
  deep indigo and gold color palette, shallow depth of field"

{var_instruction}"""

    response = _call_gemini(
        client, model_name, prompt,
        config_obj=genai_types.GenerateContentConfig(
            temperature=0.8,
            top_p=0.92,
            response_mime_type="application/json",
        ),
    )

    result = _parse_json_response(response.text)

    if result is None:
        # Fallback
        return {
            "caption": response.text[:500],
            "hashtags": config.BASE_HASHTAGS[:max_hashtags],
            "image_prompt": f"mystical {topic}, deep purple velvet background, golden candlelight, cosmic atmosphere, no text",
            "call_to_action": "Jaká je tvoje zkušenost? Napiš nám 💜",
            "hook_formula": "fallback",
        }

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
    client, model_name = setup_gemini()

    try:
        astro = get_full_astrological_context()
    except Exception:
        log.warning("Nepodařilo se získat astro kontext pro stories")
        astro = {"content_brief": ""}

    # Znalostní báze (kompaktní — šetříme tokeny u stories)
    tool = find_relevant_tool(topic)
    tool_tip = ""
    if tool:
        tool_tip = f"\nRelevantní nástroj na webu: {tool['name']} ({config.WEBSITE_URL}{tool.get('url', '')})"

    blogs = find_relevant_blog(topic, 1)
    blog_tip = ""
    if blogs:
        blog_tip = f"\nRelevantní článek: {blogs[0]['title']} ({config.WEBSITE_URL}/blog/{blogs[0]['slug']}.html)"

    prompt = f"""{BRAND_VOICE}

Vytvoř sérii {story_count} Instagram STORIES pro téma: **{topic}**

Aktuální kontext: {astro['content_brief']}
{tool_tip}
{blog_tip}

Stories jsou:
- Každý slide max 15-20 slov textu (čte se za 3 vteřiny)
- Dynamické, "klikej dál" energie
- Mohou mít interaktivní prvky (hlasování, otázka, quiz)

Vygeneruj JSON pole:
[
  {{
    "slide": 1,
    "type": "hook|info|question|poll|reveal|cta",
    "text": "krátký text pro slide (max 20 slov)",
    "visual": "popis vizuálu v angličtině",
    "interactive": "typ interakce nebo null (poll: 'Ano/Ne', question: 'text otázky', quiz: ['A','B','C'])",
    "sticker_suggestion": "jaký Instagram sticker použít nebo null"
  }},
  ...
]

Slide 1: silný hook (otázka nebo šokující tvrzení)
Slide 2-4: obsah/hodnota
Slide 5: reveal nebo shrnutí
Slide {story_count}: CTA (přejdi na profil, link v biu, atd.)"""

    response = _call_gemini(client, model_name, prompt)

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
    client, model_name = setup_gemini()

    # Znalostní báze — relevantní nástroj a blog
    tool = find_relevant_tool(topic)
    tool_tip = ""
    if tool:
        tool_tip = f"\nRelevantní nástroj na webu: {tool['name']} ({config.WEBSITE_URL}{tool.get('url', '')})"

    blogs = find_relevant_blog(topic, 2)
    blog_tip = ""
    if blogs:
        blog_tip = "\nRelevantní články: " + "; ".join(
            f"{b['title']} ({config.WEBSITE_URL}/blog/{b['slug']}.html)" for b in blogs
        )

    prompt = f"""{BRAND_VOICE}

Vytvoř KARUSEL obsah pro {platform.upper()} na téma: **{topic}**
Počet slidů: {slides}
{tool_tip}
{blog_tip}

Karusely fungují na Instagram skvěle protože:
- Algoritmus preferuje posty kde lidé "přejedou doprava"
- Vzdělávací karusely se ukládají a sdílí
- Lze řadit do série (mini-kurz)

Struktura:
- Slide 1: Silný hook cover (co se čtenář dozví)
- Slide 2-{slides-1}: Obsah (každý slide = 1 konkrétní bod)
- Slide {slides}: Souhrn + CTA

Odpověz JSON:
{{
  "cover_caption": "krátký teaser pro feed (max 80 slov) + 'přejeď doprava →'",
  "hashtags": ["#tag1", ...],
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
  "image_prompt_cover": "detailed English prompt for cover image"
}}"""

    response = _call_gemini(client, model_name, prompt)
    result = _parse_json_response(response.text)

    if result is None:
        return {
            "cover_caption": f"Vše co potřebuješ vědět o {topic} → přejeď doprava",
            "hashtags": config.BASE_HASHTAGS,
            "slides": [{"slide": i, "headline": f"Bod {i}", "body": "", "visual": "", "design_note": ""}
                       for i in range(1, slides+1)],
            "image_prompt_cover": f"mystical {topic} themed cover for carousel",
        }

    return result


# ============================================================
# ODPOVĚDI NA KOMENTÁŘE
# ============================================================

def generate_comment_reply(
    original_comment: str,
    post_topic: str,
    tone: str = "friendly",
    post_context: str = "",
) -> str:
    """
    Generuje lidskou, přirozenou odpověď na komentář.
    Detekuje typ komentáře (otázka, pochvala, negativní, osobní příběh).
    """
    client, model_name = setup_gemini()

    tone_map = {
        "friendly": "teplý, přátelský, jako by odpovídala kamarádka",
        "empathetic": "hluboce empatický, uznal/a osobní příběh, podpůrný",
        "educational": "informativní ale přátelský, přidej 1 hodnotnou informaci",
        "playful": "lehký, s lehkým humorem pokud to sedí",
    }
    tone_desc = tone_map.get(tone, tone_map["friendly"])

    # Detekce typu komentáře
    comment_lower = original_comment.lower()
    if "?" in original_comment:
        comment_type = "otázka — odpověz přímo a konkrétně"
    elif any(w in comment_lower for w in ["díky", "dekuji", "super", "skvělé", "báječné", "❤", "💜", "krásné"]):
        comment_type = "pochvala — přijmi vděčně, přidej osobní touch"
    elif any(w in comment_lower for w in ["nevím", "pochybuji", "nefunguje", "nevěřím"]):
        comment_type = "skeptický komentář — uznej pohled, reaguj laskavě bez obrannosti"
    else:
        comment_type = "obecný komentář — zapoj ho, potvrď jeho zážitek"

    # Znalostní báze pro odpovědi (kompaktní + FAQ)
    comment_knowledge = build_knowledge_prompt(
        include_tools=True,
        include_pricing=True,
        include_blog=False,  # šetříme tokeny u komentářů
        include_usp=True,
        include_faq=True,
        compact=True,
    )

    # Najdi relevantní nástroj/blog pro doporučení v odpovědi
    tool = find_relevant_tool(original_comment) or find_relevant_tool(post_topic)
    relevant_blogs = find_relevant_blog(original_comment, max_results=2)
    recommendation = ""
    if tool:
        recommendation += f"\nMůžeš doporučit nástroj: {tool['name']} ({config.WEBSITE_URL}{tool.get('url', '')})"
    if relevant_blogs:
        recommendation += "\nMůžeš odkázat na článek: " + relevant_blogs[0]['title'] + f" ({config.WEBSITE_URL}/blog/{relevant_blogs[0]['slug']}.html)"

    prompt = f"""{BRAND_VOICE}

{comment_knowledge}

Jsi community manager Mystické Hvězdy, odpovídáš na komentář.
ZNÁŠ CELOU PLATFORMU — nástroje, ceník, blog články. Využij je v odpovědích.

Post byl o: "{post_topic}"
{f'Kontext postu: {post_context}' if post_context else ''}
Komentář: "{original_comment}"
Typ komentáře: {comment_type}
Tón: {tone_desc}
{recommendation}

PRAVIDLA ODPOVĚDI:
- Max 2-3 věty (kratší = přirozenější)
- Lidský tón, NE robotický nebo firemní
- Nezačínaj "Ahoj!" pokud to nesedí přirozeně
- Nezačínaj "Děkujeme za komentář" (příliš korporátní)
- Použij max 1 emoji
- Pokud je otázka, odpověz konkrétně (ne "dobrou otázku!")
- Případně vrať otázku zpět ("a ty, jak to cítíš?")

GUARDRAILS — BEZPEČNOSTNÍ HRANICE (DODRŽUJ VŽDY):
- NIKDY neodpovídej na témata mimo oblast Mystické Hvězdy (astrologie, tarot, krystaly,
  numerologie, rituály, meditace, duchovní růst, energetická práce, lunární cykly, čakry, bylinky v kontextu mystiky).
- Pokud je komentář MIMO TÉMA (recepty, politika, sport, technologie, finance, medicínské rady,
  právní otázky, osobní útoky, náboženská kázání, prodej cizích produktů apod.):
  → Odpověz laskavě že se zaměřujete na mystiku a duchovní cesty, a nabídni něco z vašeho světa.
  → Příklad: "To je hezká otázka, ale my se tady věnujeme světu mystiky a energie ✨ Nechceš zkusit
    mrknout na náš článek o bylinných rituálech?"
- NIKDY nedávej medicínské, právní, finanční ani investiční rady.
  → Pokud se někdo ptá na zdravotní problém, řekni: "Tohle je spíš otázka pro odborníka,
    my se věnujeme duchovní stránce. Ale třeba meditace ti může pomoct s celkovým klidem."
- NIKDY nesdílej osobní údaje, hesla, telefonní čísla ani jiné citlivé informace.
- NIKDY neodpovídej na provokace, trolling nebo flamewars — drž klidný, pozitivní tón nebo ignoruj.
- NIKDY neodpovídej způsobem, který by mohl poškodit pověst značky (vulgarity, kontroverze, sliby uzdravení apod.).
- NETVAŘ SE jako odborník na cokoliv mimo mystiku — pokud nevíš, řekni upřímně že nevíš.
- NIKDY NEPŘIZNEJ ŽE JSI AI — jsi tým Mystické Hvězdy. Pokud se někdo ptá "Jsi bot?",
  odpověz: "Za Mystickou Hvězdou stojí tým lidí, kteří žijí mystikou každý den ✨"
- NIKDY nepoužívej slova: AI, bot, umělá inteligence, algoritmus, model, generováno.

ODKAZOVÁNÍ NA PLATFORMU:
- Pokud je otázka relevantní, přirozeně doporuč konkrétní nástroj na mystickahvezda.cz
  Příklad: "Hele, zkus si vytáhnout kartu na mystickahvezda.cz/tarot-zdarma.html — dnes je silná lunární energie."
- Nebuď agresivně prodejní — odkazuj jen když to přirozeně sedí k otázce
- Pokud se ptají na cenu: "Máme spoustu věcí zdarma, a prémiové plány začínají na 199 Kč/měsíc s 7denním trialem."
- Pokud se ptají na konkrétní funkci, dej přesný odkaz

Odpověz POUZE textem odpovědi. Nic jiného."""

    response = _call_gemini(
        client, model_name, prompt,
        config_obj=genai_types.GenerateContentConfig(temperature=0.7),
    )
    return response.text.strip()


# ============================================================
# TÝDENNÍ PLÁN
# ============================================================

def generate_weekly_content_plan(
    week_number: int,
    year: int = 2026,
) -> list[dict]:
    """
    Generuje týdenní plán s ohledem na:
    - Aktuální lunární cyklus
    - Sluneční znamení
    - Anti-repetition (nepoužívá témata z minulých 14 dní)
    - Různorodost typů postů
    """
    client, model_name = setup_gemini()

    from datetime import date, timedelta
    # Zjisti datum pro daný týden
    jan1 = date(year, 1, 1)
    week_start = jan1 + timedelta(weeks=week_number - 1)
    week_start -= timedelta(days=week_start.weekday())  # Pondělí

    # Lunární kontext pro každý den týdne
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

    # Anti-repetition
    variety = get_variety_context()
    avoid_text = variety.get("avoid_instruction", "")

    contexts_text = "\n".join(
        f"  {d['day_name']} ({d['date']}): Měsíc={d['moon']}, energie='{d['moon_energy']}', Num.den={d['universal_day']}"
        for d in daily_contexts
    )

    # Znalostní báze — blog články a nástroje pro plánování obsahu
    blog_knowledge = get_blog_summary_for_prompt()

    prompt = f"""{BRAND_VOICE}

Vytvoř TÝDENNÍ PLÁN OBSAHU pro Instagram/Facebook, týden č. {week_number} ({year}).
Začátek týdne: {week_start.isoformat()}

{blog_knowledge}
NÁSTROJE NA WEBU (doporuč v postech): tarot, křišťálová koule, horoskopy, numerologie,
andělské karty, runy, natální karta, partnerská shoda, šamanské kolo, snář, biorytmy.
Web: {config.WEBSITE_URL}

DENNÍ ASTROLOGICKÝ KONTEXT (POVINNĚ zohledni!):
{contexts_text}

DOSTUPNÉ TYPY POSTŮ (použij každý max 2x):
educational, quote, question, tip, daily_energy, blog_promo, myth_bust, story, challenge, carousel_plan

DOSTUPNÁ TÉMATA: {', '.join(config.CONTENT_THEMES)}

{avoid_text}

PRAVIDLA ROZMANITOSTI:
- Pondělí: motivační (začátek týdne) — quote nebo challenge
- Úterý/Středa: vzdělávací — educational nebo myth_bust
- Čtvrtek: zapojení komunity — question nebo story
- Pátek: praktický — tip nebo ritual
- Sobota: delší obsah — carousel_plan nebo blog_promo
- Neděle: reflexivní — daily_energy nebo question (klidnější tón)

Odpověz JSON pole 7 objektů:
[
  {{
    "day": "název dne",
    "date": "YYYY-MM-DD",
    "post_type": "typ",
    "topic": "konkrétní téma (ne jen 'tarot' ale 'jak číst kartu Věže pro začátečníky')",
    "hook_formula": "název vzorce z: {list(HOOK_FORMULAS.keys())}",
    "brief": "2-3 věty co post bude obsahovat a proč sedí na tento den",
    "best_time": "HH:MM",
    "moon_connection": "jak využít lunární energii dne v postu"
  }},
  ...
]"""

    response = _call_gemini(client, model_name, prompt)

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
        hook = result.get("hook_formula", "")

        console.print(Panel(
            f"[dim]Hook vzorec: {hook}[/dim]\n\n"
            f"[bold]Caption:[/bold]\n{caption}\n\n"
            f"[bold]Hashtags:[/bold]\n{hashtags}\n\n"
            f"[bold]CTA:[/bold] {result.get('call_to_action', '')}",
            title="✨ Vygenerovaný Post",
            border_style="purple"
        ))
