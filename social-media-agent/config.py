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
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
META_ACCESS_TOKEN = os.getenv("META_ACCESS_TOKEN", "")
META_PAGE_ID = os.getenv("META_PAGE_ID", "")
INSTAGRAM_ACCOUNT_ID = os.getenv("INSTAGRAM_ACCOUNT_ID", "")

# === BRAND NASTAVENÍ ===
BRAND_NAME = os.getenv("BRAND_NAME", "Mystická Hvězda")
WEBSITE_URL = os.getenv("WEBSITE_URL", "https://www.mystickahvezda.cz")
LANGUAGE = os.getenv("LANGUAGE", "cs")

# === GEMINI MODELY ===
TEXT_MODEL = "gemini-2.0-flash"          # Pro texty, captions, hashtags
IMAGE_MODEL = "imagen-3.0-generate-002"  # Imagen 3 pro obrázky

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
    "tarot",
    "numerologie",
    "astrologie",
    "duchovní rozvoj",
    "meditace",
    "energie a čakry",
    "sny a jejich výklad",
    "feng shui",
    "lunární cykly",
    "andělé a znamení",
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
}

# Content Pillars — doporučený poměr typů obsahu
# 40% vzdělávání | 30% zapojení | 20% propagace | 10% inspirace
CONTENT_PILLARS = {
    "education":   ["educational", "myth_bust", "story"],        # 40%
    "engagement":  ["question", "challenge", "daily_energy"],    # 30%
    "promotion":   ["blog_promo", "carousel_plan"],              # 20%
    "inspiration": ["quote", "tip"],                             # 10%
}

# Hashtags základní sada
BASE_HASHTAGS = [
    "#mystickahvezda",
    "#tarot",
    "#numerologie",
    "#astrologie",
    "#duchovnost",
    "#spiritualita",
    "#meditace",
    "#energie",
    "#horoskop",
    "#kartomantie",
]

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
