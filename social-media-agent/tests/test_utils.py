"""
Testy pro utils.py — slugify a sdílené utility.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
from utils import slugify


class TestSlugify:
    """Testy převodu českého textu na slug"""

    def test_basic(self):
        assert slugify("tarot") == "tarot"

    def test_czech_diacritics(self):
        assert slugify("čeština") == "cestina"
        assert slugify("příšerně žluťoučký") == "priserne_zlutoucky"

    def test_all_czech_chars(self):
        """Všechny české znaky s diakritikou"""
        result = slugify("áčďéěíňóřšťúůýž")
        assert result == "acdeeinorstuuyz"

    def test_spaces_to_underscores(self):
        assert slugify("tarot výklad") == "tarot_vyklad"

    def test_special_chars_removed(self):
        assert slugify("energy & čakry!") == "energy_cakry"

    def test_multiple_underscores_collapsed(self):
        assert slugify("a   b   c") == "a_b_c"

    def test_leading_trailing_underscores_stripped(self):
        assert slugify("  tarot  ") == "tarot"

    def test_max_length_default(self):
        long = "a" * 50
        result = slugify(long)
        assert len(result) <= 30

    def test_max_length_custom(self):
        result = slugify("astrologie a numerologie", max_length=10)
        assert len(result) <= 10

    def test_uppercase_to_lowercase(self):
        assert slugify("TAROT") == "tarot"

    def test_empty_string(self):
        result = slugify("")
        assert result == ""

    def test_only_special_chars(self):
        result = slugify("!@#$%")
        assert result == ""
