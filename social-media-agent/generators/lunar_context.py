"""
Lunar & Astrological Context
Automaticky zjistí aktuální fázi Měsíce a astrologickou sezónu.
Žádné externí API — čistá matematika.
"""
import math
from datetime import date, datetime
from typing import Optional


# === FÁZE MĚSÍCE ===

def get_moon_phase(target_date: date = None) -> dict:
    """
    Vypočítá fázi Měsíce pro dané datum.
    Přesnost ±1 den.

    Returns:
        dict: phase_name, phase_cs, illumination_pct, emoji, energy_type, content_angle
    """
    if target_date is None:
        target_date = date.today()

    # Referenční nový Měsíc: 29. ledna 2025
    reference_new_moon = date(2025, 1, 29)
    lunar_cycle = 29.53058867  # dny

    days_since = (target_date - reference_new_moon).days
    cycle_position = (days_since % lunar_cycle) / lunar_cycle  # 0.0 - 1.0

    # Procento osvětlení (přibližné)
    illumination = (1 - math.cos(2 * math.pi * cycle_position)) / 2 * 100

    # Určení fáze
    if cycle_position < 0.0625:
        phase = "new_moon"
    elif cycle_position < 0.1875:
        phase = "waxing_crescent"
    elif cycle_position < 0.3125:
        phase = "first_quarter"
    elif cycle_position < 0.4375:
        phase = "waxing_gibbous"
    elif cycle_position < 0.5625:
        phase = "full_moon"
    elif cycle_position < 0.6875:
        phase = "waning_gibbous"
    elif cycle_position < 0.8125:
        phase = "last_quarter"
    elif cycle_position < 0.9375:
        phase = "waning_crescent"
    else:
        phase = "new_moon"

    PHASES = {
        "new_moon": {
            "phase_cs": "Nový Měsíc",
            "emoji": "🌑",
            "illumination_approx": int(illumination),
            "energy_type": "začátky, záměry, setí semen",
            "content_angle": "Čas nastavit nové záměry. Co chceš přivolat do svého života?",
            "ritual_tip": "Napište své záměry na papír při světle svíčky.",
            "spiritual_theme": "nové začátky, záměry, ticho, introspekce",
        },
        "waxing_crescent": {
            "phase_cs": "Dorůstající srpek",
            "emoji": "🌒",
            "illumination_approx": int(illumination),
            "energy_type": "akce, budování, pohyb vpřed",
            "content_angle": "Energie dorůstá — čas jednat na svých záměrech.",
            "ritual_tip": "Přidej jeden malý krok ke svému cíli každý den.",
            "spiritual_theme": "akce, víra, první kroky, odvaha",
        },
        "first_quarter": {
            "phase_cs": "První čtvrť",
            "emoji": "🌓",
            "illumination_approx": int(illumination),
            "energy_type": "překonávání překážek, rozhodování",
            "content_angle": "Energie výzvy — co ti brání a jak to překonat?",
            "ritual_tip": "Zapiš tři překážky a konkrétní kroky jak je překonat.",
            "spiritual_theme": "rozhodování, překonávání, vůle, činy",
        },
        "waxing_gibbous": {
            "phase_cs": "Dorůstající uzel",
            "emoji": "🌔",
            "illumination_approx": int(illumination),
            "energy_type": "zdokonalování, trpělivost, přizpůsobení",
            "content_angle": "Jsme téměř tam. Dolaď a přizpůsob svůj záměr.",
            "ritual_tip": "Přečti si své záměry z novu a uprav je podle nových informací.",
            "spiritual_theme": "trpělivost, zdokonalování, vděčnost, přizpůsobení",
        },
        "full_moon": {
            "phase_cs": "Úplněk",
            "emoji": "🌕",
            "illumination_approx": int(illumination),
            "energy_type": "vrchol, manifestace, odhalení, emoce",
            "content_angle": "Úplněk přináší vrchol energií a odhaluje pravdu.",
            "ritual_tip": "Dej své krystaly na balkon nebo okenní parapet, aby se nabily měsíčním světlem.",
            "spiritual_theme": "vyvrcholení, emoce, odhalení, plnost, manifestace",
        },
        "waning_gibbous": {
            "phase_cs": "Ubývající uzel",
            "emoji": "🌖",
            "illumination_approx": int(illumination),
            "energy_type": "vděčnost, sdílení, předávání",
            "content_angle": "Čas poděkovat a sdílet to co jsi dostal/a.",
            "ritual_tip": "Napiš 10 věcí za které jsi vděčný/á.",
            "spiritual_theme": "vděčnost, sdílení, moudrost, předávání",
        },
        "last_quarter": {
            "phase_cs": "Poslední čtvrť",
            "emoji": "🌗",
            "illumination_approx": int(illumination),
            "energy_type": "uvolňování, odpouštění, čištění",
            "content_angle": "Čas pustit co tě táhne dolů.",
            "ritual_tip": "Napiš co chceš pustit a papír bezpečně spal nebo roztrhej.",
            "spiritual_theme": "uvolnění, odpuštění, čištění, transformace",
        },
        "waning_crescent": {
            "phase_cs": "Ubývající srpek",
            "emoji": "🌘",
            "illumination_approx": int(illumination),
            "energy_type": "odpočinek, reflexe, příprava na nový cyklus",
            "content_angle": "Čas odpočinku a tiché reflexe před novým začátkem.",
            "ritual_tip": "Věnuj 10 minut tiché meditaci a zhodnoť uplynulý cyklus.",
            "spiritual_theme": "odpočinek, reflexe, příprava, ticho, moudrost",
        },
    }

    result = PHASES[phase].copy()
    result["phase_key"] = phase
    result["cycle_position"] = round(cycle_position, 3)
    return result


