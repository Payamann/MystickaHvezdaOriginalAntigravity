"""
Image Generator — generování obrázků k postům.

Pořadí fallbacků:
  1. Imagen přes Gemini API
  2. Hugging Face, pokud je nakonfigurovaný přístup
  3. Pollinations.ai
Pokud všechny služby selžou, vrátí se chyba. Statický placeholder není hotová grafika.
"""
from google import genai
from pathlib import Path
from datetime import datetime
import sys
import os
import urllib.request
import urllib.parse

sys.path.append(os.path.dirname(os.path.dirname(__file__)))
import config
from logger import get_logger

log = get_logger(__name__)


_imagen_client: genai.Client | None = None

def setup_imagen():
    """Inicializuje Imagen 3 (singleton klient)"""
    global _imagen_client
    if not config.GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY není nastaven v .env souboru!")
    if _imagen_client is None:
        _imagen_client = genai.Client(api_key=config.GEMINI_API_KEY)
    return _imagen_client


def generate_image(
    prompt: str,
    platform: str = "instagram",
    post_type: str = "square",
    filename: str = None,
) -> Path:
    """
    Generuje obrázek pomocí Imagen 3.

    Args:
        prompt: popis obrázku v angličtině
        platform: instagram nebo facebook
        post_type: square (1:1), story (9:16), landscape (16:9)
        filename: název souboru (bez přípony), auto-generuje se pokud None

    Returns:
        Path: cesta k uloženému obrázku
    """
    client = setup_imagen()

    # Určení aspect ratio
    aspect_ratio_map = {
        "square": "1:1",
        "story": "9:16",
        "landscape": "16:9",
        "portrait": "4:5",
    }
    aspect_ratio = aspect_ratio_map.get(post_type, "1:1")

    # Vylepšení promptu pro brand konzistenci
    enhanced_prompt = f"""
{prompt}

Follow the medium, palette, mood, and composition described in the specific prompt above.
Use the Mystická Hvězda night-blue, violet, or soft-gold palette only when it strengthens
this particular idea. Do not add a starfield, crystal, tarot card, floating icon, or frame
unless the prompt asks for it. Create a polished, distinctive image that reads clearly in
the requested social placement. No readable text, logos, or watermarks.
""".strip()

    if not filename:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"post_{timestamp}"

    output_path = config.IMAGES_DIR / f"{filename}.png"
    config.IMAGES_DIR.mkdir(parents=True, exist_ok=True)

    try:
        # Imagen 3 přes nový google-genai SDK
        result = client.models.generate_images(
            model=config.IMAGE_MODEL,
            prompt=enhanced_prompt,
            config={
                "number_of_images": 1,
                "aspect_ratio": aspect_ratio,
                "safety_filter_level": "BLOCK_ONLY_HIGH",
                "person_generation": "DONT_ALLOW",
            },
        )

        if result.generated_images:
            image_data = result.generated_images[0].image
            with open(output_path, 'wb') as f:
                f.write(image_data.image_bytes)
            log.info("Imagen 3: obrázek vygenerován → %s", output_path.name)
            return output_path
        else:
            raise ValueError("Imagen 3 nevrátil žádný obrázek")

    except Exception as e:
        log.warning("Imagen 3 nedostupný (%s) — zkouším fallback generátory...", str(e)[:80])

        # Fallback 1: Hugging Face (FLUX.1-schnell) — rychlý, spolehlivý, zdarma s API klíčem
        if config.HF_API_TOKEN:
            try:
                return _generate_huggingface(enhanced_prompt, filename, output_path)
            except Exception as hfe:
                log.warning("Hugging Face selhal (%s) — zkouším Pollinations.ai...", str(hfe)[:80])

        # Fallback 2: Pollinations.ai — zdarma bez klíče, ale může být pomalejší
        try:
            return _generate_pollinations(enhanced_prompt, filename, post_type, output_path)
        except Exception as pe:
            log.error("Generování obrázku selhalo; náhradní falešný vizuál nevytvářím: %s", str(pe)[:160])
            raise RuntimeError("Grafiku se nepodařilo vygenerovat. Zkontroluj službu a prompt; placeholder není publikovatelný výstup.") from pe


