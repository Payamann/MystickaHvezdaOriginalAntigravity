#!/usr/bin/env python3
"""Static inventory of the public HTML visual rollout.

The audit deliberately does not render pages or execute JavaScript.  A missing
target is therefore only reported when a static file can be resolved; API and
other dynamic routes are reported separately as uncovered routes.
"""

from __future__ import annotations

import argparse
import json
import os
import posixpath
import re
from collections import Counter, defaultdict
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from typing import Any
from urllib.parse import urldefrag, urlparse


EXCLUDED_DIRS = {
    "docs", "node_modules", "templates", "components", "social-media-agent",
    ".git", ".agents", "server", "tests", "tmp", "coverage",
    "production-release-v2", "test-results", "playwright-report", "buildartefacts", "tmp_email_previews",
}
INTERNAL_HOSTS = {"mystickahvezda.cz", "www.mystickahvezda.cz"}
DYNAMIC_PREFIXES = ("/api/", "/auth/", "/checkout/", "/stripe/", "/webhook/")
DYNAMIC_NAMES = {"api", "login", "logout", "register", "profile", "session"}
ATLAS_CLASSES = {"atlas-page", "atlas-home", "page-tarot-daily"}


def norm_rel(path: Path) -> str:
    return path.as_posix().lstrip("./")


def is_excluded(path: Path, root: Path) -> bool:
    try:
        rel = path.relative_to(root)
    except ValueError:
        return True
    return any(part.startswith(".") or part in EXCLUDED_DIRS for part in rel.parts)


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.body_classes: list[str] = []
        self.ids: set[str] = set()
        self.references: list[dict[str, str]] = []
        self.stylesheets: list[str] = []
        self.inline_style = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        data = {key.lower(): value or "" for key, value in attrs}
        tag = tag.lower()
        if data.get("id"):
            self.ids.add(data["id"])
        if tag == "body":
            self.body_classes = data.get("class", "").split()
        if tag == "link" and "stylesheet" in data.get("rel", "").lower().split():
            if data.get("href"):
                self.stylesheets.append(data["href"])
        if tag == "style":
            self.inline_style = True
        if tag == "a" and data.get("href"):
            self.references.append({"kind": "href", "value": data["href"]})
        if tag == "img" and data.get("src"):
            self.references.append({"kind": "img-src", "value": data["src"]})

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() == "style":
            self.inline_style = False


def public_html_files(root: Path) -> list[Path]:
    result: list[Path] = []
    for directory, dirs, files in os.walk(root):
        directory_path = Path(directory)
        dirs[:] = [d for d in dirs if d not in EXCLUDED_DIRS and not d.startswith(".")]
        if is_excluded(directory_path, root):
            dirs[:] = []
            continue
        result.extend(
            Path(directory) / name
            for name in files
            if name.lower().endswith((".html", ".htm"))
            and not name.startswith(".")
        )
    return sorted(result)


def parse_reference(raw: str, source: Path, root: Path) -> dict[str, Any]:
    value = raw.strip()
    parsed = urlparse(value)
    result: dict[str, Any] = {"raw": raw, "kind": "static", "target": None}
    if value.startswith("#"):
        result["kind"] = "anchor"
        result["anchor"] = value[1:]
        return result
    if parsed.scheme and parsed.scheme.lower() not in {"http", "https"}:
        result["kind"] = "ignored"
        return result
    if parsed.netloc and parsed.hostname and parsed.hostname.lower() not in INTERNAL_HOSTS:
        result["kind"] = "external"
        return result
    if parsed.netloc and not parsed.hostname:
        result["kind"] = "ignored"
        return result
    if not parsed.path and parsed.query:
        path_part = "/" + source.relative_to(root).as_posix()
    else:
        path_part = parsed.path or "/"
    trailing_slash = path_part.endswith("/") and path_part != "/"
    if not path_part.startswith("/"):
        base = "/" + source.relative_to(root).parent.as_posix()
        path_part = posixpath.join(base, path_part)
    path_part = posixpath.normpath(path_part)
    if not path_part.startswith("/"):
        path_part = "/" + path_part
    if path_part == "/":
        path_part = "/index.html"
    candidate = path_part.lstrip("/")
    if trailing_slash:
        candidate = candidate.rstrip("/") + "/index.html"
    target = (root / Path(candidate)).resolve()
    try:
        target.relative_to(root.resolve())
    except ValueError:
        result["kind"] = "ignored"
        return result
    if target.is_dir():
        directory_index = target / "index.html"
        if directory_index.is_file():
            target = directory_index
            result["target"] = norm_rel(target.relative_to(root))
            return result
    if target.is_file():
        result["target"] = norm_rel(target.relative_to(root))
        return result
    # A route with no extension is commonly server-rendered; static audit cannot
    # prove it broken. Keep it out of missing static targets.
    first = path_part.strip("/").split("/", 1)[0].lower()
    if path_part.startswith(DYNAMIC_PREFIXES) or first in DYNAMIC_NAMES or not Path(path_part).suffix:
        result["kind"] = "dynamic-uncovered"
        result["route"] = path_part
        return result
    result["kind"] = "missing-static"
    result["target"] = candidate
    return result