# === ASTROLOGICKÁ SEZÓNA ===

def get_sun_sign(target_date: date = None) -> dict:
    """
    Vrátí aktuální sluneční znamení a astrologický kontext.
    """
    if target_date is None:
        target_date = date.today()

    month = target_date.month
    day = target_date.day

    signs = [
        (3, 21, 4, 19, "Beran", "Aries", "♈", "průkopnictví, odvaha, energie, začátky", "🔥"),
        (4, 20, 5, 20, "Býk", "Taurus", "♉", "stabilita, smyslovost, trpělivost, příroda", "🌍"),
        (5, 21, 6, 20, "Blíženci", "Gemini", "♊", "komunikace, zvídavost, dualita, učení", "💨"),
        (6, 21, 7, 22, "Rak", "Cancer", "♋", "emoce, intuice, rodina, ochrana", "💧"),
        (7, 23, 8, 22, "Lev", "Leo", "♌", "tvořivost, vůdcovství, radost, sebeprojev", "🔥"),
        (8, 23, 9, 22, "Panna", "Virgo", "♍", "analytičnost, detail, zdraví, služba", "🌍"),
        (9, 23, 10, 22, "Váhy", "Libra", "♎", "rovnováha, krása, vztahy, spravedlnost", "💨"),
        (10, 23, 11, 21, "Štír", "Scorpio", "♏", "transformace, tajemství, hloubka, síla", "💧"),
        (11, 22, 12, 21, "Střelec", "Sagittarius", "♐", "filozofie, cestování, rozšiřování, pravda", "🔥"),
        (12, 22, 1, 19, "Kozoroh", "Capricorn", "♑", "disciplína, ambice, struktura, tradice", "🌍"),
        (1, 20, 2, 18, "Vodnář", "Aquarius", "♒", "inovace, humanitarismus, originalita, svoboda", "💨"),
        (2, 19, 3, 20, "Ryby", "Pisces", "♓", "intuice, empatie, spiritualita, sny", "💧"),
    ]

    for start_m, start_d, end_m, end_d, cs, en, symbol, themes, element in signs:
        if start_m <= end_m:  # Normal case
            if (month == start_m and day >= start_d) or (month == end_m and day <= end_d) or (start_m < month < end_m):
                return {
                    "sign_cs": cs, "sign_en": en, "symbol": symbol,
                    "themes": themes, "element": element,
                    "content_angle": f"Sluneční energie {cs} přináší: {themes}",
                }
        else:  # Kozoroh spanning year boundary (Dec 22 - Jan 19)
            if (month == start_m and day >= start_d) or (month == end_m and day <= end_d):
                return {
                    "sign_cs": cs, "sign_en": en, "symbol": symbol,
                    "themes": themes, "element": element,
                    "content_angle": f"Sluneční energie {cs} přináší: {themes}",
                }

    # Fallback (Ryby - konec)
    return {
        "sign_cs": "Ryby", "sign_en": "Pisces", "symbol": "♓",
        "themes": "intuice, empatie, spiritualita, sny", "element": "💧",
        "content_angle": "Sluneční energie Ryb přináší hlubokou intuici a snění",
    }