def _generate_huggingface(
    prompt: str,
    filename: str,
    output_path: Path,
) -> Path:
    """
    Generuje obrázek přes Hugging Face Inference API (FLUX.1-schnell).
    Rychlý (~5s), spolehlivý, zdarma s HF účtem.

    Token: https://huggingface.co/settings/tokens (Read token)
    Model: black-forest-labs/FLUX.1-schnell
    """
    import json as _json

    url = "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell"
    headers = {
        "Authorization": f"Bearer {config.HF_API_TOKEN}",
        "Content-Type": "application/json",
        "User-Agent": "MystickaHvezda-Agent/2.0",
    }
    payload = _json.dumps({"inputs": prompt}).encode("utf-8")

    log.info("Hugging Face FLUX.1-schnell: generuji obrázek...")
    req = urllib.request.Request(url, data=payload, headers=headers, method="POST")

    with urllib.request.urlopen(req, timeout=60) as resp:
        if resp.status != 200:
            raise ValueError(f"HF API vrátilo HTTP {resp.status}")
        image_bytes = resp.read()

    # HF vrátí JSON chybu pokud model není načtený
    if image_bytes[:1] == b"{":
        try:
            err = __import__("json").loads(image_bytes)
            if "error" in err:
                raise ValueError(f"HF chyba: {err['error']}")
        except (__import__("json").JSONDecodeError, KeyError):
            pass  # není JSON, je to obrázek

    if len(image_bytes) < 5_000:
        raise ValueError(f"HF vrátil příliš malý soubor ({len(image_bytes)} bajtů)")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "wb") as f:
        f.write(image_bytes)

    log.info("Hugging Face: obrázek uložen → %s (%d KB)", output_path.name, len(image_bytes) // 1024)
    return output_path


def _generate_pollinations(
    prompt: str,
    filename: str,
    post_type: str,
    output_path: Path,
) -> Path:
    """
    Generuje obrázek přes Pollinations.ai (FLUX model).
    Zdarma, bez API klíče, žádná registrace.

    Dokumentace: https://pollinations.ai/
    """
    # Rozměry dle formátu postu
    size_map = {
        "square":    (1080, 1080),
        "story":     (1080, 1920),
        "landscape": (1200, 630),
        "portrait":  (1080, 1350),
    }
    width, height = size_map.get(post_type, (1080, 1080))
    seed = random.randint(1, 999999)

    # Pollinations.ai endpoint — prostý GET request
    encoded_prompt = urllib.parse.quote(prompt)
    url = (
        f"https://image.pollinations.ai/prompt/{encoded_prompt}"
        f"?width={width}&height={height}"
        f"&model=flux"
        f"&seed={seed}"
        f"&nologo=true"
        f"&enhance=true"
    )

    log.info("Pollinations.ai: generuji obrázek (%dx%d, seed=%d)...", width, height, seed)

    # Stáhni obrázek — může trvat 30-120s (závisí na vytížení serverů)
    req = urllib.request.Request(url, headers={"User-Agent": "MystickaHvezda-Agent/2.0"})
    with urllib.request.urlopen(req, timeout=120) as resp:
        if resp.status != 200:
            raise ValueError(f"Pollinations vrátil HTTP {resp.status}")
        image_bytes = resp.read()

    if len(image_bytes) < 10_000:
        raise ValueError(f"Pollinations vrátil příliš malý soubor ({len(image_bytes)} bajtů)")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "wb") as f:
        f.write(image_bytes)

    log.info("Pollinations.ai: obrázek uložen → %s (%d KB)", output_path.name, len(image_bytes) // 1024)
    return output_path


if __name__ == "__main__":
    from rich.console import Console

    console = Console()
    console.print("[bold purple]🎨 Test Image Generatoru[/bold purple]\n")

    test_prompt = "mystical tarot cards spread on velvet cloth, candlelight, purple crystals, ethereal fog, cosmic energy"

    console.print(f"Generuji obrázek pro prompt:\n[italic]{test_prompt}[/italic]\n")

    path = generate_image(
        prompt=test_prompt,
        platform="instagram",
        post_type="square",
        filename="test_tarot",
    )

    console.print(f"[green]✓ Obrázek uložen: {path}[/green]")
