"""
Blog Reader — čte blog-index.json a připravuje obsah pro social media posty
"""
import json
from pathlib import Path
from typing import Optional
import sys
sys.path.insert(0, str(Path(__file__).parent))
import config
from logger import get_logger

log = get_logger(__name__)


def load_blog_articles() -> list[dict]:
    """Načte všechny blogové články z blog-index.json"""
    blog_index_path = config.BLOG_INDEX_PATH

    if not blog_index_path.exists():
        log.warning("blog-index.json nenalezen v: %s", blog_index_path)
        return []

    with open(blog_index_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    return data.get('articles', data) if isinstance(data, dict) else data


def get_latest_articles(count: int = 5) -> list[dict]:
    """Vrátí N nejnovějších článků seřazených dle data publikace"""
    articles = load_blog_articles()
    # Seřadíme od nejnovějšího — published_at formát: "2025-01-15" (ISO)
    articles_sorted = sorted(
        articles,
        key=lambda a: a.get('published_at', ''),
        reverse=True,
    )
    return articles_sorted[:count]


def get_articles_by_category(category: str) -> list[dict]:
    """Vrátí články z dané kategorie"""
    articles = load_blog_articles()
    return [a for a in articles if a.get('category', '').lower() == category.lower()]


def get_article_for_promo() -> Optional[dict]:
    """
    Vybere nejnovější článek, který NEBYL propagován v posledních 30 dnech.
    Používá content_memory pro sledování propagovaných blogů.
    """
    from generators.content_memory import get_promoted_blog_slugs
    articles = load_blog_articles()
    if not articles:
        return None

    recently_promoted = set(get_promoted_blog_slugs())

    # Vrať první nepropagovaný článek
    for article in articles:
        slug = article.get('slug', '')
        if slug not in recently_promoted:
            return article

    # Pokud jsou všechny propagované, vrať nejnovější (lepší než nic)
    return articles[0]


def format_article_for_post(article: dict) -> dict:
    """Formátuje artikel pro použití v post generátoru"""
    slug = article.get('slug', '')
    return {
        'title': article.get('title', ''),
        'url': f"{config.WEBSITE_URL}/blog/{slug}.html",
        'description': article.get('short_description', ''),
        'category': article.get('category', ''),
        'published_at': article.get('published_at', ''),
    }


if __name__ == "__main__":
    from rich.console import Console
    from rich.table import Table

    console = Console()

    articles = load_blog_articles()
    console.print(f"[bold green]Načteno {len(articles)} článků z blog-index.json[/bold green]\n")

    table = Table(title="Nejnovější Blog Články")
    table.add_column("Název", style="cyan")
    table.add_column("Kategorie", style="yellow")
    table.add_column("Datum")

    for a in articles[:10]:
        table.add_row(
            a.get('title', '')[:50],
            a.get('category', ''),
            a.get('published_at', '')
        )

    console.print(table)
