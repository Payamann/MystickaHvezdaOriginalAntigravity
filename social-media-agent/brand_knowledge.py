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
Freemium model: 22 nástrojů zdarma + 13 prémiových funkcí (35 celkem).
"""

# Kompletní přehled nástrojů (co agent musí znát a umět doporučit)
TOOLS_AND_FEATURES = {
    # ── ZDARMA (POUTNÍK) ──
    "free": {
        "tarot_denni": {
            "name": "Denní tarotová karta",
            "url": "/tarot.html",
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
            "name": "Numerologie",
            "url": "/numerologie.html",
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
            "url": "/jmena/",
            "description": "Databáze 1000+ jmen s numerologií, aurou, živlem, osobnostním profilem.",
            "limit": "Neomezený",
        },
        "lunace": {
            "name": "Lunární fáze",
            "url": "/lunace.html",
            "description": "Dnešní lunární fáze, personalizované rituály podle znamení a aktuální fáze Měsíce. 96 unikátních kombinací rituálů (12 znamení × 8 fází).",
            "limit": "Neomezený (bez registrace)",
        },
        "testy": {
            "name": "Mystické testy",
            "url": "/testy/index.html",
            "description": "7 interaktivních testů sebepoznání: Archetyp duše, Živlová rovnováha, Stín znamení, Totemový průvodce, Karmické dědictví, Barva aury, Duchovní dar intuice.",
            "limit": "Neomezený",
        },
        "ritualy": {
            "name": "Rituální průvodce",
            "url": "/ritualy/",
            "description": "Průvodce lunárními rituály krok za krokem (6 kroků, 7–12 minut). Celý rituál zdarma bez registrace. Personalizovaný podle znamení a fáze Měsíce.",
            "limit": "Neomezený (bez registrace)",
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
        "znameni_zverokruhu": {
            "name": "Znamení zvěrokruhu",
            "url": "/horoskop/index.html",
            "description": "Přehled všech 12 znamení — symbol, element, vládnoucí planeta, datum, detailní výklad.",
            "limit": "Neomezený",
        },
        "duchov_pruvodce_free": {
            "name": "Duchovní průvodce (zdarma)",
            "url": "/mentor.html",
            "description": "Chat s duchovním průvodcem — odpovídá na otázky o vztazích, kariéře a duchovní cestě. Zdarma 5 zpráv/den.",
            "limit": "5 zpráv/den",
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
        "duchov_pruvodce_premium": {
            "name": "Neomezený duchovní průvodce",
            "url": "/mentor.html",
            "description": "Neomezený chat s duchovním průvodcem bez denního limitu — otázky o vztazích, kariéře a duchovní cestě.",
            "min_plan": "Hvězdný Průvodce",
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
            "Numerologie, biorytmy, afirmace",
            "Snář, šamanské kolo, analýza aury",
            "Duchovní průvodce (5 zpráv/den)",
            "Lunární fáze a rituály (základní)",
            "Mystické testy sebepoznání (7 testů)",
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
            "Numerologický kód (hloubkový rozbor)",
            "Lunární rituály (plný přístup)",
            "Minulý život (Akášické záznamy)",
            "Týdenní + měsíční horoskop",
            "Partnerská synastrie (detailní)",
            "Neomezený chat s duchovním průvodcem",
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
• 20+ nástrojů zdarma — nejštědřejší free tier na českém trhu
• Personalizované výklady — žádné generické texty, vše šité na míru tobě
• 12 000+ spokojených uživatelů
• Kompletní ekosystém: tarot, astrologie, numerologie, runy, sny, čakry, šamanismus
• Blog s 53+ odbornými články — vzdělávání zdarma
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
        "a": "Máme 20+ nástrojů úplně zdarma (tarot, horoskopy, numerologie, runy...). Premium plány od 199 Kč/měsíc odemknou neomezený tarot, natální kartu a mnohem víc. Můžeš vyzkoušet 7 dní zdarma.",
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
        "a": "Free ti dává denní tarot, horoskop, numerologii a dalších 20+ nástrojů. Premium odemkne neomezený tarot, natální kartu s detailním výkladem, minulé životy, lunární rituály a týdenní/měsíční horoskopy.",
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
    "platebni_metody": {
        "q": "Jak mohu platit? / Jaké platební metody přijímáte?",
        "a": "Přijímáme karty Visa a Mastercard, Apple Pay a Google Pay. Platby jsou zabezpečené přes platební bránu Stripe.",
    },
    "cas_narozeni": {
        "q": "Co když neznám svůj čas narození?",
        "a": "Nevadí! Natální kartu i horoskop vytvoříme i bez přesného času. Nebudou obsahovat ascendent a rozložení domů, ale ostatní informace zůstanou plně přesné.",
    },
    "duchov_pruvodce": {
        "q": "Co je Duchovní průvodce?",
        "a": "Duchovní průvodce je náš AI chat, který ti odpovídá na otázky o vztazích, kariéře a duchovní cestě s ohledem na tvé znamení a aktuální planetární energie. Zdarma máš 5 zpráv denně, premium plán Hvězdný Průvodce odemkne neomezený přístup.",
    },
}


# ══════════════════════════════════════════════════
# 6. AUDIENCE PERSONA — KOMU PÍŠEME
# ══════════════════════════════════════════════════

AUDIENCE_PERSONA = """
CÍLOVÉ PUBLIKUM — komu píšeš:

