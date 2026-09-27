"""
Konfigurace Social Media Agenta pro Mystická Hvězda
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Načti .env soubor
env_path = Path(__file__).parent / ".env"
load_dotenv(env_path, override=True, encoding='utf-8')

# === API KLÍČE ===
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")         # GPT-6 Luna — texty a komentáře
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")          # Gemini — generování obrázků (Imagen 3)
META_ACCESS_TOKEN = os.getenv("META_ACCESS_TOKEN", "")
META_PAGE_ID = os.getenv("META_PAGE_ID", "")
INSTAGRAM_ACCOUNT_ID = os.getenv("INSTAGRAM_ACCOUNT_ID", "")

# === BUFFER API ===
BUFFER_ACCESS_TOKEN = os.getenv("BUFFER_ACCESS_TOKEN", "")
BUFFER_PROFILE_ID = os.getenv("BUFFER_PROFILE_ID", "")  # Instagram profil ID v Buffer

# === IMGBB (hosting obrázků pro Buffer) ===
# Zdarma na https://imgbb.com — nutné pro posty s obrázkem přes Buffer
IMGBB_API_KEY = os.getenv("IMGBB_API_KEY", "")

# === HUGGING FACE (generování obrázků — FLUX.1-schnell) ===
# Zdarma na https://huggingface.co/settings/tokens (Read token)
HF_API_TOKEN = os.getenv("HF_API_TOKEN", "")

# === BRAND NASTAVENÍ ===
BRAND_NAME = os.getenv("BRAND_NAME", "Mystická Hvězda")
WEBSITE_URL = os.getenv("WEBSITE_URL", "https://www.mystickahvezda.cz")
LANGUAGE = os.getenv("LANGUAGE", "cs")

# === OPENAI TEXT MODEL ===
# Veškeré textové cesty používají GPT-6 Luna s výchozím reasoningem medium.
# Tři aliasy zachovávají existující rozhraní pro volání podle typu úlohy.
TEXT_MODEL = "gpt-6-luna"
TEXT_MODEL_PRO = "gpt-6-luna"
TEXT_MODEL_FAST = "gpt-6-luna"
TEXT_REASONING_EFFORT = os.getenv("TEXT_REASONING_EFFORT", "medium").strip().lower() or "medium"
if TEXT_REASONING_EFFORT not in {"none", "low", "medium", "high", "xhigh", "max"}:
    raise ValueError("TEXT_REASONING_EFFORT musí být none, low, medium, high, xhigh nebo max")
# Responses API započítává reasoning tokeny do max_output_tokens.
TEXT_MAX_OUTPUT_TOKENS = max(1024, int(os.getenv("TEXT_MAX_OUTPUT_TOKENS", "8192")))
IMAGE_MODEL = "imagen-3.0-generate-002"       # Imagen 3 pro obrázky (Gemini zůstává jen pro obrázky)

# === META GRAPH API ===
GRAPH_API_VERSION = "v22.0"
GRAPH_API_URL = f"https://graph.facebook.com/{GRAPH_API_VERSION}"
HTTP_TIMEOUT = 30  # sekundy pro všechny HTTP requesty

# === CESTY ===
BASE_DIR = Path(__file__).parent
OUTPUT_DIR = BASE_DIR / "output"
POSTS_DIR = OUTPUT_DIR / "posts"
IMAGES_DIR = OUTPUT_DIR / "images"
BLOG_INDEX_PATH = BASE_DIR.parent / "data" / "blog-index.json"

# === CONTENT NASTAVENÍ ===
# Témata jako výchozí nabídka; žádné téma není povinné ani automaticky zakázané.
CONTENT_THEMES = [
    # Systémy — přímé nástroje na webu
    "tarot",
    "numerologie",
    "astrologie",
    "runy",
    "andělé a andělské karty",
    # Web nástroje
    "lunární rituály a fáze měsíce",
    "natální karta a birth chart",
    "partnerská shoda a kompatibilita",
    "minulé životy a karma",
    "šamanské kolo a totemová zvířata",
    "horoskopy a předpovědi",
    "sny a jejich výklad",
    "biorytmy a osobní cykly",
    "aura a barvy energie",
    "afirmace a denní záměry",
    "čínský horoskop",
    "křišťálová koule a věštění",
    "astromapa a místa na světě",
    "hvězdný průvodce a osobní záměry",
    # Životní témata (pure_value, bez přímého nástroje)
    "karmické vztahy a spřízněné duše",
    "synchronicita a znamení",
    "sebepoznání a životní účel",
    "duchovní rozvoj",
    "sezónní energie a astrologie roku",
]

# Pouze doložené funkce, které smějí být použity v dobrovolném promo příspěvku.
PROMOTABLE_TOOLS = {
    "tarot":                           "/tarot.html",
    "numerologie":                     "/numerologie.html",
    "astrologie":                      "/horoskopy.html",
    "runy":                            "/runy.html",
    "andělé a andělské karty":         "/andelske-karty.html",
    "lunární rituály a fáze měsíce":   "/lunace.html",
    "natální karta a birth chart":     "/natalni-karta.html",
    "partnerská shoda a kompatibilita":"/partnerska-shoda.html",
    "minulé životy a karma":           "/minuly-zivot.html",
    "šamanské kolo a totemová zvířata":"/shamansko-kolo.html",
    "horoskopy a předpovědi":          "/horoskopy.html",
    "afirmace a denní záměry":         "/mentor.html",
    "hvězdný průvodce a osobní záměry":"/mentor.html",
    "křišťálová koule a věštění":      "/kristalova-koule.html",
}

# Zpětná kompatibilita — seznam témat pro anti-repetition logiku
PROMOTABLE_THEMES = list(PROMOTABLE_TOOLS.keys())

# Typy postů (kompletní seznam)
POST_TYPES = {
    "educational":   "Vzdělávací post — vysvětluje mystický koncept",
    "myth_bust":     "Odhalení mýtu — bourá běžné omyly o mystice",
    "story":         "Příběhová miniatura; nesmí se vydávat za skutečný osobní zážitek",
    "quote":         "Původní myšlenka značky; bez smyšleného autora nebo citace",
    "question":      "Zapojovací otázka pro komunitu",
    "tip":           "Konkrétní praktický rituál nebo tip",
    "challenge":     "Volitelný nenátlakový námět k vyzkoušení; bez slibů výsledku",
    "blog_promo":    "Propagace blogového článku",
    "daily_energy":  "Reflexivní denní obsah; aktuální astro údaje jen z ověřeného kontextu",
    "carousel_plan": "Osnova carouselu podle skutečného tématu a zvoleného počtu slidů",
    "cross_system":  "Opatrné symbolické propojení systémů, pouze když dává smysl",
    "tool_demo":     "Ukázka funkce jen na ověřených podkladech; bez vymyšleného výstupu",
    "save_worthy":   "Praktický přehled nebo postup, pokud se pro téma hodí",
}

# Orientační sloty se používají pouze při výslovné volbě více návrhů denně.
# Časy jsou provozní poznámka, ne doporučení založené na datech o publiku.
DAILY_TIME_SLOTS = [
    {
        "id": "morning",
        "label": "Návrh 1",
        "time": "08:00",
        "preferred_types": ["educational", "quote", "tip", "daily_energy", "save_worthy"],
    },
    {
        "id": "noon",
        "label": "Návrh 2",
        "time": "12:00",
        "preferred_types": ["educational", "myth_bust", "story", "cross_system", "carousel_plan"],
    },
    {
        "id": "evening",
        "label": "Návrh 3",
        "time": "19:00",
        "preferred_types": ["question", "challenge", "myth_bust", "story"],
    },
]

# Adresář pro content kalendáře
CALENDAR_DIR = OUTPUT_DIR / "calendar"

# Orientační tematické skupiny pro starší nástroje; bez předepsaných poměrů.
CONTENT_PILLARS = {
    "education": ["educational", "myth_bust", "story", "cross_system"],
    "engagement": ["question", "challenge", "daily_energy"],
    "promotion": ["blog_promo", "tool_demo"],
    "inspiration": ["quote", "tip", "save_worthy"],
}

# Výchozí hashtagy se automaticky nepřidávají.
BASE_HASHTAGS = []

# Volitelné tematické hashtagy pro ruční výběr; agent je nepřidává automaticky.
# Nejde o příslib dosahu ani o povinný počet hashtagů.
HASHTAG_CLUSTERS = {
    "tarot": {
        "big": ["#tarot", "#tarotreading", "#tarotcommunity"],
        "mid": ["#českýtarot", "#tarotczech", "#kartářství", "#výkladkaret"],
        "niche": ["#tarotváramluví", "#tarotdaily", "#tarotinspiration", "#tarotvýklad"],
    },
    "astrologie": {
        "big": ["#astrology", "#horoscope", "#zodiac"],
        "mid": ["#astrologiecz", "#horoskop", "#znamenízvěrokruhu"],
        "niche": ["#planetyahvězdy", "#natal chart", "#tranzity", "#astrovýklad"],
    },
    "numerologie": {
        "big": ["#numerology", "#numerologylife"],
        "mid": ["#numerologiecz", "#numerologie", "#číslaživota"],
        "niche": ["#životníčíslo", "#anděláčísla", "#11:11", "#numerologickýkód"],
    },
    "lunární": {
        "big": ["#moonphases", "#fullmoon", "#newmoon"],
        "mid": ["#měsíčnífáze", "#lunárnícyklus", "#úplněk"],
        "niche": ["#energieměsíce", "#novoluní", "#lunárníkalenář", "#moonritual"],
    },
    "meditace": {
        "big": ["#meditation", "#mindfulness", "#meditace"],
        "mid": ["#meditacecz", "#duchovno", "#vnitřníklid"],
        "niche": ["#rannímeditace", "#záměr", "#dechovápraxe", "#ticho"],
    },
    "energie": {
        "big": ["#energy", "#chakras", "#healing"],
        "mid": ["#čakry", "#energetickéléčení", "#aura"],
        "niche": ["#energieproudí", "#vibrace", "#energetickéčištění"],
    },
    "krystaly": {
        "big": ["#crystals", "#crystalhealing"],
        "mid": ["#krystaly", "#minerály", "#krystaloterapie"],
        "niche": ["#ametyst", "#růženín", "#krystalovávoda", "#kamenyaenergie"],
    },
    "rituály": {
        "big": ["#rituals", "#witchcraft", "#magick"],
        "mid": ["#rituály", "#svíčkovámagie", "#duchovnírituál"],
        "niche": ["#novolunírit", "#úplňkovrituál", "#bylinky", "#sabbat"],
    },
    "vztahy": {
        "big": ["#soulmate", "#twinflame", "#love"],
        "mid": ["#spřízněnáduše", "#karmickývztah", "#duchovnívztahy"],
        "niche": ["#partnerskáshoda", "#synastrie", "#karmicképouto"],
    },
    "sny": {
        "big": ["#dreams", "#dreaminterpretation"],
        "mid": ["#výkladsnu", "#snář", "#sny"],
        "niche": ["#lucidsny", "#snovámagie", "#podvědomí"],
    },
    "andělé": {
        "big": ["#angels", "#angelnumbers"],
        "mid": ["#andělskékarty", "#andělsképoselství"],
        "niche": ["#andělstrážný", "#duchovnívedení", "#anděl"],
    },
    "runy": {
        "big": ["#runes", "#vikingrunes"],
        "mid": ["#runy", "#runycz"],
        "niche": ["#nordickámystika", "#vikingskeruna", "#futhark"],
    },
    "shadow_work": {
        "big": ["#shadowwork", "#innerhealing", "#selfgrowth"],
        "mid": ["#sebepoznání", "#vnitřníléčení", "#stínovápráce"],
        "niche": ["#shadow", "#vnitřnídítě", "#léčenítraumat"],
    },
    "manifestace": {
        "big": ["#manifestation", "#lawofattraction", "#manifest"],
        "mid": ["#manifestace", "#hojnost", "#zákonpřitažlivosti"],
        "niche": ["#afirmace", "#vizualizace", "#záměr"],
    },
}

# Platforma-specifická nastavení
PLATFORM_SETTINGS = {
    "instagram": {
        "max_caption_length": 2200,
        "max_hashtags": 30,
        "image_size": (1080, 1080),  # čtvereček
        "story_size": (1080, 1920),  # story
    },
    "facebook": {
        "max_caption_length": 63206,
        "max_hashtags": 10,
        "image_size": (1200, 630),  # landscape
    }
}