def get_full_astrological_context(target_date: date = None) -> dict:
    """
    Vrátí kompletní astrologický kontext pro daný den.
    Použij v promptech pro relevantní, časově zakotvené posty.
    """
    if target_date is None:
        target_date = date.today()

    moon = get_moon_phase(target_date)
    sun = get_sun_sign(target_date)

    # Denní číslo numerologie (den v měsíci)
    day_number = target_date.day
    month_number = target_date.month
    year_number = target_date.year

    # Osobní den (součet číslicí)
    def sum_digits(n: int) -> int:
        s = sum(int(d) for d in str(n))
        return sum_digits(s) if s > 9 and s not in [11, 22, 33] else s

    universal_day = sum_digits(day_number + month_number + sum(int(d) for d in str(year_number)))

    UNIVERSAL_DAY_MEANINGS = {
        1: "den nových začátků a iniciativy",
        2: "den citlivosti a partnerství",
        3: "den kreativity a radosti",
        4: "den struktury a práce",
        5: "den změn a dobrodružství",
        6: "den harmonie a péče",
        7: "den introspekce a moudrosti",
        8: "den síly a manifestace",
        9: "den dokončení a soucitu",
        11: "den intuice a duchovního poznání",
        22: "den velké vize a budování",
        33: "den lásky a učitelství",
    }

    return {
        "date": target_date.isoformat(),
        "date_cs": f"{target_date.day}. {target_date.month}. {target_date.year}",
        "moon": moon,
        "sun": sun,
        "universal_day": universal_day,
        "universal_day_meaning": UNIVERSAL_DAY_MEANINGS.get(universal_day, "den přechodu"),
        "content_brief": (
            f"Měsíc v {moon['phase_cs']} ({moon['emoji']}) — {moon['energy_type']}. "
            f"Slunce v {sun['sign_cs']} ({sun['symbol']}) — {sun['themes']}. "
            f"Universální den {universal_day}: {UNIVERSAL_DAY_MEANINGS.get(universal_day, 'den přechodu')}."
        ),
    }


if __name__ == "__main__":
    from rich.console import Console
    from rich.panel import Panel

    console = Console()
    ctx = get_full_astrological_context()

    console.print(Panel(
        f"📅 Datum: {ctx['date']}\n\n"
        f"{ctx['moon']['emoji']} Měsíc: {ctx['moon']['phase_cs']} — {ctx['moon']['energy_type']}\n"
        f"  Tip: {ctx['moon']['ritual_tip']}\n\n"
        f"{ctx['sun']['symbol']} Slunce: {ctx['sun']['sign_cs']} — {ctx['sun']['themes']}\n\n"
        f"🔢 Universální den {ctx['universal_day']}: {ctx['universal_day_meaning']}\n\n"
        f"[dim]{ctx['content_brief']}[/dim]",
        title="🔮 Dnešní Astrologický Kontext",
        border_style="purple"
    ))
