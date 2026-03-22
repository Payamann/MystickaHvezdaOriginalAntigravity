"""
Brand Knowledge Base — kompletní znalostní báze Mystické Hvězdy.

Agent musí perfektně znát:
  1. Všechny funkce a nástroje platformy (15+ free, 25+ premium)
  2. Ceník a předplatné (4 tarify)
  3. Všechny blogové články (48+)
  4. USP a konkurenční výhody

Tato znalostní báze se injektuje do promptů pro:
  - Generování postů (text_generator.py)
  - Odpovídání na komentáře
  - Blog promo
  - Quality Gate AI review

Aktualizace: Při přidání nového článku/funkce stačí aktualizovat tento soubor.
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import config


# ══════════════════════════════════════════════════
# 1. PLATFORMA — CO MYSTICKÁ HVĚZDA NABÍZÍ
# ══════════════════════════════════════════════════

PLATFORM_OVERVIEW = """
MYSTICKÁ HVĚZDA — mystickahvezda.cz
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Webová platforma pro duchovní růst, sebepoznání a mystiku.
12 000+ aktivních uživatelů. Česky, slovensky, polsky.
Freemium model: 15+ nástrojů zdarma, prémiové funkce za předplatné.
"""

# Kompletní přehled nástrojů (co agent musí znát a umět doporučit)
TOOLS_AND_FEATURES = {
    # ── ZDARMA (POUTNÍK) ──
    "free": {
        "tarot_denni": {
            "name": "Denní tarotová karta",
            "url": "/tarot-zdarma.html",
            "description": "Jedna tarotová karta denně zdarma s personalizovaným výkladem. Ideální pro ranní inspiraci.",
            "limit": "1 karta/den",
        },
        "tarot_ano_ne": {
            "name": "Tarot Ano/Ne",
            "url": "/tarot-ano-ne.html",
            "description": "Jednoduchý tarotový výklad na otázky typu ano/ne.",
            "limit": "Neomezený",
        },
        "kristalova_koule": {
            "name": "Křišťálová koule",
            "url": "/kristalova-koule.html",
            "description": "Mystický poradce — zeptej se na cokoliv a křišťálová koule ti odpoví s hlubokou moudrostí.",
            "limit": "3 otázky/den (zdarma)",
        },
        "horoskop_denni": {
            "name": "Denní horoskop",
            "url": "/horoskopy.html",
            "description": "Denní horoskop pro všech 12 znamení, personalizovaný podle aktuálního astrologického kontextu.",
            "limit": "Neomezený",
        },
        "cinsky_horoskop": {
            "name": "Čínský horoskop",
            "url": "/cinsky-horoskop.html",
            "description": "Zjisti své čínské znamení zvířete a jeho vlastnosti.",
            "limit": "Neomezený",
        },
        "andelske_karty": {
            "name": "Andělské karty",
            "url": "/andelske-karty.html",
            "description": "Vylosuj si andělské poselství dne — karty odvahy, léčení, míru a hojnosti.",
            "limit": "1 tah/den",
        },
        "andelska_posta": {
            "name": "Andělská pošta",
            "url": "/andelska-posta.html",
            "description": "Náhodné duchovní poselství od andělů — inspirace na každý den.",
            "limit": "Neomezený",
        },
        "runy": {
            "name": "Runy (Futhark)",
            "url": "/runy.html",
            "description": "Runový výklad — severská magie s interpretací vylosované runy.",
            "limit": "1 tah/den",
        },
        "numerologie_kalkulacka": {
            "name": "Kalkulačka čísla osudu",
            "url": "/kalkulacka-cisla-osudu.html",
            "description": "Vypočítej si své životní číslo, číslo osudu, číslo duše a osobnosti.",
            "limit": "Neomezený",
        },
        "biorytmy": {
            "name": "Biorytmy",
            "url": "/biorytmy.html",
            "description": "Fyzické, emocionální a intelektuální biorytmické cykly na základě data narození.",
            "limit": "Neomezený",
        },
        "afirmace": {
            "name": "Denní afirmace",
            "url": "/afirmace.html",
            "description": "Personalizované denní afirmace pro pozitivní myšlení a manifestaci.",
            "limit": "Neomezený",
        },
        "snar": {
            "name": "Snář",
            "url": "/snar.html",
            "description": "Slovník 100+ snových symbolů s interpretacemi — co znamenají tvé sny.",
            "limit": "Neomezený",
        },
        "jmena": {
            "name": "Význam jmen",
            "url": "/jmena.html",
            "description": "Databáze 1000+ jmen s numerologií, aurou, živlem, osobnostním profilem.",
            "limit": "Neomezený",
        },
        "aura": {
            "name": "Analýza aury",
            "url": "/aura.html",
            "description": "Zjisti barvu své aury a co o tobě prozrazuje.",
            "limit": "Základní čtení",
        },
        "partnerska_shoda_basic": {
            "name": "Partnerská shoda (základní)",
            "url": "/partnerska-shoda.html",
            "description": "Procentuální kompatibilita dvou znamení. Premium verze přidává detailní synastrii.",
            "limit": "Procento shody",
        },
        "shamansko_kolo": {
            "name": "Šamanské kolo",
            "url": "/shamansko-kolo.html",
            "description": "Zjisti své totemové zvíře a co ti o tvé cestě prozrazuje.",
            "limit": "Základní totem",
        },
        "slovnik": {
            "name": "Duchovní slovník",
            "url": "/slovnik.html",
            "description": "Encyklopedie duchovních a mystických pojmů.",
            "limit": "Neomezený",
        },
    },

    # ── PREMIUM (HVĚZDNÝ PRŮVODCE+) ──
    "premium": {
        "tarot_neomezeny": {
            "name": "Neomezený tarot",
            "description": "Kolik výkladů chceš, tolik dostaneš. Žádný denní limit.",
            "min_plan": "Hvězdný Průvodce",
        },
        "kristalova_koule_neomezena": {
            "name": "Neomezená křišťálová koule",
            "description": "Bez limitu 3 otázek denně — ptej se kolikrát potřebuješ.",
            "min_plan": "Hvězdný Průvodce",
        },
        "natalni_karta": {
            "name": "Natální karta (birth chart)",
            "url": "/natalni-karta.html",
            "description": "Kompletní astrologická mapa při narození — planety, domy, aspekty s detailním výkladem.",
            "min_plan": "Hvězdný Průvodce",
        },
        "numerologicky_kod": {
            "name": "Numerologický kód",
            "description": "Hloubkový rozbor životního čísla, čísla duše, výrazu a osobního roku.",
            "min_plan": "Hvězdný Průvodce",
        },
        "lunarni_ritualy": {
            "name": "Lunární rituály",
            "description": "Rituály a guidance přizpůsobené aktuální fázi Měsíce — novoluní, úplněk, čtvrtě.",
            "min_plan": "Hvězdný Průvodce",
        },
        "minuly_zivot": {
            "name": "Minulý život",
            "url": "/minuly-zivot.html",
            "description": "Čtení z Akášických záznamů — kdo jsi byl/a v minulém životě a jaké karma neseš.",
            "min_plan": "Hvězdný Průvodce",
        },
        "tydenni_mesicni_horoskop": {
            "name": "Týdenní a měsíční horoskop",
            "description": "Podrobné předpovědi na týden a měsíc dopředu, personalizované.",
            "min_plan": "Hvězdný Průvodce",
        },
        "partnerska_synastrie": {
            "name": "Partnerská synastrie (detailní)",
            "url": "/partnerska-shoda.html",
            "description": "Kompletní porovnání dvou natálních karet — hlubší než jen znamení.",
            "min_plan": "Hvězdný Průvodce",
        },
        "astromapa": {
            "name": "Astromapa světa",
            "url": "/astro-mapa.html",
            "description": "Astrokartografie — kde na světě ti hvězdy přejí v kariéře, lásce, zdraví.",
            "min_plan": "Osvícení",
        },
        "exkluzivni_ritualy": {
            "name": "Exkluzivní personalizované rituály",
            "description": "Rituály na míru tvé natální kartě a aktuálním tranzitům.",
            "min_plan": "Osvícení",
        },
        "rocni_vize": {
            "name": "Roční vize osudu",
            "description": "Komplexní předpověď na celý rok — měsíc po měsíci.",
            "min_plan": "VIP Majestát",
        },
        "soukrome_konzultace": {
            "name": "Soukromé konzultace",
            "description": "Individuální konzultace s prioritní odpovědí do 2 hodin.",
            "min_plan": "VIP Majestát",
        },
    },
}


# ══════════════════════════════════════════════════
# 2. CENÍK A PŘEDPLATNÉ
# ══════════════════════════════════════════════════

PRICING_PLANS = {
    "poutnik": {
        "name": "Poutník",
        "name_en": "Pilgrim",
        "price_monthly": "0 Kč",
        "price_yearly": "0 Kč",
        "trial": None,
        "tagline": "Navždy zdarma — 15+ nástrojů",
        "highlights": [
            "Denní tarotová karta",
            "Ranní hvězdná zpráva",
            "Denní horoskop",
            "Křišťálová koule (3 otázky/den)",
            "Andělské karty a runy",
            "Kalkulačka čísla osudu",
            "Snář, biorytmy, afirmace",
            "Šamanské kolo, analýza aury",
        ],
    },
    "hvezdny_pruvodce": {
        "name": "Hvězdný Průvodce",
        "name_en": "Star Guide",
        "price_monthly": "199 Kč/měsíc",
        "price_yearly": "1 910 Kč/rok (úspora 20 %)",
        "trial": "7 dní zdarma",
        "tagline": "Doporučený — odemkni plný potenciál",
        "recommended": True,
        "highlights": [
            "Vše z Poutníka +",
            "Neomezený tarot a křišťálová koule",
            "Natální karta s detailním výkladem",
            "Numerologický kód",
            "Lunární rituály",
            "Minulý život (Akášické záznamy)",
            "Týdenní + měsíční horoskop",
            "Partnerská synastrie",
        ],
    },
    "osviceni": {
        "name": "Osvícení",
        "name_en": "Enlightenment",
        "price_monthly": "499 Kč/měsíc",
        "price_yearly": "4 790 Kč/rok (úspora 20 %)",
        "trial": "7 dní zdarma",
        "tagline": "Pro vášnivé hledače — exkluzivní obsah",
        "highlights": [
            "Vše z Hvězdného Průvodce +",
            "Astromapa světa (astrokartografie)",
            "Exkluzivní personalizované rituály",
            "Přednostní přístup k novinkám",
            "Prioritní podpora",
        ],
    },
    "vip_majestat": {
        "name": "VIP Majestát",
        "name_en": "VIP Majesty",
        "price_monthly": "999 Kč/měsíc",
        "price_yearly": "9 590 Kč/rok (úspora 20 %)",
        "trial": None,
        "tagline": "Ultimátní duchovní doprovod — neomezeno",
        "highlights": [
            "Vše z Osvícení +",
            "Neomezená duchovní podpora",
            "Roční vize osudu",
            "VIP odpověď do 2 hodin",
            "Soukromé konzultace",
            "24/7 prioritní podpora",
            "4× astrokartografická mapa/rok",
            "VIP rituální sety",
        ],
    },
}


# ══════════════════════════════════════════════════
# 3. BLOGOVÉ ČLÁNKY (dynamicky z blog-index.json)
# ══════════════════════════════════════════════════

def _load_blog_articles() -> list[dict]:
    """Načte blog články z JSON souboru"""
    blog_path = config.BLOG_INDEX_PATH
    if not blog_path.exists():
        return []
    with open(blog_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return data if isinstance(data, list) else data.get('articles', [])


def get_blog_knowledge() -> str:
    """Vrátí formátovaný přehled blogových článků pro prompt"""
    articles = _load_blog_articles()
    if not articles:
        return "Blog: žádné články nenalezeny."

    # Seskupit podle kategorií
    categories = {}
    for a in articles:
        cat = a.get("category", "Ostatní")
        if cat not in categories:
            categories[cat] = []
        categories[cat].append(a)

    lines = [f"BLOG MYSTICKÉ HVĚZDY — {len(articles)} článků na {config.WEBSITE_URL}/blog/"]
    lines.append("=" * 60)

    for cat, arts in sorted(categories.items()):
        lines.append(f"\n📂 {cat} ({len(arts)} článků):")
        for a in arts:
            slug = a.get("slug", "")
            title = a.get("title", "")
            desc = a.get("short_description", "")[:120]
            url = f"{config.WEBSITE_URL}/blog/{slug}.html"
            lines.append(f"  • {title}")
            lines.append(f"    {desc}")
            lines.append(f"    → {url}")

    return "\n".join(lines)


def get_blog_summary_for_prompt() -> str:
    """Kompaktní verze pro prompty (šetří tokeny)"""
    articles = _load_blog_articles()
    if not articles:
        return ""

    categories = {}
    for a in articles:
        cat = a.get("category", "Ostatní")
        if cat not in categories:
            categories[cat] = []
        categories[cat].append(a)

    lines = [f"BLOG ({len(articles)} článků) — odkazuj čtenáře na relevantní články:"]
    for cat, arts in sorted(categories.items()):
        titles = [f"\"{a['title']}\" ({config.WEBSITE_URL}/blog/{a['slug']}.html)" for a in arts[:5]]
        lines.append(f"  {cat}: {'; '.join(titles)}")
        if len(arts) > 5:
            lines.append(f"    ...a dalších {len(arts) - 5}")

    return "\n".join(lines)


# ══════════════════════════════════════════════════
# 4. USP A KONKURENČNÍ VÝHODY
# ══════════════════════════════════════════════════

USP = """
PROČ MYSTICKÁ HVĚZDA (co říkat, když se někdo ptá):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• 15+ nástrojů zdarma — nejštědřejší free tier na českém trhu
• Personalizované výklady — žádné generické texty, vše šité na míru tobě
• 12 000+ spokojených uživatelů
• Kompletní ekosystém: tarot, astrologie, numerologie, runy, sny, čakry, šamanismus
• Blog s 48+ odbornými články — vzdělávání zdarma
• Český jazyk — žádné překlady z angličtiny
• Bez reklam a clickbaitů — čistý, hodnotný obsah
• 7denní trial zdarma na premium plány
• Žádné závazky — zruš kdykoliv
"""


# ══════════════════════════════════════════════════
# 5. FAQ — ČASTÉ DOTAZY (pro odpovídání na komentáře)
# ══════════════════════════════════════════════════

FAQ = {
    "kolik_to_stoji": {
        "q": "Kolik to stojí? / Je to zdarma?",
        "a": "Máme 15+ nástrojů úplně zdarma (tarot, horoskopy, numerologie, runy...). Premium plány od 199 Kč/měsíc odemknou neomezený tarot, natální kartu a mnohem víc. Můžeš vyzkoušet 7 dní zdarma.",
    },
    "jak_zacit": {
        "q": "Jak začít? / Kde se přihlásit?",
        "a": "Stačí navštívit mystickahvezda.cz — většina nástrojů funguje hned bez registrace. Pro ukládání výkladů a premium funkce si vytvoř bezplatný účet.",
    },
    "je_to_presne": {
        "q": "Je to přesné? / Funguje to?",
        "a": "Naše výklady jsou hluboce personalizované na základě tvého data narození a aktuální pozice planet. Nejsou to náhodné texty — každý rozbor vychází z tisíců astrologických a tarotových zdrojů.",
    },
    "rozdil_free_premium": {
        "q": "Jaký je rozdíl mezi free a premium?",
        "a": "Free ti dává denní tarot, horoskop, numerologii a dalších 15+ nástrojů. Premium odemkne neomezený tarot, natální kartu s detailním výkladem, minulé životy, lunární rituály a týdenní/měsíční horoskopy.",
    },
    "natalni_karta": {
        "q": "Co je natální karta?",
        "a": "Natální karta je astrologická mapa nebe v okamžiku tvého narození. Ukazuje pozice všech planet, tvůj ascendent a astrologické domy. Na mystickahvezda.cz/natalni-karta.html ti ji kompletně vyložíme.",
    },
    "jak_zrusit": {
        "q": "Jak zrušit předplatné?",
        "a": "V profilu klikni na Správa předplatného → Zrušit. Žádné závazky, zrušíš kdykoliv a do konce fakturačního období ti premium zůstane.",
    },
    "bezpecnost_dat": {
        "q": "Jsou moje data v bezpečí?",
        "a": "Ano. Tvé osobní údaje jsou šifrované a nikdy je nesdílíme s třetími stranami. Výklady jsou soukromé a přístupné jen tobě.",
    },
}


# ══════════════════════════════════════════════════
# 6. PROMPT BUILDER — SESTAVÍ ZNALOSTNÍ KONTEXT
# ══════════════════════════════════════════════════

def build_knowledge_prompt(
    include_tools: bool = True,
    include_pricing: bool = True,
    include_blog: bool = True,
    include_usp: bool = True,
    include_faq: bool = False,
    compact: bool = True,
) -> str:
    """
    Sestaví znalostní kontext pro injekci do Gemini promptu.

    Args:
        include_tools: přehled nástrojů platformy
        include_pricing: ceník a tarify
        include_blog: blogové články
        include_usp: USP a výhody
        include_faq: FAQ (hlavně pro komentáře)
        compact: kompaktní verze (šetří tokeny)

    Returns:
        str: formátovaný text pro prompt
    """
    sections = []
    sections.append(PLATFORM_OVERVIEW.strip())

    if include_tools:
        if compact:
            # Kompaktní verze — jen názvy a popis
            free_tools = [f"• {t['name']} ({t['url'] if 'url' in t else 'N/A'}) — {t['description'][:80]}"
                         for t in TOOLS_AND_FEATURES["free"].values()]
            premium_tools = [f"• {t['name']} [{t['min_plan']}] — {t['description'][:80]}"
                           for t in TOOLS_AND_FEATURES["premium"].values()]
            sections.append(
                "NÁSTROJE ZDARMA:\n" + "\n".join(free_tools) +
                "\n\nPRÉMIOVÉ NÁSTROJE:\n" + "\n".join(premium_tools)
            )
        else:
            # Plná verze
            sections.append("NÁSTROJE ZDARMA (15+):")
            for key, tool in TOOLS_AND_FEATURES["free"].items():
                sections.append(
                    f"  {tool['name']}: {tool['description']} "
                    f"[Limit: {tool.get('limit', 'N/A')}] "
                    f"URL: {config.WEBSITE_URL}{tool.get('url', '')}"
                )
            sections.append("\nPRÉMIOVÉ NÁSTROJE:")
            for key, tool in TOOLS_AND_FEATURES["premium"].items():
                sections.append(
                    f"  {tool['name']}: {tool['description']} "
                    f"[Min. tarif: {tool.get('min_plan', 'Premium')}]"
                )

    if include_pricing:
        pricing_lines = ["CENÍK:"]
        for key, plan in PRICING_PLANS.items():
            rec = " ⭐ DOPORUČENÝ" if plan.get("recommended") else ""
            trial = f" | Trial: {plan['trial']}" if plan.get('trial') else ""
            pricing_lines.append(
                f"  {plan['name']} ({plan['name_en']}): "
                f"{plan['price_monthly']}{trial}{rec}"
            )
            if compact:
                pricing_lines.append(f"    → {', '.join(plan['highlights'][:4])}")
            else:
                for h in plan["highlights"]:
                    pricing_lines.append(f"    • {h}")
        sections.append("\n".join(pricing_lines))

    if include_blog:
        if compact:
            sections.append(get_blog_summary_for_prompt())
        else:
            sections.append(get_blog_knowledge())

    if include_usp:
        sections.append(USP.strip())

    if include_faq:
        faq_lines = ["ČASTÉ DOTAZY (pro odpovídání na komentáře):"]
        for key, item in FAQ.items():
            faq_lines.append(f"  Q: {item['q']}")
            faq_lines.append(f"  A: {item['a']}")
        sections.append("\n".join(faq_lines))

    return "\n\n".join(sections)


# ══════════════════════════════════════════════════
# QUICK ACCESS HELPERS
# ══════════════════════════════════════════════════

def find_relevant_tool(topic: str) -> dict | None:
    """Najde nejrelevantnější nástroj k danému tématu"""
    topic_lower = topic.lower()
    all_tools = {**TOOLS_AND_FEATURES["free"], **TOOLS_AND_FEATURES["premium"]}

    keyword_map = {
        "tarot": ["tarot_denni", "tarot_ano_ne", "tarot_neomezeny"],
        "karta": ["tarot_denni", "tarot_neomezeny", "natalni_karta"],
        "horoskop": ["horoskop_denni", "tydenni_mesicni_horoskop"],
        "znamení": ["horoskop_denni", "partnerska_shoda_basic", "partnerska_synastrie"],
        "numerolog": ["numerologie_kalkulacka", "numerologicky_kod"],
        "číslo": ["numerologie_kalkulacka", "numerologicky_kod"],
        "krystal": ["kristalova_koule", "kristalova_koule_neomezena"],
        "koule": ["kristalova_koule", "kristalova_koule_neomezena"],
        "partner": ["partnerska_shoda_basic", "partnerska_synastrie"],
        "vztah": ["partnerska_shoda_basic", "partnerska_synastrie"],
        "kompatibil": ["partnerska_shoda_basic", "partnerska_synastrie"],
        "syn": ["partnerska_synastrie"],
        "natální": ["natalni_karta"],
        "birth chart": ["natalni_karta"],
        "anděl": ["andelske_karty", "andelska_posta"],
        "run": ["runy"],
        "sen": ["snar"],
        "snář": ["snar"],
        "biorytm": ["biorytmy"],
        "afirmac": ["afirmace"],
        "aura": ["aura"],
        "jméno": ["jmena"],
        "měsíc": ["lunarni_ritualy"],
        "lunár": ["lunarni_ritualy"],
        "rituál": ["lunarni_ritualy", "exkluzivni_ritualy"],
        "minulý život": ["minuly_zivot"],
        "minuly zivot": ["minuly_zivot"],
        "minulý": ["minuly_zivot"],
        "akáš": ["minuly_zivot"],
        "akas": ["minuly_zivot"],
        "karma": ["minuly_zivot"],
        "šaman": ["shamansko_kolo"],
        "totem": ["shamansko_kolo"],
        "astromap": ["astromapa"],
        "kartografi": ["astromapa"],
        "čínský": ["cinsky_horoskop"],
        "cinsky": ["cinsky_horoskop"],
        "slovník": ["slovnik"],
        "slovnik": ["slovnik"],
        "čakr": ["aura"],
        "cakr": ["aura"],
        "snář": ["snar"],
        "snar": ["snar"],
    }

    for keyword, tool_keys in keyword_map.items():
        if keyword in topic_lower:
            for tk in tool_keys:
                if tk in all_tools:
                    tool = all_tools[tk].copy()  # Kopie — nemutujeme originál
                    tool["key"] = tk
                    return tool

    return None


def find_relevant_blog(topic: str, max_results: int = 3) -> list[dict]:
    """Najde nejrelevantnější blogové články k danému tématu"""
    articles = _load_blog_articles()
    topic_lower = topic.lower()

    # Normalizace diakritiky pro lepší matching
    def _normalize(text: str) -> str:
        replacements = {'á':'a','č':'c','ď':'d','é':'e','ě':'e','í':'i','ň':'n',
                        'ó':'o','ř':'r','š':'s','ť':'t','ú':'u','ů':'u','ý':'y','ž':'z'}
        for k, v in replacements.items():
            text = text.replace(k, v)
        return text

    topic_norm = _normalize(topic_lower)

    scored = []
    for a in articles:
        score = 0
        title_lower = a.get("title", "").lower()
        desc_lower = a.get("short_description", "").lower()
        slug_lower = a.get("slug", "").lower()
        cat_lower = a.get("category", "").lower()
        title_norm = _normalize(title_lower)
        desc_norm = _normalize(desc_lower)
        cat_norm = _normalize(cat_lower)

        # Exact match v kategorii
        if topic_lower in cat_lower or topic_norm in cat_norm or topic_lower in cat_norm or topic_norm in cat_lower:
            score += 5
        # Klíčová slova v názvu, popisu, slugu
        for word in topic_lower.split():
            if len(word) > 2:
                word_norm = _normalize(word)
                # Stem: kořen slova (min 4 znaky) pro flexibilní matching
                stem = word_norm[:max(4, len(word_norm) - 2)] if len(word_norm) >= 4 else word_norm
                searchable = title_lower + " " + title_norm + " " + desc_lower + " " + desc_norm + " " + slug_lower
                if word in searchable or word_norm in searchable or stem in searchable:
                    # Výpočet skóre podle kde se match našel
                    if word in title_lower or word_norm in title_norm or stem in title_norm:
                        score += 3
                    if word in desc_lower or word_norm in desc_norm or stem in desc_norm:
                        score += 1
                    if word in slug_lower or word_norm in slug_lower or stem in slug_lower:
                        score += 2

        if score > 0:
            scored.append((score, a))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [a for _, a in scored[:max_results]]


# ══════════════════════════════════════════════════
# CLI TEST
# ══════════════════════════════════════════════════

if __name__ == "__main__":
    from rich.console import Console
    from rich.panel import Panel

    console = Console()

    # Ukázka kompaktního promptu
    prompt = build_knowledge_prompt(compact=True)
    console.print(Panel(
        prompt[:2000] + "\n...(zkráceno)",
        title="Knowledge Prompt (compact)",
        border_style="cyan",
    ))

    # Test vyhledávání
    console.print("\n[bold]Test find_relevant_tool:[/bold]")
    for q in ["tarot", "numerologie", "partnerská shoda", "minulý život"]:
        tool = find_relevant_tool(q)
        if tool:
            console.print(f"  '{q}' → {tool['name']} ({tool.get('url', 'premium')})")

    console.print("\n[bold]Test find_relevant_blog:[/bold]")
    for q in ["tarot", "retrográdní merkur", "čakry"]:
        blogs = find_relevant_blog(q)
        console.print(f"  '{q}' → {[b['title'][:40] for b in blogs]}")
