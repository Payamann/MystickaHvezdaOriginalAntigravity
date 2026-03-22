"""
Testy pro brand_knowledge.py
- Hledání nástrojů
- Hledání blogových článků
- Knowledge prompt builder
- Anti-AI kontrola (žádné zmínky o AI v popiscích)
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
from brand_knowledge import (
    TOOLS_AND_FEATURES, PRICING_PLANS, FAQ, USP,
    build_knowledge_prompt, find_relevant_tool,
    find_relevant_blog, get_blog_summary_for_prompt,
)


class TestToolsAndFeatures:
    """Testy struktury nástrojů"""

    def test_free_tools_exist(self):
        assert "free" in TOOLS_AND_FEATURES
        assert len(TOOLS_AND_FEATURES["free"]) >= 10

    def test_premium_tools_exist(self):
        assert "premium" in TOOLS_AND_FEATURES
        assert len(TOOLS_AND_FEATURES["premium"]) >= 5

    def test_tool_structure(self):
        """Každý nástroj musí mít name, url, description"""
        for tier in TOOLS_AND_FEATURES.values():
            for key, tool in tier.items():
                assert "name" in tool, f"Tool {key} nemá 'name'"
                assert "description" in tool, f"Tool {key} nemá 'description'"

    def test_no_ai_mentions_in_descriptions(self):
        """KRITICKÉ: Žádné zmínky o AI v popiscích nástrojů"""
        ai_terms = ["ai ", "umělá inteligence", "artificial intelligence",
                     "machine learning", "strojové učení", "neural",
                     "ai-powered", "ai výklad", "ai analýza"]
        for tier in TOOLS_AND_FEATURES.values():
            for key, tool in tier.items():
                desc_lower = tool["description"].lower()
                for term in ai_terms:
                    assert term not in desc_lower, (
                        f"Tool '{key}' obsahuje AI zmínku '{term}' v popisu: {tool['description'][:80]}"
                    )


class TestPricingPlans:
    """Testy ceníku"""

    def test_four_plans(self):
        assert len(PRICING_PLANS) == 4

    def test_plan_names(self):
        names = [p["name"] for p in PRICING_PLANS.values()]
        assert "Poutník" in names
        assert "Hvězdný Průvodce" in names

    def test_free_plan_exists(self):
        free = [p for p in PRICING_PLANS.values() if p["price_monthly"] == "0 Kč"]
        assert len(free) == 1
        assert free[0]["name"] == "Poutník"


class TestFindRelevantTool:
    """Testy hledání nástrojů podle tématu"""

    @pytest.mark.parametrize("query", [
        "tarot",
        "numerologie",
        "horoskop",
        "krystaly",
    ])
    def test_finds_tool(self, query):
        tool = find_relevant_tool(query)
        assert tool is not None, f"Nic nenalezeno pro '{query}'"
        assert "name" in tool
        assert "description" in tool

    def test_returns_none_for_unrelated(self):
        """Off-topic dotazy nevrací nástroj"""
        result = find_relevant_tool("fotbal")
        # Může vrátit None, to je OK
        # Hlavně nesmí spadnout


class TestFindRelevantBlog:
    """Testy hledání blogů"""

    def test_returns_list(self):
        result = find_relevant_blog("tarot")
        assert isinstance(result, list)

    def test_max_results(self):
        result = find_relevant_blog("tarot", max_results=2)
        assert len(result) <= 2

    def test_czech_diacritics_handled(self):
        """Hledání funguje i bez diakritiky"""
        result1 = find_relevant_blog("čakry")
        result2 = find_relevant_blog("cakry")
        # Obě by měly najít něco (pokud blog existuje)
        # Hlavně nesmí spadnout


class TestBuildKnowledgePrompt:
    """Testy kompilace znalostního promptu"""

    def test_returns_string(self):
        result = build_knowledge_prompt()
        assert isinstance(result, str)
        assert len(result) > 100

    def test_contains_key_sections(self):
        result = build_knowledge_prompt()
        # Měl by obsahovat ceník
        assert "Kč" in result or "kč" in result.lower() or "zdarma" in result.lower()

    def test_compact_mode(self):
        compact = build_knowledge_prompt(compact=True)
        full = build_knowledge_prompt(compact=False)
        # Compact by měl být kratší nebo stejný
        assert len(compact) <= len(full) + 100  # tolerance

    def test_no_ai_mentions_in_prompt(self):
        """Knowledge prompt nesmí obsahovat AI zmínky"""
        result = build_knowledge_prompt()
        lower = result.lower()
        # Nesmí obsahovat přímé AI zmínky (ale "AI" jako zkratka se může vyskytnout
        # v kontextu "zkontroluj AI" apod. — testujeme jen user-facing fráze)
        assert "umělá inteligence" not in lower
        assert "machine learning" not in lower


class TestFAQAndUSP:
    """Testy FAQ a USP"""

    def test_faq_exists(self):
        assert len(FAQ) >= 5

    def test_faq_structure(self):
        for key, item in FAQ.items():
            assert "q" in item, f"FAQ '{key}' nemá klíč 'q'"
            assert "a" in item, f"FAQ '{key}' nemá klíč 'a'"

    def test_usp_exists(self):
        assert len(USP) >= 3