PRIMÁRNÍ PERSONA: "Klára" — 28-42 let, žena (85% publika), žije v ČR/SR
  Životní situace: Hledá smysl, prochází změnou (vztah, práce, sebehodnota)
  Znalost mystiky: Středně pokročilá — zná znamení, základy tarotu, sleduje horoskopy
  Co hledá: Praktické návody (ne teorie), validaci intuice, komunitu bez posuzování
  Bolesti: "Cítím, že je toho víc, ale nevím kde začít" / "Okolí mě za to soudí"
  Jazyk: Mluví česky, občas anglické pojmy (manifestace, healing, energy)
  Chování na IG: Scrolluje večer, ukládá tipy/rituály, sdílí citáty do stories
  Co ji zastaví: Osobní otázka, překvapivý fakt, "tohle jsem nevěděla"
  Co ji odradí: Korporátní tón, povrchní "buď pozitivní", agresivní prodej

SEKUNDÁRNÍ PERSONA: "Martin" — 32-50 let, muž (15% publika)
  Přístup: Analytičtější, zajímá ho systém za mystikou (numerologie, astrologie jako systém)
  Co hledá: Data, strukturu, logiku v duchovním — ne emoce bez kontextu

PRAVIDLA TÓNU:
- Piš jako moudrá kamarádka, ne jako guru nebo učitelka
- Čtenář se musí cítit pochopený, ne poučovaný
- Používej "ty" (ne "vy"), přímé oslovení
- Sdílej znalost jako "tohle mě fascinuje" — ne "musíš vědět"
- Validuj čtenářovy pocity: "Pokud cítíš X, máš pravdu — tady je proč"
"""

# ══════════════════════════════════════════════════
# 6b. PROBLEM-SOLUTION MAPPING — jaký nástroj na jaký problém
# ══════════════════════════════════════════════════

PROBLEM_SOLUTION_MAP = {
    "vztahy": {
        "label": "Vztahové problémy",
        "problems": ["Nefungující vztah", "Hledám spřízněnou duši", "Karmický partner", "Rozchod"],
        "tools_free": ["partnerska_shoda_basic", "tarot_ano_ne", "kristalova_koule"],
        "tools_premium": ["partnerska_synastrie", "minuly_zivot"],
        "upgrade_hook": "Synastrie ukáže hlubokou dynamiku, kterou základní shoda neodhalí.",
    },
    "kariéra": {
        "label": "Kariéra a životní účel",
        "problems": ["Nevím co dělat se životem", "Nespokojený v práci", "Hledám smysl"],
        "tools_free": ["numerologie_kalkulacka", "horoskop_denni", "duchov_pruvodce"],
        "tools_premium": ["numerologicky_kod", "natalni_karta", "rocni_vize"],
        "upgrade_hook": "Numerologický kód odhalí tvé životní poslání a talenty zapsané v tvém datu narození.",
    },
    "sebepoznání": {
        "label": "Kdo jsem? Sebepoznání",
        "problems": ["Hledám sebe", "Neznám se", "Chci se pochopit hlouběji"],
        "tools_free": ["testy", "aura", "znameni_zverokruhu", "biorytmy"],
        "tools_premium": ["natalni_karta", "minuly_zivot", "astromapa"],
        "upgrade_hook": "Natální karta je nejkompletnější mapa tvé osobnosti — planety, domy, aspekty.",
    },
    "denní_vedení": {
        "label": "Každodenní inspirace a vedení",
        "problems": ["Potřebuji vodítko na den", "Co mi říkají karty?", "Jaký je dnes den?"],
        "tools_free": ["tarot_denni", "horoskop_denni", "andelske_karty", "afirmace"],
        "tools_premium": ["tarot_neomezeny", "tydenni_mesicni_horoskop"],
        "upgrade_hook": "Neomezený tarot = ptej se kolikrát chceš, na cokoliv, bez limitu.",
    },
    "duchovní_praxe": {
        "label": "Duchovní praxe a rituály",
        "problems": ["Jak začít meditovat", "Chci rituál na novoluní", "Jak pracovat s krystaly"],
        "tools_free": ["ritualy", "lunace", "shamansko_kolo"],
        "tools_premium": ["lunarni_ritualy", "exkluzivni_ritualy"],
        "upgrade_hook": "Lunární rituály jsou přesně navázané na aktuální fázi Měsíce a tvé znamení.",
    },
}


# ══════════════════════════════════════════════════
# 6c. RELATABLE SCENARIOS — životní situace čtenáře
# ══════════════════════════════════════════════════

RELATABLE_SCENARIOS = {
    "tarot": [
        "Sedíš večer sama, v hlavě ti krouží otázka, na kterou nemáš odpověď. Otevřeš aplikaci a vytáhneš kartu...",
        "Kamarádka ti říká 'to je jen kus papíru'. Ale ty víš, že ta karta dnes trefila přesně to, co cítíš.",
        "Ráno před prací. Minutka pro sebe. Jedna karta. A najednou víš, s jakým záměrem do dne vstoupíš.",
    ],
    "astrologie": [
        "Scrolluješ IG ve 23:00 a ptáš se — proč mě dnes všechno vytáčí? Pak zjistíš, že Mars je v opozici...",
        "Rodiče ti říkají 'přestaň řešit horoskopy'. Ale ty víš, že porozumět svým planetám = porozumět sobě.",
        "Retrográdní Merkur. Všichni se smějí. Ty ale víš, že jde o víc než zmeškané autobusy.",
    ],
    "numerologie": [
        "Tvoje datum narození. Jen čísla? Ne — je v nich zakódovaný tvůj životní příběh.",
        "Pořád vidíš stejná čísla — 11:11, 22:22. Náhoda? Nebo zpráva, kterou jsi dosud nepřečetla?",
    ],
    "vztahy": [
        "Ten vztah, který bolel nejvíc — co když nebyl chyba, ale lekce, kterou jsi potřebovala?",
        "Pondělní ráno, budík zvoní a ty přemýšlíš — jsem s tím správným člověkem?",
        "Rozchod. Prázdný byt. A otázka: bylo to karmické, nebo spřízněná duše, která odešla příliš brzy?",
    ],
    "meditace": [
        "Říkáš si 'nemám čas meditovat'. Ale 3 minuty máš. Vždycky.",
        "Sedíš v tichu a myšlenky křičí. To je v pořádku. Meditace není ticho — je to pozorování.",
    ],
    "energie": [
        "Jsou dny, kdy cítíš, že tě něco tíží — a nejde to vysvětlit logicky. Energie se nemýlí.",
        "Vstaneš a bez důvodu se cítíš lehká. Podíváš se na Měsíc — a všechno dává smysl.",
    ],
    "krystaly": [
        "Držíš v ruce ametyst a nevíš proč, ale cítíš klid. Není to placebo — je to rezonance.",
        "Kamarádka ti dala růženín. 'Na lásku,' řekla. Za měsíc potkáváš někoho nového...",
    ],
    "rituály": [
        "Zapálíš svíčku, zavřeš oči a řekneš si záměr. Nic složitého — a přesto se něco změní.",
        "Novoluní. Čistý papír. Píšeš, co chceš přivolat. Za měsíc se podíváš zpátky — a žasneš.",
    ],
    "shadow_work": [
        "To, co na druhých nesnášíš — je tvůj stín. A teprve když se mu podíváš do očí, přestane řídit tvůj život.",
        "Pláčeš a nevíš proč. Možná je čas podívat se na to, co sis celé roky nedovolila cítit.",
    ],
    "sny": [
        "Ten sen, co se ti zdá pořád dokola — tvé podvědomí se ti snaží něco říct.",
        "Probudíš se s pocitem, který nedokážeš pojmenovat. Ale víš, že ten sen byl důležitý.",
    ],
    "general": [
        "Scrolluješ feedem a hledáš něco, co ti dá víc než prázdné citáty. Jsi na správném místě.",
        "Někdy máš pocit, že je toho víc, než vidíš. A máš pravdu.",
        "Tvé okolí tomu třeba nerozumí. Ale tady — tady to nemusíš nikomu vysvětlovat.",
    ],
}


def get_relatable_scenario(topic: str) -> str:
    """Vybere ztotožnitelný scénář podle tématu pro injekci do promptu."""
    import random
    topic_lower = topic.lower()

    # Map topic to scenario category
    category_map = {
        "tarot": ["tarot", "kart", "výklad"],
        "astrologie": ["astro", "horoskop", "planeta", "znamení", "retrográd", "mars", "venuš"],
        "numerologie": ["numero", "číslo", "životní číslo"],
        "vztahy": ["vztah", "partner", "lásk", "karm", "spříz", "rozchod", "duše"],
        "meditace": ["medita", "mindful", "dech"],
        "energie": ["energi", "čakr", "aura", "vibrac"],
        "krystaly": ["krystal", "minerál", "ametyst", "růženín"],
        "rituály": ["rituál", "svíčk", "magie", "novoluní", "sabbat"],
        "shadow_work": ["shadow", "stín", "léčení", "vnitřní"],
        "sny": ["sen", "sn", "snář"],
    }

    for category, keywords in category_map.items():
        if any(kw in topic_lower for kw in keywords):
            return random.choice(RELATABLE_SCENARIOS[category])

    return random.choice(RELATABLE_SCENARIOS["general"])


def get_problem_solution(topic: str) -> str:
    """Najde relevantní problem-solution mapping pro téma a vrátí prompt text."""
    topic_lower = topic.lower()

    # Mapping témat na kategorie
    topic_map = {
        "vztahy": ["vztah", "partner", "lásk", "karm", "spříz", "rozchod", "duše"],
        "kariéra": ["kariér", "práce", "účel", "poslání", "smysl", "povolání"],
        "sebepoznání": ["sebe", "kdo jsem", "osobnost", "identit", "shadow", "stín"],
        "denní_vedení": ["denní", "dnes", "inspirac", "ráno", "vedení"],
        "duchovní_praxe": ["rituál", "meditac", "krystal", "čakr", "praxe", "lunární"],
    }

    for category, keywords in topic_map.items():
        if any(kw in topic_lower for kw in keywords):
            ps = PROBLEM_SOLUTION_MAP[category]
            free_tools = [TOOLS_AND_FEATURES["free"].get(t, {}).get("name", t) for t in ps["tools_free"]]
            premium_tools = [TOOLS_AND_FEATURES["premium"].get(t, {}).get("name", t) for t in ps["tools_premium"]]
            return (
                f"DOPORUČENÍ NÁSTROJŮ pro téma '{topic}':\n"
                f"  Zdarma: {', '.join(free_tools)}\n"
                f"  Premium: {', '.join(premium_tools)}\n"
                f"  Upgrade hook: \"{ps['upgrade_hook']}\""
            )
    return ""


# ══════════════════════════════════════════════════
# 7. PROMPT BUILDER — SESTAVÍ ZNALOSTNÍ KONTEXT
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
    sections.append(AUDIENCE_PERSONA.strip())

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

    if any(keyword in topic_lower for keyword in ("krystal", "krystaly", "minerál", "mineral")):
        tool = all_tools["aura"].copy()
        tool["key"] = "aura"
        return tool

    keyword_map = {
        "tarot": ["tarot_denni", "tarot_ano_ne", "tarot_neomezeny"],
        "karta": ["tarot_denni", "tarot_neomezeny", "natalni_karta"],
        "horoskop": ["horoskop_denni", "tydenni_mesicni_horoskop"],
        "znamení": ["horoskop_denni", "partnerska_shoda_basic", "partnerska_synastrie"],
        "numerolog": ["numerologie_kalkulacka", "numerologicky_kod"],
        "číslo": ["numerologie_kalkulacka", "numerologicky_kod"],
        "křišťálová koule": ["kristalova_koule", "kristalova_koule_neomezena"],
        "kristalova koule": ["kristalova_koule", "kristalova_koule_neomezena"],
        "koule": ["kristalova_koule", "kristalova_koule_neomezena"],
        # POZOR: "krystal" (mineral) ≠ "křišťálová koule" (nástroj) — záměrně nenamapováno
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
# 8. BLOG DEEP READ — čte HTML obsah článku pro kvalitní promo
# ══════════════════════════════════════════════════

def read_blog_content(slug: str, max_chars: int = 1500) -> str:
    """
    Přečte HTML obsah blogového článku a extrahuje čistý text.
    Vrátí prvních max_chars znaků pro injekci do promptu.

    Args:
        slug: slug článku (bez .html)
        max_chars: max délka extrahovaného textu

    Returns:
        str: extrahovaný text článku nebo prázdný string
    """
    blog_dir = Path(config.BASE_DIR).parent / "blog"
    html_path = blog_dir / f"{slug}.html"

    if not html_path.exists():
        return ""

    try:
        raw = html_path.read_text(encoding="utf-8")

        # Extrahuj obsah z <article> nebo <main> tagu
        import re as _re

        # Hledej <article> obsah
        article_match = _re.search(r'<article[^>]*>(.*?)</article>', raw, _re.DOTALL)
        if article_match:
            content = article_match.group(1)
        else:
            # Fallback: <main> tag
            main_match = _re.search(r'<main[^>]*>(.*?)</main>', raw, _re.DOTALL)
            content = main_match.group(1) if main_match else raw

        # Odstraň HTML tagy
        text = _re.sub(r'<script[^>]*>.*?</script>', '', content, flags=_re.DOTALL)
        text = _re.sub(r'<style[^>]*>.*?</style>', '', text, flags=_re.DOTALL)
        text = _re.sub(r'<[^>]+>', ' ', text)
        # Odstraň extra whitespace
        text = _re.sub(r'\s+', ' ', text).strip()

        # Odstraň navigaci, footer, etc. — vezmi jen první smysluplnou část
        if len(text) > max_chars:
            # Ořízni na konci věty
            cut = text[:max_chars]
            last_period = cut.rfind('.')
            if last_period > max_chars // 2:
                text = cut[:last_period + 1]
            else:
                text = cut + "…"

        return text

    except Exception:
        return ""


def get_blog_deep_context(slug: str, title: str = "") -> str:
    """
    Vrátí hloubkový kontext blogového článku pro blog_promo post.
    Kombinuje metadata + skutečný obsah.
    """
    content = read_blog_content(slug)
    if not content:
        return ""

    return f"""
OBSAH ČLÁNKU (přečteno z webu — použij pro přesný a lákavý teaser):
Název: {title}
URL: {config.WEBSITE_URL}/blog/{slug}.html

Klíčové body z článku:
{content}

PRAVIDLA PRO BLOG PROMO S DEEP CONTEXTEM:
- Vytáhni 1-2 nejzajímavější fakty nebo rady z článku
- Použij je jako hook nebo hodnotu v captionnu
- NEPROZRAZUJ vše — cíl je vyvolat zvědavost kliknout
- Cituj konkrétní čísla, příklady nebo překvapivé informace z článku
- Caption musí být tak dobrý, že čtenář MUSÍ kliknout na odkaz
"""


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
