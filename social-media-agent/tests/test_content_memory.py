"""
Testy pro generators/content_memory.py
- Atomický zápis
- Record/load cycle
- Variety context
"""
import sys
import json
import tempfile
import shutil
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
import config
from generators.content_memory import (
    _load_memory, _save_memory, record_post,
    get_variety_context, get_promoted_blog_slugs, MEMORY_FILE,
)


@pytest.fixture
def clean_memory(tmp_path, monkeypatch):
    """Přesměruje OUTPUT_DIR do temp adresáře pro izolaci testů"""
    monkeypatch.setattr(config, "OUTPUT_DIR", tmp_path)
    # Aktualizuj MEMORY_FILE v modulu
    import generators.content_memory as cm
    monkeypatch.setattr(cm, "MEMORY_FILE", tmp_path / "content_memory.json")
    yield tmp_path


class TestAtomicWrites:
    """Testy atomického zápisu paměti"""

    def test_save_creates_file(self, clean_memory):
        memory = {"used_topics": [], "total_posts": 0}
        _save_memory(memory)
        import generators.content_memory as cm
        assert cm.MEMORY_FILE.exists()

    def test_save_load_roundtrip(self, clean_memory):
        memory = {
            "used_topics": [{"topic": "tarot", "post_type": "educational", "date": "2026-03-22"}],
            "used_hooks": [],
            "used_post_types_last_7": [],
            "last_blog_promos": [],
            "total_posts": 1,
            "created_at": "2026-03-22T10:00:00",
        }
        _save_memory(memory)
        loaded = _load_memory()
        assert loaded["total_posts"] == 1
        assert loaded["used_topics"][0]["topic"] == "tarot"

    def test_no_temp_files_left(self, clean_memory):
        """Atomický zápis nesmí nechat temp soubory"""
        _save_memory({"used_topics": [], "total_posts": 0})
        tmp_files = list(clean_memory.glob("content_memory_*.tmp"))
        assert len(tmp_files) == 0

    def test_corrupted_json_recovery(self, clean_memory):
        """Poškozený JSON → vrátí čistou paměť"""
        import generators.content_memory as cm
        cm.MEMORY_FILE.write_text("{invalid json", encoding="utf-8")
        memory = _load_memory()
        assert memory["total_posts"] == 0
        assert memory["used_topics"] == []


class TestRecordPost:
    """Testy zaznamenávání postů"""

    def test_record_increments_total(self, clean_memory):
        record_post("tarot", "educational")
        memory = _load_memory()
        assert memory["total_posts"] == 1

    def test_record_multiple(self, clean_memory):
        record_post("tarot", "educational")
        record_post("astrologie", "tip")
        record_post("krystaly", "story")
        memory = _load_memory()
        assert memory["total_posts"] == 3
        assert len(memory["used_topics"]) == 3

    def test_record_with_hook(self, clean_memory):
        record_post("tarot", "educational", hook_formula="question_hook")
        memory = _load_memory()
        assert memory["used_hooks"][0]["formula"] == "question_hook"

    def test_record_with_blog(self, clean_memory):
        record_post("tarot", "blog_promo", blog_slug="tarot-zaklady")
        memory = _load_memory()
        assert memory["last_blog_promos"][0]["slug"] == "tarot-zaklady"

    def test_max_100_entries(self, clean_memory):
        """Paměť udržuje max 100 záznamů per kategorie"""
        for i in range(120):
            record_post(f"topic_{i}", "educational")
        memory = _load_memory()
        assert len(memory["used_topics"]) <= 100


class TestVarietyContext:
    """Testy kontextu pro variace"""

    def test_empty_memory(self, clean_memory):
        ctx = get_variety_context()
        assert ctx["total_posts"] == 0
        assert ctx["recent_topics"] == []
        assert ctx["avoid_instruction"] == ""

    def test_with_recent_posts(self, clean_memory):
        record_post("tarot", "educational")
        record_post("astrologie", "tip")
        ctx = get_variety_context()
        assert "tarot" in ctx["recent_topics"]
        assert "astrologie" in ctx["recent_topics"]
        assert ctx["total_posts"] == 2

    def test_promoted_blog_slugs(self, clean_memory):
        record_post("blog", "blog_promo", blog_slug="tarot-zaklady")
        slugs = get_promoted_blog_slugs()
        assert "tarot-zaklady" in slugs