def group_for(rel: str) -> str:
    parts = Path(rel).parts
    return parts[0] if len(parts) > 1 else "/"


def audit(root: Path) -> dict[str, Any]:
    pages = public_html_files(root)
    inventory: list[dict[str, Any]] = []
    missing: list[dict[str, Any]] = []
    anchors: list[dict[str, Any]] = []
    dynamic_routes: list[dict[str, Any]] = []
    component_refs: list[dict[str, Any]] = []
    group_stats: dict[str, Counter[str]] = defaultdict(Counter)

    for page in pages:
        rel = norm_rel(page.relative_to(root))
        parser = PageParser()
        try:
            parser.feed(page.read_text(encoding="utf-8", errors="replace"))
        except OSError as exc:
            parser.body_classes = []
            inventory.append({"file": rel, "read_error": str(exc)})
            continue
        classes = sorted(set(parser.body_classes))
        markers = sorted(set(classes) & ATLAS_CLASSES)
        migrated = bool(markers)
        entry: dict[str, Any] = {
            "file": rel,
            "group": group_for(rel),
            "body_classes": classes,
            "atlas_markers": markers,
            "migrated": migrated,
            "styles": {"stylesheets": parser.stylesheets, "inline_style": parser.inline_style},
            "static_references": 0,
            "missing_static_references": 0,
            "dynamic_uncovered_references": 0,
            "possible_anchors": 0,
        }
        group_stats[entry["group"]]["pages"] += 1
        group_stats[entry["group"]]["migrated" if migrated else "unmigrated"] += 1
        for stylesheet in parser.stylesheets:
            checked = parse_reference(stylesheet, page, root)
            if checked["kind"] == "missing-static":
                missing.append({"source": rel, "type": "stylesheet", **checked})
        for reference in parser.references:
            checked = parse_reference(reference["value"], page, root)
            checked.update({"source": rel, "type": reference["kind"]})
            if checked["kind"] == "static":
                entry["static_references"] += 1
            elif checked["kind"] == "missing-static":
                entry["missing_static_references"] += 1
                missing.append(checked)
            elif checked["kind"] == "dynamic-uncovered":
                entry["dynamic_uncovered_references"] += 1
                dynamic_routes.append(checked)
            elif checked["kind"] == "anchor":
                entry["possible_anchors"] += 1
                checked["target_exists_in_static_html"] = checked.get("anchor") in parser.ids
                checked["limitation"] = "Static HTML only; dynamic components may add this anchor."
                anchors.append(checked)
            if (checked.get("target") or "").replace("\\", "/").startswith("components/"):
                component_refs.append(checked)
        inventory.append(entry)

    # Injected shared HTML is checked separately from standalone page counts.
    for component in sorted((root / 'components').glob('*.html')):
        parser = PageParser()
        parser.feed(component.read_text(encoding='utf-8', errors='replace'))
        for reference in parser.references:
            checked = parse_reference(reference['value'], root / 'index.html', root)
            checked.update({'source': norm_rel(component.relative_to(root)), 'type': reference['kind']})
            component_refs.append(checked)
            if checked['kind'] == 'missing-static':
                missing.append(checked)
            elif checked['kind'] == 'dynamic-uncovered':
                dynamic_routes.append(checked)
    migrated = [x["file"] for x in inventory if x.get("migrated")]
    unmigrated = [x["file"] for x in inventory if not x.get("migrated")]
    groups = {
        key: {"pages": val["pages"], "migrated": val["migrated"], "unmigrated": val["unmigrated"],
              "coverage_percent": round(100 * val["migrated"] / val["pages"], 1) if val["pages"] else 0}
        for key, val in sorted(group_stats.items())
    }
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "scope": {"root": str(root), "html_pages": len(pages), "excluded_directories": sorted(EXCLUDED_DIRS), "static_only": True},
        "counts": {"pages": len(inventory), "migrated": len(migrated), "unmigrated": len(unmigrated),
                   "missing_static_targets": len(missing), "possible_anchors": len(anchors),
                   "dynamic_uncovered_routes": len(dynamic_routes), "component_references": len(component_refs)},
        "group_coverage": groups,
        "migrated": migrated,
        "unmigrated": unmigrated,
        "missing_static_targets": missing,
        "possible_anchors": anchors,
        "dynamic_uncovered_routes": dynamic_routes,
        "component_references": component_refs,
        "pages": inventory,
    }


