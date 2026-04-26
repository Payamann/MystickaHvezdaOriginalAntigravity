"""
Testy pro comment_manager.py — analýza sentimentu komentářů.
Testuje off-topic detekci, spam, hate, otázky, pochvaly.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
import comment_manager
from comment_manager import analyze_comment_sentiment, get_comments_to_hide


class TestSpamDetection:
    """Spam komentáře → skrýt"""

    @pytest.mark.parametrize("text", [
        "follow back please!",
        "check my profile",
        "dm me for free readings",
        "earn money fast with crypto",
        "click here for free gift",
    ])
    def test_spam_detected(self, text):
        result = analyze_comment_sentiment(text)
        assert result["sentiment"] == "spam"
        assert result["should_hide"] is True
        assert result["needs_reply"] is False


class TestHateDetection:
    """Hrubé komentáře → klidná odpověď, extrémní útoky → skrýt"""

    @pytest.mark.parametrize("text", [
        "Tohle jsou kraviny",
        "Jste podvod!",
        "Šarlatáni",
        "sarlatan",
        "Jste idioti",
        "hlupaci",
    ])
    def test_rude_detected(self, text):
        result = analyze_comment_sentiment(text)
        assert result["sentiment"] == "rude"
        assert result["needs_reply"] is True
        assert result["should_hide"] is False

    @pytest.mark.parametrize("text", [
        "Drž hubu",
        "chcípněte",
    ])
    def test_severe_abuse_hidden(self, text):
        result = analyze_comment_sentiment(text)
        assert result["should_hide"] is True


class TestPositiveSentiment:
    """Pochvaly → odpovědět"""

    @pytest.mark.parametrize("text", [
        "Díky za krásný příspěvek!",
        "Super, moc se mi to líbí 💜",
        "Skvělé, přesně tohle jsem potřebovala",
        "Děkuji za inspiraci 🙏",
    ])
    def test_positive_detected(self, text):
        result = analyze_comment_sentiment(text)
        assert result["sentiment"] == "positive"
        assert result["needs_reply"] is True
        assert result["should_hide"] is False


class TestQuestionDetection:
    """Otázky → prioritní odpověď"""

    @pytest.mark.parametrize("text", [
        "Jak funguje tarot výklad?",
        "Můžeš mi poradit s krystaly?",
        "Co znamená retrográdní Merkur?",
        "Nevíte jak se medituje s ametystem?",
    ])
    def test_question_detected(self, text):
        result = analyze_comment_sentiment(text)
        assert result["sentiment"] == "question"
        assert result["needs_reply"] is True
        assert result["priority"] == 10  # highest


class TestOffTopicDetection:
    """Off-topic komentáře — detekce a nízká priorita"""

    @pytest.mark.parametrize("text", [
        "Jaký je recept na gulášovou polévku?",
        "Jak investovat do akcií?",
        "Kdo vyhrál fotbalový zápas?",
        "Jaký je nejlepší programovací jazyk?",
        "Koho budete volit v příštích volbách?",
    ])
    def test_off_topic_question(self, text):
        result = analyze_comment_sentiment(text)
        assert result["is_off_topic"] is True

    @pytest.mark.parametrize("text", [
        "Dnes jsem dělala bramborovou polévku",
        "Windows 11 je lepší než Linux",
        "Moje hypotéka mě ničí",
    ])
    def test_off_topic_statement(self, text):
        result = analyze_comment_sentiment(text)
        assert result["is_off_topic"] is True
        assert result["needs_reply"] is False  # nereagovat na off-topic tvrzení

    def test_on_topic_not_flagged(self):
        """Mystické téma nesmí být off-topic"""
        result = analyze_comment_sentiment("Jak se medituje s ametystem?")
        assert result["is_off_topic"] is False

    def test_astro_not_off_topic(self):
        result = analyze_comment_sentiment("Jaké je moje znamení?")
        assert result["is_off_topic"] is False

    def test_tarot_not_off_topic(self):
        result = analyze_comment_sentiment("Můžete mi vyložit karty?")
        assert result["is_off_topic"] is False


class TestNeutralSentiment:
    """Neutrální komentáře"""

    def test_neutral_generic(self):
        result = analyze_comment_sentiment("Zajímavé")
        assert result["sentiment"] == "low_signal"
        assert result["needs_reply"] is False

    def test_empty_ish(self):
        result = analyze_comment_sentiment("ok")
        assert result["sentiment"] in {"neutral", "low_signal"}

    def test_short_zodiac_identity_is_not_low_signal(self):
        result = analyze_comment_sentiment("Štír")
        assert result["sentiment"] == "neutral"
        assert result["needs_reply"] is True


class TestSkepticalSentiment:
    """Skeptické komentáře"""

    def test_skeptic(self):
        result = analyze_comment_sentiment("Nefunguje mi to, zklamání")
        assert result["sentiment"] == "skeptical"
        assert result["needs_reply"] is True
        assert result["should_hide"] is False


class TestEmotionalSupport:
    """Lidé píšící že se mají špatně → podpůrná odpověď"""

    @pytest.mark.parametrize("text", [
        "Mám se špatně",
        "Je mi blbě a už nemůžu",
        "Nejsem v pořádku",
        "Po rozchodu se cítím hrozně",
    ])
    def test_emotional_support_detected(self, text):
        result = analyze_comment_sentiment(text)
        assert result["sentiment"] == "emotional"
        assert result["needs_reply"] is True
        assert result["priority"] >= 7

    @pytest.mark.parametrize("text", [
        "Nechci žít",
        "Chci si ublížit",
    ])
    def test_crisis_detected(self, text):
        result = analyze_comment_sentiment(text)
        assert result["sentiment"] == "crisis"
        assert result["needs_reply"] is True
        assert result["should_hide"] is False


class TestModerationQueue:
    """Spam/hate komentáře se musí dostat do moderace i s nízkou prioritou."""

    def test_hide_queue_includes_should_hide_comments(self, monkeypatch):
        monkeypatch.setattr(comment_manager, "_load_db", lambda: {
            "comments": {
                "1": {
                    "id": "1",
                    "status": "new",
                    "platform": "facebook",
                    "from_name": "User",
                    "should_hide": True,
                    "message": "spam",
                },
                "2": {
                    "id": "2",
                    "status": "new",
                    "platform": "facebook",
                    "from_name": "User",
                    "should_hide": False,
                    "message": "normální komentář",
                },
            }
        })

        result = get_comments_to_hide()

        assert [comment["id"] for comment in result] == ["1"]
