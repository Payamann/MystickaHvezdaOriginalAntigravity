"""
Testy pro comment_manager.py — analýza sentimentu komentářů.
Testuje off-topic detekci, spam, hate, otázky, pochvaly.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
from comment_manager import analyze_comment_sentiment


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
    """Hate / urážky → skrýt"""

    @pytest.mark.parametrize("text", [
        "Tohle jsou kraviny",
        "Jste podvod!",
        "Šarlatáni",
        "sarlatan",
        "Jste idioti",
        "hlupaci",
    ])
    def test_hate_detected(self, text):
        result = analyze_comment_sentiment(text)
        assert result["sentiment"] == "negative"
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
        assert result["sentiment"] == "neutral"
        assert result["needs_reply"] is True

    def test_empty_ish(self):
        result = analyze_comment_sentiment("ok")
        assert result["sentiment"] == "neutral"


class TestSkepticalSentiment:
    """Skeptické komentáře"""

    def test_skeptic(self):
        result = analyze_comment_sentiment("Nefunguje mi to, zklamání")
        assert result["sentiment"] == "skeptical"
        assert result["needs_reply"] is True
        assert result["should_hide"] is False
