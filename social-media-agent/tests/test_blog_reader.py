"""
Testy pro blog_reader.py
- Načítání článků
- Řazení dle data
- Formátování pro post
"""
import sys
import json
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
import config
from blog_reader import (
    load_blog_articles, get_latest_articles,
    get_articles_by_category, get_article_for_promo,
    format_article_for_post,
)


@pytest.fixture
def mock_blog_index(tmp_path, monkeypatch):
    """Vytvoří testovací blog-index.json"""
    articles = [
        {
            "title": "Základy tarotu",
            "slug": "zaklady-tarotu",
            "category": "Tarot",
            "published_at": "2025-12-01",
            "short_description": "Jak začít s tarotem",
        },
        {
            "title": "Měsíční rituály",
            "slug": "mesicni-ritualy",
            "category": "Rituály",
            "published_at": "2026-01-15",
            "short_description": "Rituály podle fáze Měsíce",
        },
        {
            "title": "Čakrová meditace",
            "slug": "cakrova-meditace",
            "category": "Meditace",
            "published_at": "2026-02-20",
            "short_description": "Průvodce čakrovou meditací",
        },
    ]
    blog_file = tmp_path / "blog-index.json"
    blog_file.write_text(json.dumps({"articles": articles}, ensure_ascii=False), encoding="utf-8")
    monkeypatch.setattr(config, "BLOG_INDEX_PATH", blog_file)
    return articles


class TestLoadArticles:
    """Testy načítání článků"""

    def test_loads_articles(self, mock_blog_index):
        articles = load_blog_articles()
        assert len(articles) == 3

    def test_missing_file_returns_empty(self, tmp_path, monkeypatch):
        monkeypatch.setattr(config, "BLOG_INDEX_PATH", tmp_path / "nonexistent.json")
        assert load_blog_articles() == []


class TestLatestArticles:
    """Testy řazení dle data"""

    def test_sorted_by_date_desc(self, mock_blog_index):
        latest = get_latest_articles(count=3)
        assert latest[0]["slug"] == "cakrova-meditace"  # 2026-02-20
        assert latest[1]["slug"] == "mesicni-ritualy"    # 2026-01-15
        assert latest[2]["slug"] == "zaklady-tarotu"     # 2025-12-01

    def test_count_limit(self, mock_blog_index):
        latest = get_latest_articles(count=1)
        assert len(latest) == 1


class TestArticlesByCategory:
    def test_filter_by_category(self, mock_blog_index):
        tarot = get_articles_by_category("Tarot")
        assert len(tarot) == 1
        assert tarot[0]["slug"] == "zaklady-tarotu"

    def test_no_match(self, mock_blog_index):
        result = get_articles_by_category("Neexistující")
        assert result == []


class TestFormatArticle:
    def test_format_structure(self, mock_blog_index):
        article = mock_blog_index[0]
        formatted = format_article_for_post(article)
        assert "title" in formatted
        assert "url" in formatted
        assert "description" in formatted
        assert formatted["url"].endswith("/blog/zaklady-tarotu.html")


class TestArticleForPromo:
    def test_returns_article(self, mock_blog_index):
        article = get_article_for_promo()
        assert article is not None
        assert "slug" in article
