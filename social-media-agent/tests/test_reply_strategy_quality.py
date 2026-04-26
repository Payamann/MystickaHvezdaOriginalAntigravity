import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import config
from reply_quality import evaluate_reply_quality
from reply_strategy import decide_reply_strategy
from reply_templates import render_template_reply


def _comment(message: str, sentiment: str = "neutral", needs_reply: bool = True) -> dict:
    return {
        "id": "c1",
        "message": message,
        "post_message": "Dnešní tarot a jemný výklad pro intuici",
        "sentiment": sentiment,
        "needs_reply": needs_reply,
        "should_hide": False,
    }


def test_positive_comment_uses_template_not_ai():
    strategy = decide_reply_strategy(_comment("Děkuji, krásný příspěvek", "positive"), config.WEBSITE_URL)

    assert strategy.route == "template"
    assert strategy.template_key == "praise"
    assert strategy.model_tier == "none"


def test_emotional_comment_uses_sensitive_ai_without_link():
    strategy = decide_reply_strategy(_comment("Mám se špatně a už nemůžu", "emotional"), config.WEBSITE_URL)

    assert strategy.route == "ai_sensitive"
    assert strategy.allow_link is False
    assert strategy.allowed_url is None


def test_crisis_template_contains_real_help_not_web_link():
    comment = _comment("Nechci žít", "crisis")
    strategy = decide_reply_strategy(comment, config.WEBSITE_URL)
    reply = render_template_reply(comment, strategy)

    assert strategy.route == "template"
    assert "116 123" in reply
    assert "112" in reply
    assert "mystickahvezda.cz" not in reply


def test_quality_gate_blocks_ai_disclosure_and_unapproved_url():
    comment = _comment("Jak funguje tarot?", "question")
    strategy = decide_reply_strategy(comment, config.WEBSITE_URL)
    bad = "Jako AI doporučuji klikni na https://example.com"

    quality = evaluate_reply_quality(bad, comment, strategy, config.WEBSITE_URL)

    assert quality.publishable is False
    assert "ai_disclosure" in quality.blocking_issues
    assert "unapproved_url" in quality.blocking_issues


def test_quality_gate_allows_one_approved_soft_link():
    comment = _comment("Kde si můžu zkusit tarot výklad?", "question")
    strategy = decide_reply_strategy(comment, config.WEBSITE_URL)

    assert strategy.allowed_url == f"{config.WEBSITE_URL.rstrip('/')}/tarot.html"

    reply = f"Tarot se nejlíp čte přes konkrétní otázku. Můžeš zkusit tady: {strategy.allowed_url}"
    quality = evaluate_reply_quality(reply, comment, strategy, config.WEBSITE_URL)

    assert quality.publishable is True
    assert quality.url_count == 1


def test_repeated_reply_is_blocked():
    comment = _comment("Jsem Štír", "neutral")
    strategy = decide_reply_strategy(comment, config.WEBSITE_URL)
    previous = "Štír v tomhle často cítí věci pod povrchem."

    quality = evaluate_reply_quality(previous, comment, strategy, config.WEBSITE_URL, recent_replies=[previous])

    assert quality.publishable is False
    assert "duplicate_reply" in quality.blocking_issues
