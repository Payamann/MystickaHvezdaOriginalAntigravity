"""
Testy pro quality_gate.py
- Rule-based checks (bez API)
- AI disclosure detection
- Caption length checks
- Hashtag checks
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
from quality_gate import validate_post


def _make_post(caption="Test caption o tarot kartách a duchovním růstu", **overrides):
    """Helper — vytvoří minimální post pro testování"""
    post = {
        "caption": caption,
        "hashtags": overrides.pop("hashtags", [
            "#mystickahvezda", "#tarot", "#duchovnost",
            "#astrologie", "#numerologie", "#meditace",
        ]),
        "image_prompt": overrides.pop("image_prompt",
            "mystical tarot cards on velvet, purple glow, golden accents"),
        "call_to_action": overrides.pop("call_to_action",
            "Sdílej s kamarádkou"),
        "topic": overrides.pop("topic", "tarot"),
        "post_type": overrides.pop("post_type", "educational"),
    }
    post.update(overrides)
    return post


class TestCaptionLength:
    """Kontrola délky captionů"""

    def test_too_short_caption(self):
        post = _make_post(caption="Krátký.")
        result = validate_post(post, platform="instagram", run_ai_review=False)
        length_issues = [
            issue for issue in result["issues"]
            if "délk" in issue["message"].lower() or "krátk" in issue["message"].lower()
        ]
        assert length_issues == []

    def test_good_length_caption(self):
        caption = """Věděli jste, že tarotové karty nejsou jen o předpovídání budoucnosti?

Každá karta je zrcadlem vaší duše. Odráží situace, emoce a energie, které právě prožíváte.

Tarot vám pomůže:
- Pochopit svou situaci z nového úhlu
- Najít odpovědi, které už v sobě máte
- Propojit se s vaší vnitřní moudrostí

Zkuste si vytáhnout jednu kartu dnes a nechte se překvapit."""
        post = _make_post(caption=caption)
        result = validate_post(post, platform="instagram", run_ai_review=False)
        length_errors = [i for i in result["issues"]
                        if i["severity"] == "error" and "délk" in i["message"].lower()]
        assert len(length_errors) == 0


class TestAiTransparency:
    """Zmínka o automatizaci sama o sobě není důvodem k blokování textu."""

    def test_truthful_ai_disclosure_is_not_silenced_by_copy_gate(self):
        post = _make_post(caption="Tento výklad připravuje automatizovaný systém.")
        result = validate_post(post, platform="instagram", run_ai_review=False)
        disclosure_issues = [
            issue for issue in result["issues"]
            if "disclosure" in issue["check"].lower()
        ]
        assert disclosure_issues == []

    def test_normal_post_no_ai_flag(self):
        post = _make_post(caption="Dnešní energie Úplňku vám přináší mocnou sílu transformace.")
        result = validate_post(post, platform="instagram", run_ai_review=False)
        ai_issues = [i for i in result["issues"]
                     if i["severity"] == "error" and "ai" in i["check"].lower()]
        assert len(ai_issues) == 0


class TestHashtags:
    """Kontrola hashtagů"""

    def test_hashtag_count_is_not_a_fixed_quality_rule(self):
        post = _make_post(hashtags=[f"#tag{i}" for i in range(35)])
        result = validate_post(post, platform="instagram", run_ai_review=False)
        hashtag_issues = [
            issue for issue in result["issues"]
            if "hashtag" in issue["message"].lower()
        ]
        assert hashtag_issues == []

    def test_no_hashtags_is_valid(self):
        post = _make_post(hashtags=[])
        result = validate_post(post, platform="instagram", run_ai_review=False)
        hashtag_errors = [
            issue for issue in result["issues"]
            if issue["severity"] == "error" and "hashtag" in issue["message"].lower()
        ]
        assert hashtag_errors == []

    def test_good_hashtag_count(self):
        post = _make_post(hashtags=["#mystickahvezda", "#tarot", "#duchovnost"])
        result = validate_post(post, platform="instagram", run_ai_review=False)
        # Nemělo by být kritická chyba v hashtagech
        hashtag_errors = [i for i in result["issues"]
                         if i["severity"] == "error" and "hashtag" in i["message"].lower()]
        assert len(hashtag_errors) == 0


class TestRuleBasedScore:
    """Testy celkového skóre (jen pravidla, bez AI)"""

    def test_returns_valid_structure(self):
        post = _make_post()
        result = validate_post(post, platform="instagram", run_ai_review=False)
        assert "score" in result
        assert "approved" in result
        assert "issues" in result
        assert "rule_score" in result
        assert isinstance(result["issues"], list)

    def test_score_range(self):
        post = _make_post()
        result = validate_post(post, platform="instagram", run_ai_review=False)
        assert 0 <= result["score"] <= 10

    def test_approved_is_bool(self):
        post = _make_post()
        result = validate_post(post, platform="instagram", run_ai_review=False)
        assert isinstance(result["approved"], bool)


class TestForbiddenPhrases:
    """Kontrola zakázaných frází (reklamní/corporate tón)"""

    @pytest.mark.parametrize("phrase", [
        "Využijte jedinečnou nabídku",
        "Kupte nyní se slevou",
    ])
    def test_corporate_tone_flagged(self, phrase):
        post = _make_post(caption=f"{phrase}. Tarot vám ukáže cestu.")
        result = validate_post(post, platform="instagram", run_ai_review=False)
        # Měl by být alespoň warning
        assert any("zakázan" in i["message"].lower() or "corporate" in i["check"].lower()
                   or "fráz" in i["message"].lower()
                   for i in result["issues"]) or result["score"] < 9
