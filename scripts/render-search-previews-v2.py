"""Render the approved painterly link previews from six project-owned scenes.

Run from the repository root: python scripts/render-search-previews-v2.py
The supplied artwork is deliberately text-free. All Czech, Slovak and Polish
copy is laid out here so accents and spelling remain exact.
"""

from __future__ import annotations

import re
from html import unescape
from pathlib import Path
from urllib.parse import urlparse

from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "img" / "search-preview"
ART = OUTPUT / "art-v2"
SIZE = (1200, 630)
BRAND = {"cs": "MYSTICKÁ HVĚZDA", "sk": "MYSTICKÁ HVIEZDA", "pl": "MYSTICKA GWIAZDA"}

# key: title, supporting line, source painting, language
PREVIEWS = {
    "home": ("Tarot a horoskopy", "Začni jednou otázkou.", "tarot", "cs"),
    "tarot": ("Tarot online", "Jedna otázka. Jedna karta.", "tarot", "cs"),
    "tarot-yes-no": ("Tarot ano/ne", "Jedna otázka. Jedna karta.", "tarot", "cs"),
    "tarot-love": ("Tarot na lásku", "Když otázka míří ke vztahu.", "tarot", "cs"),
    "horoscopes": ("Horoskop na dnes", "Pro všech 12 znamení.", "astrology", "cs"),
    "natal": ("Natální karta", "Mapa okamžiku narození.", "astrology", "cs"),
    "compatibility": ("Partnerská shoda", "Dva lidé. Jeden vztah.", "relationships", "cs"),
    "numerology": ("Numerologie", "Čísla jako podnět k zamyšlení.", "library", "cs"),
    "dreams": ("Snář", "Obrazy, které zůstávají po probuzení.", "dreams", "cs"),
    "names": ("Význam jména", "Původ a příběh jmen.", "library", "cs"),
    "angels": ("Andělské karty", "Symboly k zamyšlení.", "oracle", "cs"),
    "dictionary": ("Ezoterický slovník", "Pojmy vysvětlené srozumitelně.", "library", "cs"),
    "blog": ("Články", "Astrologie, tarot a každodenní otázky.", "library", "cs"),
    "tests": ("Mystické testy", "Podívej se na sebe z jiného úhlu.", "library", "cs"),
    "moon": ("Lunární kalendář", "Fáze Měsíce v souvislostech.", "dreams", "cs"),
    "runes": ("Runy", "Staré symboly, vlastní otázky.", "oracle", "cs"),
    "other": ("Objevuj po svém", "Tarot, symboly a další otázky.", "tarot", "cs"),
    "relationship-reading": ("Vztahový výklad", "Tři karty k tvé vlastní otázce.", "tarot", "cs"),
    "home-sk": ("Tarot a horoskopy", "Začni jednou otázkou.", "tarot", "sk"),
    "tarot-sk": ("Tarot online", "Jedna otázka. Jedna karta.", "tarot", "sk"),
    "horoscopes-sk": ("Horoskop na dnes", "Pre všetkých 12 znamení.", "astrology", "sk"),
    "natal-sk": ("Natálna karta", "Mapa okamihu narodenia.", "astrology", "sk"),
    "angels-sk": ("Anjelské karty", "Symboly na zamyslenie.", "oracle", "sk"),
    "other-sk": ("Objavuj po svojom", "Tarot, symboly a ďalšie otázky.", "tarot", "sk"),
    "home-pl": ("Tarot i horoskopy", "Zacznij od jednego pytania.", "tarot", "pl"),
    "tarot-pl": ("Tarot online", "Jedno pytanie. Jedna karta.", "tarot", "pl"),
    "horoscopes-pl": ("Horoskop na dziś", "Dla wszystkich 12 znaków.", "astrology", "pl"),
    "natal-pl": ("Kosmogram", "Mapa chwili Twoich narodzin.", "astrology", "pl"),
    "angels-pl": ("Karty anielskie", "Symbole do refleksji.", "oracle", "pl"),
    "other-pl": ("Odkrywaj po swojemu", "Tarot, symbole i nowe pytania.", "tarot", "pl"),
}


def serif(size: int) -> ImageFont.FreeTypeFont:
    # Georgia is the serif used in the approved sample; DejaVu is a portable
    # fallback for regeneration outside Windows. Final WebPs travel with code.
    candidates = [Path("C:/Windows/Fonts/georgia.ttf"), Path("/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf")]
    for path in candidates:
        if path.is_file():
            return ImageFont.truetype(str(path), size)
    return ImageFont.truetype(str(ROOT / "fonts" / "8vIU7ww63mVu7gtR-kwKxNvkNOjw-tbnTYo.ttf"), size)


def sans(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(ROOT / "fonts" / ("inter-semibold.ttf" if bold else "inter-regular.ttf")), size)


