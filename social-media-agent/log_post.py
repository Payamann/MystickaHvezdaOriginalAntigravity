#!/usr/bin/env python3
"""
log_post.py — Zaznamenání postu vygenerovaného v chatu do content_memory.

Použití z Claude Code (bash):
  python log_post.py \
    --topic "karmické vztahy" \
    --type question \
    --intent soft_promo \
    --caption "Většina lidí si myslí, že karmický vztah je ten, který bolí..."

Zaznamenává:
  - used_topics (anti-repetition)
  - approved_posts (sledování kvality)
  - qg_issue_log (pokud jsou issues)
"""
import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from generators.content_memory import (
    record_post,
    record_approved_post,
    record_engagement,
)


def main():
    parser = argparse.ArgumentParser(description="Zaznamenej post do content_memory")
    parser.add_argument("--topic", required=True, help="Téma postu")
    parser.add_argument("--type", required=True, dest="post_type", help="Typ postu (educational, question, tip, story, quote, blog_promo, myth_bust, daily_energy, daily_check_in, challenge, carousel_plan)")
    parser.add_argument("--hook", default="", help="Zpětně kompatibilní parametr; hookové žebříčky se neukládají")
    parser.add_argument("--intent", default="pure_value", choices=["pure_value", "soft_promo", "direct_promo"])
    parser.add_argument("--score", type=float, help="Volitelné skutečně vypočtené QA skóre; nevyplňuj odhad")
    parser.add_argument("--caption", default="", help="Začátek captionnu pro tracking")
    parser.add_argument("--engagement", default="", choices=["", "high", "medium", "low"],
                        help="Volitelné: rovnou zaznamenat engagement")

    args = parser.parse_args()

    # 1. Záznam do used_topics (anti-repetition)
    record_post(
        topic=args.topic,
        post_type=args.post_type,
        content_intent=args.intent,
    )
    print(f"  [1/2] used_topics: {args.topic} / {args.post_type}")

    # 2. Záznam schváleného postu
    record_approved_post(
        topic=args.topic,
        post_type=args.post_type,
        caption=args.caption,
        quality_score=args.score,
        content_intent=args.intent,
    )
    print("  [2/2] approved_post zaznamenán; QA skóre je jen interní redakční údaj.")

    # Bonus: engagement
    if args.engagement:
        from datetime import date
        record_engagement(
            post_date=date.today().isoformat(),
            post_type=args.post_type,
            topic=args.topic,
            engagement=args.engagement,
        )
        print(f"  [+] engagement: {args.engagement}")

    print(f"\n  Post zaznamenán do content_memory.json")


if __name__ == "__main__":
    main()
