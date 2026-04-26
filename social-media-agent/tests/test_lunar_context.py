"""
Testy pro generators/lunar_context.py
- Fáze Měsíce
- Sluneční znamení
- Kompletní astrologický kontext
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
from datetime import date
from generators.lunar_context import get_moon_phase, get_sun_sign, get_full_astrological_context


class TestMoonPhase:
    """Testy výpočtu fáze Měsíce"""

    def test_returns_dict(self):
        result = get_moon_phase(date(2026, 3, 22))
        assert isinstance(result, dict)

    def test_required_keys(self):
        result = get_moon_phase(date(2026, 3, 22))
        required = ["phase_cs", "emoji", "energy_type", "content_angle",
                     "ritual_tip", "spiritual_theme", "phase_key", "cycle_position"]
        for key in required:
            assert key in result, f"Chybí klíč: {key}"

    def test_known_new_moon(self):
        """Referenční nový Měsíc 29.1.2025"""
        result = get_moon_phase(date(2025, 1, 29))
        assert result["phase_key"] == "new_moon"
        assert result["emoji"] == "🌑"

    def test_full_moon_approx(self):
        """Cca 14.5 dne po novém Měsíci = Úplněk"""
        result = get_moon_phase(date(2025, 2, 12))
        assert result["phase_key"] == "full_moon"
        assert result["emoji"] == "🌕"

    def test_cycle_position_range(self):
        result = get_moon_phase(date(2026, 6, 15))
        assert 0.0 <= result["cycle_position"] <= 1.0

    def test_illumination_exists(self):
        result = get_moon_phase(date(2026, 3, 22))
        assert "illumination_approx" in result
        assert 0 <= result["illumination_approx"] <= 100

    def test_default_date_is_today(self):
        """Bez argumentu použije dnešní datum"""
        result = get_moon_phase()
        assert isinstance(result, dict)
        assert "phase_cs" in result


class TestSunSign:
    """Testy slunečního znamení"""

    def test_returns_dict(self):
        result = get_sun_sign(date(2026, 3, 22))
        assert isinstance(result, dict)

    def test_required_keys(self):
        result = get_sun_sign(date(2026, 3, 22))
        for key in ["sign_cs", "sign_en", "symbol", "themes", "element", "content_angle"]:
            assert key in result, f"Chybí klíč: {key}"

    @pytest.mark.parametrize("dt,expected_cs,expected_en", [
        (date(2026, 1, 15), "Kozoroh", "Capricorn"),
        (date(2026, 1, 25), "Vodnář", "Aquarius"),
        (date(2026, 2, 20), "Ryby", "Pisces"),
        (date(2026, 3, 22), "Beran", "Aries"),
        (date(2026, 4, 25), "Býk", "Taurus"),
        (date(2026, 5, 25), "Blíženci", "Gemini"),
        (date(2026, 6, 25), "Rak", "Cancer"),
        (date(2026, 7, 25), "Lev", "Leo"),
        (date(2026, 8, 25), "Panna", "Virgo"),
        (date(2026, 9, 25), "Váhy", "Libra"),
        (date(2026, 10, 25), "Štír", "Scorpio"),
        (date(2026, 11, 25), "Střelec", "Sagittarius"),
        (date(2026, 12, 25), "Kozoroh", "Capricorn"),
    ])
    def test_sign_for_date(self, dt, expected_cs, expected_en):
        result = get_sun_sign(dt)
        assert result["sign_cs"] == expected_cs
        assert result["sign_en"] == expected_en

    def test_kozoroh_year_boundary(self):
        """Kozoroh přechází přes Silvestr"""
        dec31 = get_sun_sign(date(2026, 12, 31))
        jan1 = get_sun_sign(date(2026, 1, 1))
        assert dec31["sign_cs"] == "Kozoroh"
        assert jan1["sign_cs"] == "Kozoroh"


class TestFullAstroContext:
    """Testy kompletního kontextu"""

    def test_returns_dict(self):
        result = get_full_astrological_context(date(2026, 3, 22))
        assert isinstance(result, dict)

    def test_has_moon_and_sun(self):
        result = get_full_astrological_context(date(2026, 3, 22))
        assert "moon" in result
        assert "sun" in result
        assert result["moon"]["emoji"] in "🌑🌒🌓🌔🌕🌖🌗🌘"
        assert result["sun"]["sign_cs"] == "Beran"

    def test_universal_day_number(self):
        result = get_full_astrological_context(date(2026, 3, 22))
        assert "universal_day" in result
        assert isinstance(result["universal_day"], int)
        assert result["universal_day"] in range(1, 34)

    def test_content_brief_is_string(self):
        result = get_full_astrological_context(date(2026, 3, 22))
        assert isinstance(result["content_brief"], str)
        assert len(result["content_brief"]) > 20

    def test_date_cs_format(self):
        result = get_full_astrological_context(date(2026, 3, 22))
        assert result["date_cs"] == "22. 3. 2026"
