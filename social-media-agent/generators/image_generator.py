"""
Image Generator — používá Imagen 3 (přes Gemini API)
pro generování obrázků k postům
"""
from google import genai
from pathlib import Path
from datetime import datetime
import sys
import os
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

Style: Mystical, ethereal, spiritual atmosphere.
Color palette: Deep purple (#4a0080), gold (#c9a227), midnight blue (#0a0a2e), soft white stars.
Mood: Mysterious yet welcoming, magical, transcendent.
Quality: Professional, high resolution, suitable for social media.
No text, no letters, no watermarks in the image.
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

        # Uložení obrázku
        if result.generated_images:
            image_data = result.generated_images[0].image
            # image_data.image_bytes obsahuje PNG bytes
            with open(output_path, 'wb') as f:
                f.write(image_data.image_bytes)
            return output_path
        else:
            return _create_placeholder_image(prompt, filename, platform)

    except Exception as e:
        error_msg = str(e)
        # Fallback na placeholder
        log.warning("Imagen nedostupný (%s), vytvářím placeholder...", error_msg[:80])
        return _create_placeholder_image(prompt, filename, platform)


def _create_placeholder_image(
    prompt: str,
    filename: str,
    platform: str = "instagram",
) -> Path:
    """
    Vytvoří placeholder obrázek s textem promptu
    (záložní řešení pokud Imagen není dostupný)
    """
    from PIL import Image, ImageDraw, ImageFont

    # Rozměry dle platformy
    if platform == "instagram":
        size = (1080, 1080)
    elif platform == "facebook":
        size = (1200, 630)
    else:
        size = (1080, 1080)

    # Vytvoř gradient obrázek (tmavě fialový)
    img = Image.new('RGB', size, color=(10, 0, 30))
    draw = ImageDraw.Draw(img)

    # Přidej hvězdičky (náhodné body)
    import random
    random.seed(42)
    for _ in range(200):
        x = random.randint(0, size[0])
        y = random.randint(0, size[1])
        r = random.randint(1, 3)
        brightness = random.randint(150, 255)
        draw.ellipse([x-r, y-r, x+r, y+r], fill=(brightness, brightness, brightness))

    # Přidej rámeček
    border_color = (201, 162, 39)  # zlatá
    draw.rectangle([20, 20, size[0]-20, size[1]-20], outline=border_color, width=3)

    # Přidej text s promptem (zkrácený)
    short_prompt = prompt[:100] + "..." if len(prompt) > 100 else prompt
    try:
        font = ImageFont.truetype("arial.ttf", 30)
    except (IOError, OSError):
        font = ImageFont.load_default()

    # Zarovnání textu
    text_bbox = draw.textbbox((0, 0), short_prompt, font=font)
    text_width = text_bbox[2] - text_bbox[0]
    x = (size[0] - text_width) // 2
    y = size[1] // 2

    draw.text((x, y), short_prompt, fill=(201, 162, 39), font=font)
    draw.text((size[0]//2 - 100, size[1]//2 - 80), "🔮 Mystická Hvězda", fill=(150, 100, 200), font=font)

    # Uložení
    if not filename:
        from datetime import datetime
        filename = f"placeholder_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

    output_path = config.IMAGES_DIR / f"{filename}.png"
    config.IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    img.save(output_path, "PNG")

    log.warning("Imagen není dostupný — vytvořen placeholder: %s", output_path)
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