def markdown(report: dict[str, Any]) -> str:
    counts = report["counts"]
    lines = ["# Visual rollout audit", "", "Static HTML inventory; this does not render JavaScript or prove dynamic routes.", "",
             f"Generated: `{report['generated_at']}`", "", "## Counts", "",
             "| Metric | Count |", "|---|---:|"]
    labels = [("Public HTML pages", "pages"), ("Migrated", "migrated"), ("Unmigrated", "unmigrated"),
              ("Missing static targets", "missing_static_targets"), ("Possible anchors", "possible_anchors"),
              ("Dynamic routes not statically covered", "dynamic_uncovered_routes"), ("Component references", "component_references")]
    lines += [f"| {label} | {counts[key]} |" for label, key in labels]
    lines += ["", "## Group coverage", "", "| Group | Pages | Migrated | Unmigrated | Coverage |", "|---|---:|---:|---:|---:|"]
    lines += [f"| {group} | {data['pages']} | {data['migrated']} | {data['unmigrated']} | {data['coverage_percent']}% |" for group, data in report["group_coverage"].items()]
    lines += ["", "## Migrated", ""] + [f"- `{item}`" for item in report["migrated"]]
    lines += ["", "## Unmigrated", ""] + [f"- `{item}`" for item in report["unmigrated"]]
    lines += ["", "## Missing static targets", ""]
    lines += [f"- `{item['source']}` {item['type']}: `{item['raw']}` -> `{item.get('target')}`" for item in report["missing_static_targets"]] or ["- None found."]
    lines += ["", "## Possible anchors", "", "Static checking cannot account for anchors added by dynamic components.", ""]
    lines += [f"- `{item['source']}`: `#{item.get('anchor', '')}` (static id present: {item.get('target_exists_in_static_html')})" for item in report["possible_anchors"]] or ["- None found."]
    lines += ["", "## Dynamic routes", "", "These routes were excluded from definitive broken link findings because they need runtime/server verification.", ""]
    lines += [f"- `{item['source']}` {item['type']}: `{item.get('route', item['raw'])}`" for item in report["dynamic_uncovered_routes"]] or ["- None found."]
    return "\n".join(lines) + "\n"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--json", type=Path, default=None)
    parser.add_argument("--markdown", type=Path, default=None)
    args = parser.parse_args()
    root = args.root.resolve()
    json_path = (args.json or root / "docs" / "visual-rollout-audit.json").resolve()
    md_path = (args.markdown or root / "docs" / "visual-rollout-audit.md").resolve()
    report = audit(root)
    json_path.parent.mkdir(parents=True, exist_ok=True)
    md_path.parent.mkdir(parents=True, exist_ok=True)
    json_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    md_path.write_text(markdown(report), encoding="utf-8")
    print(f"Audited {report['counts']['pages']} public HTML pages")
    print(f"Migrated: {report['counts']['migrated']}; unmigrated: {report['counts']['unmigrated']}")
    print(f"Missing static targets: {report['counts']['missing_static_targets']}; dynamic routes: {report['counts']['dynamic_uncovered_routes']}")


if __name__ == "__main__":
    main()
