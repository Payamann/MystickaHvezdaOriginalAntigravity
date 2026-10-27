"""OpenAI-only social image generation; failures never select another provider."""
import base64
from datetime import datetime
from io import BytesIO
from pathlib import Path
import re
import sys

from openai import OpenAI
from PIL import Image

sys.path.append(str(Path(__file__).resolve().parent.parent))
import config
from logger import get_logger

log = get_logger(__name__)
_image_client = None
IMAGE_SIZES = {
    "square": "1024x1024",
    "story": "864x1536",
    "landscape": "1536x864",
    "portrait": "1024x1280",
}


def setup_openai_images():
    global _image_client
    if not config.OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY není nastaven v .env souboru!")
    if config.IMAGE_MODEL != "gpt-image-2.5-flare":
        raise ValueError("Generování obrázků vyžaduje gpt-image-2.5-flare")
    if _image_client is None:
        _image_client = OpenAI(
            api_key=config.OPENAI_API_KEY,
            base_url="https://api.openai.com/v1",
            max_retries=0,
            timeout=90,
        )
    return _image_client


def generate_image(prompt: str, platform: str = "instagram", post_type: str = "square", filename: str = None) -> Path:
    """Generate one PNG in the requested social aspect ratio through OpenAI."""
    if not filename:
        filename = f"post_{datetime.now().strftime('%Y%m%d_%H%M%S_%f')}"
    if not isinstance(filename, str) or not re.fullmatch(r"[\w-]+", filename):
        raise ValueError("Název obrázku musí být jednoduchý název bez cesty a přípony")
    images_dir = config.IMAGES_DIR.resolve()
    output_path = (images_dir / f"{filename}.png").resolve()
    if output_path.parent != images_dir:
        raise ValueError("Výstup obrázku musí zůstat v adresáři images")
    size = IMAGE_SIZES.get(post_type, IMAGE_SIZES["square"])
    expected_size = tuple(map(int, size.split("x")))

    enhanced_prompt = f"""
{prompt}

Follow the medium, palette, mood, and composition described in the specific prompt above.
Use the Mystická Hvězda night-blue, violet, or soft-gold palette only when it strengthens
this particular idea. Do not add a starfield, crystal, tarot card, floating icon, or frame
unless the prompt asks for it. Create a polished, distinctive image that reads clearly in
the requested social placement. No readable text, logos, or watermarks.
""".strip()

    client = setup_openai_images()
    try:
        result = client.images.generate(
            model=config.IMAGE_MODEL,
            prompt=enhanced_prompt,
            n=1,
            size=size,
            quality="medium",
            output_format="png",
        )
        if not result.data or len(result.data) != 1:
            raise ValueError("OpenAI musí vrátit právě jeden obrázek")
        encoded = result.data[0].b64_json
        if not isinstance(encoded, str) or len(encoded) > 45_000_000:
            raise ValueError("OpenAI nevrátil platný base64 obrázek")
        image_bytes = base64.b64decode(encoded, validate=True)
        with Image.open(BytesIO(image_bytes)) as image:
            if image.format != "PNG" or image.size != expected_size:
                raise ValueError("OpenAI nevrátil PNG v požadovaných rozměrech")
            image.verify()
    except Exception:
        # Provider exceptions may contain prompts: keep those out of logs/errors.
        log.error("Generování obrázku přes OpenAI selhalo")
        raise RuntimeError("Grafiku se nepodařilo vygenerovat přes OpenAI.") from None

    images_dir.mkdir(parents=True, exist_ok=True)
    output_path.write_bytes(image_bytes)
    log.info("OpenAI: obrázek uložen → %s", output_path.name)
    return output_path
