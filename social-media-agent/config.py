"""
Konfigurace Social Media Agenta pro Mystická Hvězda
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Načti .env soubor
env_path = Path(__file__).parent / ".env"
load_dotenv(env_path)

# === API KLÍČE ===
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")   # Claude — generování textů
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

# === CLAUDE MODELY ===
TEXT_MODEL = "claude-sonnet-4-5"         # Pro texty, captions, hashtags
TEXT_MODEL_PRO = "claude-opus-4-5"       # Pro složitější úlohy (refinement, weekly plan)
IMAGE_MODEL = "imagen-3.0-generate-002"  # Imagen 3 pro obrázky (Gemini zůstává jen pro obrázky)

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
# Témata pro posty (rotujeme automaticky)
CONTENT_THEMES = [
    # Systémy
    "tarot",
    "numerologie",
    "astrologie",
    "runy",
    "andělé a znamení",
    # Praktiky
    "meditace a mindfulness",
    "energie a čakry",
    "krystaly a minerály",
    "rituály a svíčková magie",
    "feng shui a energie prostoru",
    # Životní cykly
    "lunární cykly a úplňky",
    "sezónní energie a sabbaty",
    "sny a jejich výklad",
    # Vztahy a self
    "karmické vztahy a spřízněné duše",
    "shadow work a vnitřní léčení",
    "minulé životy",
    "sebepoznání a životní účel",
    # Rozšířené
    "šamanismus",
    "synchronicita a znamení",
    "hojnost a manifestace",
    "afirmace a mantry",
    "duchovní rozvoj",
]

# Typy postů (kompletní seznam)
POST_TYPES = {
    "educational":   "Vzdělávací post — vysvětluje mystický koncept",
    "myth_bust":     "Odhalení mýtu — bourá běžné omyly o mystice",
    "story":         "Příběhový post — s konkrétní scénou a lekcí",
    "quote":         "Původní citát nebo moudrost značky",
    "question":      "Zapojovací otázka pro komunitu",
    "tip":           "Konkrétní praktický rituál nebo tip",
    "challenge":     "Výzva pro komunitu (3-7 denní)",
    "blog_promo":    "Propagace blogového článku",
    "daily_energy":  "Denní energetická předpověď (lunár + astro)",
    "carousel_plan": "Plán karusel postu (7 slidů)",
    "cross_system":  "Propojení 2+ mystických systémů (tarot+astro, numerologie+runy...)",
    "tool_demo":     "Ukázka nástroje na konkrétním příkladu — taste of premium",
    "save_worthy":   "Checklist / porovnání / quick reference — obsah k uložení",
}

# Denní časové sloty pro 3× denní posting (ráno / poledne / večer)
DAILY_TIME_SLOTS = [
    {
        "id": "morning",
        "label": "🌅 Ráno",
        "time": "08:00",
        "preferred_types": ["quote", "daily_energy", "tip", "save_worthy"],
        "content_intent": "pure_value",
    },
    {
        "id": "noon",
        "label": "☀️ Poledne",
        "time": "12:00",
        "preferred_types": ["educational", "myth_bust", "story", "blog_promo", "cross_system", "tool_demo"],
        "content_intent": None,  # auto z pick_content_intent()
    },
    {
        "id": "evening",
        "label": "🌙 Večer",
        "time": "19:00",
        "preferred_types": ["question", "challenge"],
        "content_intent": "pure_value",
    },
]

# Adresář pro content kalendáře
CALENDAR_DIR = OUTPUT_DIR / "calendar"

# Content Pillars — doporučený poměr typů obsahu
# 40% vzdělávání | 30% zapojení | 20% propagace | 10% inspirace
CONTENT_PILLARS = {
    "education":   ["educational", "myth_bust", "story", "cross_system"],  # 40%
    "engagement":  ["question", "challenge", "daily_energy"],              # 30%
    "promotion":   ["blog_promo", "carousel_plan", "tool_demo"],           # 20%
    "inspiration": ["quote", "tip", "save_worthy"],                        # 10%
}

# Hashtags základní sada (vždy přidány)
BASE_HASHTAGS = [
    "#mystickahvezda",
    "#spiritualita",
    "#duchovnírozvoj",
    "#ezoterika",
]

# Hashtag Clusters — tematické sady pro lepší dosah
# Agent vybere 2-3 relevantní clustery + base = optimální mix
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
