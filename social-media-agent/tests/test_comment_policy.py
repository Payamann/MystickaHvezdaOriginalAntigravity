"""
Tests for conservative website invites in public comment replies.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from comment_policy import (
    find_allowed_comment_tool,
    sanitize_reply_links,
    should_offer_comment_link,
)


def test_direct_tarot_question_can_get_relevant_link():
    offer, tool = should_offer_comment_link(
        original_comment="Kde si můžu vyzkoušet tarotový výklad?",
        post_topic="tarot a intuice",
        context_type="otazka",
    )

    assert offer is True
    assert tool is not None
    assert tool.url == "/tarot.html"


def test_praise_does_not_get_link():
    offer, tool = should_offer_comment_link(
        original_comment="Krásné, děkuji za inspiraci",
        post_topic="tarot a intuice",
        context_type="pochvala",
    )

    assert offer is False
    assert tool is not None


def test_emotional_support_does_not_get_link():
    offer, tool = should_offer_comment_link(
        original_comment="Mám se špatně, tarot mě dnes jen zaujal",
        post_topic="tarot a intuice",
        context_type="emocionalni_stav",
        db_sentiment="emotional",
    )

    assert offer is False
    assert tool is not None


def test_rude_reply_does_not_get_link():
    offer, tool = should_offer_comment_link(
        original_comment="Tohle je úplná kravina",
        post_topic="tarot a intuice",
        context_type="hruby_komentar",
        db_sentiment="rude",
    )

    assert offer is False
    assert tool is not None


def test_disallowed_links_are_removed():
    cleaned = sanitize_reply_links(
        "Tady je víc: https://www.mystickahvezda.cz/aura.html a https://spam.example/x",
        "https://www.mystickahvezda.cz",
        allowed_url="https://www.mystickahvezda.cz/tarot.html",
    )

    assert "aura.html" not in cleaned
    assert "spam.example" not in cleaned


def test_allowed_tool_catalog_matches_comments():
    tool = find_allowed_comment_tool("Co znamená 11:11?")
    assert tool is not None
    assert tool.url == "/numerologie.html"
