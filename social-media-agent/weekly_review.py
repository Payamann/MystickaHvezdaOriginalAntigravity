#!/usr/bin/env python3
"""Factual editorial and engagement summary for the social media agent."""

import argparse
import io
import sys
from collections import Counter
from datetime import date, timedelta
from pathlib import Path

# Keep Czech output readable in the Windows console.
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

sys.path.insert(0, str(Path(__file__).parent))
from generators.content_memory import _load_memory, record_editorial_note


def _entry_date(entry: dict) -> date | None:
    raw = entry.get("date") or entry.get("rated_at")
    try:
        return date.fromisoformat(str(raw)[:10])
    except (TypeError, ValueError):
        return None


def get_posts_in_range(memory: dict, days: int) -> list[dict]:
    """Return recorded topics inside an inclusive, user-selected date window."""
    cutoff = date.today() - timedelta(days=max(days - 1, 0))
    return [
        post for post in memory.get("used_topics", [])
        if (entry_date := _entry_date(post)) is not None and entry_date >= cutoff
    ]


def print_separator(char: str = "─", width: int = 60):
    print(char * width)


def run_review(days: int = 7, feedback: str = ""):
    days = max(1, days)
    memory = _load_memory()
    posts = get_posts_in_range(memory, days)
    cutoff = date.today() - timedelta(days=days - 1)
    approved = [
        post for post in memory.get("approved_posts", [])
        if (entry_date := _entry_date(post)) is not None and entry_date >= cutoff
    ]
    engagement = [
        entry for entry in memory.get("engagement_log", [])
        if (entry_date := _entry_date(entry)) is not None and entry_date >= cutoff
    ]

    print()
    print_separator("═")
    print(f"  REDAKČNÍ PŘEHLED — posledních {days} dní")
    print(f"  {cutoff.isoformat()} → {date.today().isoformat()}")
    print_separator("═")
    print(f"\n  Zaznamenaná témata: {len(posts)}")
    print(f"  Schválené návrhy:   {len(approved)}")
    if approved:
        scores = [
            float(post["quality_score"])
            for post in approved
            if isinstance(post.get("quality_score"), (int, float))
        ]
        if scores:
            print(f"  Průměrné interní QA skóre: {sum(scores) / len(scores):.1f}/10 ({len(scores)} hodnocení)")
            print("  QA skóre je redakční signál, ne údaj o dosahu ani úspěchu příspěvku.")

    if posts:
        print_separator()
        print("  TÉMATA A FORMÁTY, KTERÉ SE OBJEVILY")
        print_separator()
        topics = Counter((post.get("topic") or "bez tématu").strip() for post in posts)
        for topic, count in topics.most_common(10):
            print(f"  {count}×  {topic[:52]}")
        types = Counter(post.get("post_type") or "bez typu" for post in posts)
        print("\n  Formáty: " + ", ".join(f"{name} ({count}×)" for name, count in types.most_common()))

    if engagement:
        print_separator()
        print("  RUČNĚ ZAZNAMENANÝ ENGAGEMENT")
        print_separator()
        counts = Counter(entry.get("engagement", "nezadáno") for entry in engagement)
        print("  " + " · ".join(f"{name}: {count}×" for name, count in counts.items()))
        for entry in engagement[-5:]:
            note = f" — {entry['notes'][:100]}" if entry.get("notes") else ""
            print(f"  {entry.get('engagement', '?')}: {entry.get('topic', '?')[:42]}{note}")
        if len(engagement) < 5:
            print("  Malý vzorek: ber ho jako poznámku, ne jako trend nebo pravidlo pro další obsah.")
        else:
            print("  Výsledek popisuje jen tyto zaznamenané příspěvky; sám neurčuje další témata ani formáty.")

    saved_notes = [
        note for note in memory.get("editorial_notes", [])
        if (entry_date := _entry_date(note)) is not None and entry_date >= cutoff
    ]
    if saved_notes:
        print_separator()
        print("  REDAKČNÍ POZNÁMKY")
        print_separator()
        for note in saved_notes[-8:]:
            print(f"  {note.get('date', '')} — {note.get('note', '')[:180]}")

    if feedback.strip():
        record_editorial_note(feedback, source="weekly_review")
        print_separator()
        print("  Poznámka uložena odděleně od engagement metrik.")
        print(f"  {feedback.strip()[:240]}")

    print_separator("═")
    print()


def main():
    parser = argparse.ArgumentParser(description="Faktický redakční a engagement přehled")
    parser.add_argument("--days", type=int, default=7, help="Počet zahrnutých dní (default: 7)")
    parser.add_argument("--feedback", default="", help="Volitelná ruční redakční poznámka")
    args = parser.parse_args()
    run_review(days=args.days, feedback=args.feedback)


if __name__ == "__main__":
    main()