def scene(name: str) -> Image.Image:
    path = ART / f"{name}.png"
    if not path.is_file():
        raise FileNotFoundError(path)
    image = ImageOps.fit(Image.open(path).convert("RGB"), SIZE, method=Image.Resampling.LANCZOS, centering=(0.5, 0.52)).convert("RGBA")
    wash = Image.new("RGBA", SIZE)
    draw = ImageDraw.Draw(wash)
    for x in range(720):
        draw.line((x, 0, x, SIZE[1] - 1), fill=(4, 5, 19, int(100 * (1 - x / 720) ** 1.6)))
    image.alpha_composite(wash)
    return image


def title_lines(draw: ImageDraw.ImageDraw, title: str) -> tuple[list[str], ImageFont.FreeTypeFont]:
    max_width = 455
    for size in range(70, 45, -2):
        face = serif(size)
        if draw.textlength(title, font=face) <= max_width:
            return [title], face
    words = title.split()
    for split in range(1, len(words)):
        left, right = " ".join(words[:split]), " ".join(words[split:])
        face = serif(57)
        if max(draw.textlength(left, font=face), draw.textlength(right, font=face)) <= max_width:
            return [left, right], face
    return [title], serif(45)


def wrap_support(draw: ImageDraw.ImageDraw, copy: str, max_width: int = 485) -> list[str]:
    face = sans(27)
    lines, line = [], ""
    for word in copy.split():
        candidate = f"{line} {word}".strip()
        if line and draw.textlength(candidate, font=face) > max_width:
            lines.append(line)
            line = word
        else:
            line = candidate
    if line:
        lines.append(line)
    return lines[:2]


def text_overlay(image: Image.Image, title: str, support: str, language: str) -> None:
    draw = ImageDraw.Draw(image)
    draw.text((76, 72), BRAND[language], font=sans(22, True), fill=(234, 207, 158))
    draw.line((76, 222, 156, 222), fill=(225, 183, 118), width=4)
    lines, face = title_lines(draw, title)
    top = 251 if len(lines) == 1 else 226
    step = 65
    for i, line in enumerate(lines):
        draw.text((70, top + step * i), line, font=face, fill=(252, 242, 222), stroke_width=1, stroke_fill=(26, 15, 34))
    support_top = 366 if len(lines) == 1 else 405
    for i, line in enumerate(wrap_support(draw, support)):
        draw.text((76, support_top + 39 * i), line, font=sans(27), fill=(241, 229, 217))


def render_category(key: str, title: str, support: str, artwork: str, language: str) -> None:
    image = scene(artwork)
    text_overlay(image, title, support, language)
    image.convert("RGB").save(OUTPUT / f"{key}.webp", "WEBP", quality=88, method=6)


def render_tarot_cards() -> int:
    output = OUTPUT / "tarot-cards"
    output.mkdir(parents=True, exist_ok=True)
    count = 0
    for page in sorted((ROOT / "tarot-vyznam").glob("*.html")):
        html = page.read_text(encoding="utf-8")
        title_match = re.search(r"<title[^>]*>(.*?)</title>", html, re.DOTALL)
        art_match = re.search(r'<img\b[^>]*src="([^"]*img/tarot/tarot_[^"]+)"', html)
        if not title_match or not art_match:
            continue
        art_path = ROOT / urlparse(art_match.group(1)).path.lstrip("/")
        if not art_path.is_file():
            raise FileNotFoundError(art_path)
        title = unescape(re.sub(r"<[^>]+>", "", title_match.group(1))).split(":", 1)[0].split(" – ", 1)[0].strip()
        image = scene("card")
        with Image.open(art_path) as original:
            card = original.convert("RGBA")
            card.thumbnail((280, 460), Image.Resampling.LANCZOS)
            x, y = 925 - card.width // 2, 324 - card.height // 2
            shadow = Image.new("RGBA", SIZE)
            sd = ImageDraw.Draw(shadow)
            sd.rounded_rectangle((x - 12, y - 12, x + card.width + 12, y + card.height + 12), radius=16, fill=(0, 0, 0, 160))
            image.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(17)))
            image.alpha_composite(card, (x, y))
            ImageDraw.Draw(image).rounded_rectangle((x - 4, y - 4, x + card.width + 4, y + card.height + 4), radius=8, outline=(223, 180, 117), width=3)
        text_overlay(image, title, "Význam a souvislosti.", "cs")
        image.convert("RGB").save(output / f"{page.stem}.webp", "WEBP", quality=84, method=6)
        count += 1
    return count


if __name__ == "__main__":
    OUTPUT.mkdir(parents=True, exist_ok=True)
    hero = ImageOps.fit(
        Image.open(ART / "astrology.png").convert("RGB"),
        (1600, 900),
        method=Image.Resampling.LANCZOS,
        centering=(0.5, 0.5),
    )
    hero.save(OUTPUT / "astrology-hero.webp", "WEBP", quality=82, method=6)
    for key, values in PREVIEWS.items():
        render_category(key, *values)
    cards = render_tarot_cards()
    print(f"Rendered {len(PREVIEWS)} category and {cards} card previews")
