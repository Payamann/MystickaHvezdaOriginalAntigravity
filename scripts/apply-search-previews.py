"""Assign branded link previews to canonical pages in sitemap.xml.

Run after static page generators: python scripts/apply-search-previews.py
This edits only image preview metadata and is safe to rerun. Illustrated
tarot card pages retain their specific card image.
"""

from __future__ import annotations

import re
from collections import Counter
from html import escape, unescape
from pathlib import Path
from urllib.parse import urlparse
from xml.etree import ElementTree


ROOT = Path(__file__).resolve().parents[1]
BASE = "https://www.mystickahvezda.cz/img/search-preview/"
META = re.compile(r"<meta\b[^>]*>", re.IGNORECASE | re.DOTALL)
ATTR = re.compile(r"([\w:-]+)\s*=\s*([\"'])(.*?)\2", re.DOTALL)


def attrs(tag: str) -> dict[str, str]:
    return {key.lower(): value for key, _, value in ATTR.findall(tag)}


def category(path: Path) -> str:
    parts = path.parts
    locale = parts[0] if parts and parts[0] in {"sk", "pl"} else ""
    stem = path.stem.lower()
    folder = parts[0] if parts else ""
    if locale:
        folder = parts[1] if len(parts) > 1 else ""
        if stem == "index": return f"home-{locale}"
        if "horoskop" in stem: return f"horoscopes-{locale}"
        if "natalni" in stem: return f"natal-{locale}"
        if "andel" in stem: return f"angels-{locale}"
        return f"tarot-{locale}" if "tarot" in stem else f"other-{locale}"
    if folder == "jmena": return "names"
    if folder == "snar": return "dreams"
    if folder == "partnerska-shoda": return "compatibility"
    if folder == "tarot-vyznam": return "tarot-card"
    if folder == "blog": return "blog"
    if folder == "andelske-karty": return "angels"
    if folder == "slovnik": return "dictionary"
    if folder == "horoskop": return "horoscopes"
    if folder == "numerologie": return "numerology"
    if folder == "testy": return "tests"
    if stem == "index": return "home"
    if stem == "vztahovy-vyklad": return "relationship-reading"
    if stem == "tarot-laska": return "tarot-love"
    if stem == "tarot-ano-ne": return "tarot-yes-no"
    if "tarot" in stem: return "tarot"
    if "horoskop" in stem: return "horoscopes"
    if "natalni" in stem or "astro-mapa" in stem: return "natal"
    if "partnerska" in stem or "synastr" in stem: return "compatibility"
    if "numerolog" in stem or "cislo" in stem: return "numerology"
    if "snar" in stem or "sen" in stem: return "dreams"
    if "andel" in stem: return "angels"
    if "slovnik" in stem: return "dictionary"
    if "blog" in stem: return "blog"
    if "lun" in stem or "mesic" in stem: return "moon"
    if "run" in stem: return "runes"
    if "test" in stem: return "tests"
    return "other"


def replace_meta(source: str, key: str, value: str, *, kind: str = "property") -> str:
    wanted = key.lower()
    escaped = escape(value, quote=True)
    found = False

    def update(match: re.Match[str]) -> str:
        nonlocal found
        tag = match.group()
        a = attrs(tag)
        if a.get(kind, "").lower() != wanted:
            return tag
        found = True
        content = re.compile(r"(\bcontent\s*=\s*)([\"']).*?\2", re.IGNORECASE | re.DOTALL)
        if content.search(tag):
            return content.sub(lambda m: f'{m.group(1)}{m.group(2)}{escaped}{m.group(2)}', tag, count=1)
        return tag[:-1] + f' content="{escaped}">'

    source = META.sub(update, source)
    if not found:
        newline = "\r\n" if "\r\n" in source else "\n"
        insertion = f'<meta {kind}="{key}" content="{escaped}">{newline}'
        source = re.sub(r"</head\s*>", insertion + "</head>", source, count=1, flags=re.IGNORECASE)
    return source


def update_page(path: Path, label: str) -> bool:
    original = path.read_bytes().decode("utf-8")
    image = BASE + (f"tarot-cards/{path.stem}" if label == "tarot-card" else label) + ".webp"
    match = re.search(r"<title\b[^>]*>(.*?)</title\s*>", original, re.IGNORECASE | re.DOTALL)
    image_alt = " ".join(unescape(match.group(1)).split()) if match else "Mystická Hvězda"
    output = replace_meta(original, "og:image", image)
    output = replace_meta(output, "og:image:width", "1200")
    output = replace_meta(output, "og:image:height", "630")
    output = replace_meta(output, "og:image:alt", image_alt)
    output = replace_meta(output, "twitter:card", "summary_large_image", kind="name")
    output = replace_meta(output, "twitter:image", image, kind="name")
    output = replace_meta(output, "twitter:image:alt", image_alt, kind="name")
    if output == original:
        return False
    path.write_bytes(output.encode("utf-8"))
    return True


def main() -> None:
    urls = [node.text.strip() for node in ElementTree.parse(ROOT / "sitemap.xml").iter()
            if node.tag.endswith("loc") and node.text]
    paths = []
    for url in urls:
        path = Path(urlparse(url).path.lstrip("/"))
        if str(path) == ".": path = Path("index.html")
        if not path.suffix: path = path / "index.html"
        paths.append(path)
    # The paid pilot page is deliberately noindex, but still needs a good
    # preview when someone sends its link privately.
    paths.append(Path("vztahovy-vyklad.html"))
    counts: Counter[str] = Counter()
    changed = 0
    missing = []
    for path in dict.fromkeys(paths):
        if not (ROOT / path).is_file():
            missing.append(str(path))
            continue
        label = category(path)
        asset = ROOT / "img" / "search-preview" / (f"tarot-cards/{path.stem}.webp" if label == "tarot-card" else f"{label}.webp")
        if not asset.is_file():
            raise FileNotFoundError(f"Missing preview image for {label}: {path}")
        changed += update_page(ROOT / path, label)
        counts[label] += 1
    print(f"Visited {len(paths)} pages; updated {changed}; missing {len(missing)}")
    print("Categories:", dict(counts))
    if missing:
        print("Missing pages:", missing[:10])


if __name__ == "__main__":
    main()
