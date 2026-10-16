#!/usr/bin/env python3
"""Static source asset inventory for the seven W12 release pages. No network/browser."""
from __future__ import annotations
import gzip, json, re, sys
from collections import Counter, defaultdict
from pathlib import Path
from urllib.parse import urlsplit, unquote

ROOT = Path(__file__).resolve().parents[1]
PAGES = ["index.html", "tarot-ano-ne.html", "horoskopy.html", "natalni-karta.html", "profil.html", "shamansko-kolo.html", "vztahovy-vyklad.html"]
ATTR = re.compile(r'\b(src|href|srcset|poster|loading|width|height)\s*=\s*["\']([^"\']+)["\']', re.I)
CSS_URL = re.compile(r'url\(\s*["\']?([^"\')]+)', re.I)
CSS_IMPORT = re.compile(r'@import\s+(?:url\()?\s*["\']([^"\']+)', re.I)

def local(base: Path, raw: str):
    u = urlsplit(raw.strip())
    if u.scheme or u.netloc or raw.startswith(("#", "data:", "blob:")):
        return None
    if u.path.startswith("/"):
        return (ROOT / unquote(u.path.lstrip("/")).replace("/", "\\")).resolve()
    return (base / unquote(u.path.split("?")[0])).resolve()

def main():
    occurrences = defaultdict(list)
    css_files = defaultdict(set)
    page_records = {}
    for page_name in PAGES:
        page = ROOT / page_name
        html = page.read_text(encoding="utf-8", errors="replace")
        refs = []
        raw_tags = re.findall(r'<(?:script|link|img|source|video)\b[^>]*>', html, re.I)
        for t in raw_tags:
            kind = re.match(r'<(\w+)', t, re.I).group(1).lower()
            attrs = {k.lower(): v for k, v in ATTR.findall(t)}
            raws = []
            primary = attrs.get("src") or attrs.get("href") or attrs.get("poster")
            if primary: raws.append(primary)
            if attrs.get("srcset"):
                raws.extend(piece.strip().split()[0] for piece in attrs["srcset"].split(",") if piece.strip())
            for path_raw in raws:
                    path = local(page.parent, path_raw)
                    if path and path.is_file():
                        role = "css" if kind == "link" and "stylesheet" in t.lower() else kind
                        loading = attrs.get("loading", "eager/default").lower()
                        rec = {"page": page_name, "kind": role, "url": path_raw, "loading": loading,
                               "preload": bool(re.search(r'rel\s*=\s*["\']preload', t, re.I)),
                               "width": attrs.get("width"), "height": attrs.get("height")}
                        occurrences[str(path.relative_to(ROOT))].append(rec); refs.append(str(path.relative_to(ROOT)))
                        if role == "css":
                            css_files[page_name].add(path)
        # walk CSS url()/imports reachable through directly linked stylesheets
        queue = list(css_files[page_name]); seen = set()
        while queue:
            css = queue.pop(0)
            if css in seen or not css.is_file(): continue
            seen.add(css)
            text = css.read_text(encoding="utf-8", errors="replace")
            for raw in CSS_IMPORT.findall(text):
                p = local(css.parent, raw)
                if p and p.is_file(): queue.append(p)
            for raw in CSS_URL.findall(text):
                p = local(css.parent, raw)
                if p and p.is_file():
                    key = str(p.relative_to(ROOT)) if p.is_relative_to(ROOT) else str(p)
                    occurrences[key].append({"page": page_name, "kind": "css-url", "url": raw,
                                             "loading": "css (no lazy hint)", "preload": False, "width": None, "height": None})
        page_records[page_name] = {"direct_local_refs": refs, "reachable_css": [str(x.relative_to(ROOT)) for x in sorted(seen)]}
    assets = []
    for rel, uses in sorted(occurrences.items()):
        p = ROOT / rel
        raw = p.read_bytes()
        assets.append({"path": rel, "bytes": len(raw), "gzip_bytes_local_estimate": len(gzip.compress(raw, mtime=0)), "uses": uses,
                       "pages": sorted({u["page"] for u in uses}), "occurrence_count": len(uses),
                       "duplicate_across_pages": len({u["page"] for u in uses}) > 1})
    out = {"method": "static HTML attributes and local CSS url()/@import closure; excludes JS-computed/dynamic/runtime requests, remote assets, browser cache and transfer encoding",
           "pages": page_records, "assets": assets,
           "totals": {"unique_files": len(assets), "raw_bytes_unique": sum(a["bytes"] for a in assets),
                      "gzip_bytes_local_estimate_unique": sum(a["gzip_bytes_local_estimate"] for a in assets),
                      "page_file_references": sum(a["occurrence_count"] for a in assets),
                      "raw_bytes_referenced": sum(a["bytes"] * a["occurrence_count"] for a in assets),
                      "gzip_bytes_local_estimate_referenced": sum(a["gzip_bytes_local_estimate"] * a["occurrence_count"] for a in assets),
                      "eager_or_default_refs": sum(1 for a in assets for u in a["uses"] if u["loading"] in ("eager/default", "css (no lazy hint)")),
                      "lazy_refs": sum(1 for a in assets for u in a["uses"] if u["loading"] == "lazy")}}
    json.dump(out, sys.stdout, ensure_ascii=False, indent=2)
    print()
if __name__ == "__main__": main()
