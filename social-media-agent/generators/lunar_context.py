"""
Lunar & Astrological Context — Astrologicky přesná data pro každý den.
Kombinuje matematické výpočty (fáze + znamení Měsíce pomocí ephemeris)
s hardcoded astronomickými daty (ingresse, retrogradity, zatmění).

Přesnost:
  - Fáze Měsíce:  ±1 den
  - Znamení Měsíce: ±3-4 hodiny (může se lišit na hranicích znamení)
  - Retrogradity/ingresse: přesné astrologické daty dle ephemeris
"""
import math
from datetime import date, timedelta
from typing import Optional


# ══════════════════════════════════════════════════════════════
# FÁZE MĚSÍCE
# ══════════════════════════════════════════════════════════════

def get_moon_phase(target_date: date = None) -> dict:
    """
    Vypočítá fázi Měsíce pro dané datum.
    Přesnost ±1 den.
    """
    if target_date is None:
        target_date = date.today()

    reference_new_moon = date(2025, 1, 29)
    lunar_cycle = 29.53058867

    days_since = (target_date - reference_new_moon).days
    cycle_position = (days_since % lunar_cycle) / lunar_cycle
    illumination = (1 - math.cos(2 * math.pi * cycle_position)) / 2 * 100

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
            "phase_cs": "Nový Měsíc", "emoji": "🌑",
            "energy_type": "začátky, záměry, setí semen",
            "content_angle": "Čas nastavit nové záměry. Co chceš přivolat do svého života?",
            "ritual_tip": "Napiš své záměry na papír při světle svíčky.",
            "spiritual_theme": "nové začátky, záměry, ticho, introspekce",
        },
        "waxing_crescent": {
            "phase_cs": "Dorůstající srpek", "emoji": "🌒",
            "energy_type": "akce, budování, pohyb vpřed",
            "content_angle": "Energie dorůstá — čas jednat na svých záměrech.",
            "ritual_tip": "Přidej jeden malý krok ke svému cíli každý den.",
            "spiritual_theme": "akce, víra, první kroky, odvaha",
        },
        "first_quarter": {
            "phase_cs": "První čtvrť", "emoji": "🌓",
            "energy_type": "překonávání překážek, rozhodování",
            "content_angle": "Energie výzvy — co ti brání a jak to překonat?",
            "ritual_tip": "Zapiš tři překážky a konkrétní kroky jak je překonat.",
            "spiritual_theme": "rozhodování, překonávání, vůle, činy",
        },
        "waxing_gibbous": {
            "phase_cs": "Dorůstající uzel", "emoji": "🌔",
            "energy_type": "zdokonalování, trpělivost, přizpůsobení",
            "content_angle": "Jsme téměř tam. Dolaď a přizpůsob svůj záměr.",
            "ritual_tip": "Přečti si své záměry z novu a uprav je podle nových informací.",
            "spiritual_theme": "trpělivost, zdokonalování, vděčnost, přizpůsobení",
        },
        "full_moon": {
            "phase_cs": "Úplněk", "emoji": "🌕",
            "energy_type": "vrchol, manifestace, odhalení, emoce",
            "content_angle": "Úplněk přináší vrchol energií a odhaluje pravdu.",
            "ritual_tip": "Dej své krystaly na balkon nebo okenní parapet, aby se nabily měsíčním světlem.",
            "spiritual_theme": "vyvrcholení, emoce, odhalení, plnost, manifestace",
        },
        "waning_gibbous": {
            "phase_cs": "Ubývající uzel", "emoji": "🌖",
            "energy_type": "vděčnost, sdílení, předávání",
            "content_angle": "Čas poděkovat a sdílet to co jsi dostal/a.",
            "ritual_tip": "Napiš 10 věcí za které jsi vděčný/á.",
            "spiritual_theme": "vděčnost, sdílení, moudrost, předávání",
        },
        "last_quarter": {
            "phase_cs": "Poslední čtvrť", "emoji": "🌗",
            "energy_type": "uvolňování, odpouštění, čištění",
            "content_angle": "Čas pustit co tě táhne dolů.",
            "ritual_tip": "Napiš co chceš pustit a papír bezpečně spal nebo roztrhej.",
            "spiritual_theme": "uvolnění, odpuštění, čištění, transformace",
        },
        "waning_crescent": {
            "phase_cs": "Ubývající srpek", "emoji": "🌘",
            "energy_type": "odpočinek, reflexe, příprava na nový cyklus",
            "content_angle": "Čas odpočinku a tiché reflexe před novým začátkem.",
            "ritual_tip": "Věnuj 10 minut tiché meditaci a zhodnoť uplynulý cyklus.",
            "spiritual_theme": "odpočinek, reflexe, příprava, ticho, moudrost",
        },
    }

    result = PHASES[phase].copy()
    result["phase_key"] = phase
    result["illumination_approx"] = int(illumination)
    result["cycle_position"] = round(cycle_position, 3)
    return result


# ══════════════════════════════════════════════════════════════
# ZNAMENÍ MĚSÍCE (nové — ecliptic longitude + equation of center)
# ══════════════════════════════════════════════════════════════

def get_moon_sign(target_date: date = None) -> dict:
    """
    Vypočítá ve kterém znamení zvěrokruhu se Měsíc nachází.
    Měsíc mění znamení každých ~2.3 dne.

    Metoda: Střední délka Měsíce (J2000.0) + rovnice středu (korekce excentricity).
    Přesnost: ±3-4 hodiny — dostatečné pro denní obsah, na hranicích znamení
    může být posun o 1 znamení.
    """
    if target_date is None:
        target_date = date.today()

    # Počet dní od J2000.0 (1. ledna 2000, 12:00 UTC)
    j2000 = date(2000, 1, 1)
    T = (target_date - j2000).days - 0.5

    # Střední délka Měsíce (tropická) dle IAU
    mean_longitude = (218.3165 + 13.176396 * T) % 360

    # Střední anomálie Měsíce (pro korekci excentricity)
    mean_anomaly_deg = (134.963 + 13.064993 * T) % 360
    M = math.radians(mean_anomaly_deg)

    # Rovnice středu — hlavní člen (6.289°) + korekce (1.274°)
    equation_of_center = 6.289 * math.sin(M) - 1.274 * math.sin(2 * M)

    true_longitude = (mean_longitude + equation_of_center) % 360
    sign_index = int(true_longitude // 30)
    degree_in_sign = true_longitude % 30

    SIGNS = [
        {
            "cs": "Beran", "en": "Aries", "symbol": "♈", "element": "oheň",
            "energy": "průkopnická, impulzivní, odvážná",
            "themes": "nové začátky, přímá akce, odvaha, rychlost, já",
            "content_hook": "Měsíc v Beranu zapaluje odvahu jednat. Dnes energie přeje prvním krokům a odvážným rozhodnutím.",
            "shadow": "impulzivita, netrpělivost, egocentrimus",
        },
        {
            "cs": "Býk", "en": "Taurus", "symbol": "♉", "element": "země",
            "energy": "uzemněná, smyslová, trpělivá",
            "themes": "stabilita, smyslové vnímání, příroda, tělo, hojnost, trpělivost",
            "content_hook": "Měsíc v Býku volá po uzemění a péči o tělo. Den pro pomalé, vědomé prožívání.",
            "shadow": "tvrdohlavost, materialismus, odpor ke změně",
        },
        {
            "cs": "Blíženci", "en": "Gemini", "symbol": "♊", "element": "vzduch",
            "energy": "zvídavá, komunikativní, adaptabilní",
            "themes": "komunikace, sdílení informací, zvídavost, dualita, propojování",
            "content_hook": "Měsíc v Blížencích přeje sdílení příběhů a výměně myšlenek. Skvělý den pro vzdělávací obsah.",
            "shadow": "povrchnost, roztříštěnost, dvojakost",
        },
        {
            "cs": "Rak", "en": "Cancer", "symbol": "♋", "element": "voda",
            "energy": "intuitivní, pečující, emotivní",
            "themes": "emoce, intuice, rodina, domov, bezpečí, paměť, péče",
            "content_hook": "Měsíc v Raku prohlubuje intuici a emocionální vnímání. Den pro introspekci a péči o sebe.",
            "shadow": "přecitlivělost, závislost, uzavírání se",
        },
        {
            "cs": "Lev", "en": "Leo", "symbol": "♌", "element": "oheň",
            "energy": "tvořivá, vůdčí, velkorysá",
            "themes": "sebevyjádření, tvořivost, radost, vůdcovství, srdce, hra",
            "content_hook": "Měsíc ve Lvu — čas zazářit a vyjádřit své pravé já. Energie pro tvořivé a odvážné posty.",
            "shadow": "arogance, dramatičnost, touha po uznání",
        },
        {
            "cs": "Panna", "en": "Virgo", "symbol": "♍", "element": "země",
            "energy": "analytická, detailní, služebnická",
            "themes": "detail, zdraví, rutina, zdokonalování, analytičnost, čistota",
            "content_hook": "Měsíc v Panně přináší jasnost mysli a touhu po řádu. Den pro praktické tipy a detaily.",
            "shadow": "perfekcionismus, kritičnost, sebekritika",
        },
        {
            "cs": "Váhy", "en": "Libra", "symbol": "♎", "element": "vzduch",
            "energy": "harmonická, diplomatická, estetická",
            "themes": "rovnováha, vztahy, krása, spravedlnost, harmonie, partnerství",
            "content_hook": "Měsíc ve Váhách — den pro hledání rovnováhy a harmonie. Ideální pro obsah o vztazích.",
            "shadow": "nerozhodnost, závislost na souhlasu, vyhýbání se konfliktu",
        },
        {
            "cs": "Štír", "en": "Scorpio", "symbol": "♏", "element": "voda",
            "energy": "intenzivní, transformativní, intuitivní",
            "themes": "transformace, skrytá pravda, hloubka, shadow work, síla, tajemství",
            "content_hook": "Měsíc ve Štíru ponoří do hlubin. Silný den pro shadow work, transformaci a hlubokou pravdu.",
            "shadow": "žárlivost, manipulace, obsesivnost",
        },
        {
            "cs": "Střelec", "en": "Sagittarius", "symbol": "♐", "element": "oheň",
            "energy": "optimistická, dobrodružná, filozofická",
            "themes": "filozofie, moudrost, smysl, cestování, pravda, rozšiřování obzorů",
            "content_hook": "Měsíc ve Střelci rozšiřuje obzory. Den pro filozofické otázky a hledání smyslu.",
            "shadow": "nerozvážnost, přehnaný optimismus, nedotaženost",
        },
        {
            "cs": "Kozoroh", "en": "Capricorn", "symbol": "♑", "element": "země",
            "energy": "disciplinovaná, ambiciózní, strukturovaná",
            "themes": "disciplína, ambice, struktura, budování, kariéra, zodpovědnost, tradice",
            "content_hook": "Měsíc v Kozorohu přináší energii disciplíny a dlouhodobého budování. Čas na konkrétní kroky.",
            "shadow": "chladnost, rigidita, workoholismus",
        },
        {
            "cs": "Vodnář", "en": "Aquarius", "symbol": "♒", "element": "vzduch",
            "energy": "originální, humanistická, kolektivní",
            "themes": "inovace, kolektiv, svoboda, originalita, revoluce, humanismus",
            "content_hook": "Měsíc ve Vodnáři — energie kolektivního vědomí a inovací. Den pro neobvyklé úhly pohledu.",
            "shadow": "odtažitost, rebelství pro rebely, emoční distancování",
        },
        {
            "cs": "Ryby", "en": "Pisces", "symbol": "♓", "element": "voda",
            "energy": "intuitivní, empatická, snivá",
            "themes": "spiritualita, intuice, sny, empatie, soucit, rozpuštění hranic",
            "content_hook": "Měsíc v Rybách prohlubuje spirituální vnímání a empatii. Den pro snivé a poetické posty.",
            "shadow": "únik z reality, sebeobětování, zmatení hranic",
        },
    ]

    sign = SIGNS[sign_index].copy()
    sign["degree"] = round(degree_in_sign, 1)
    sign["longitude"] = round(true_longitude, 1)
    return sign


# ══════════════════════════════════════════════════════════════
# SLUNEČNÍ ZNAMENÍ
# ══════════════════════════════════════════════════════════════

def get_sun_sign(target_date: date = None) -> dict:
    """Vrátí aktuální sluneční znamení a astrologický kontext."""
    if target_date is None:
        target_date = date.today()

    month, day = target_date.month, target_date.day

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
        if start_m <= end_m:
            if (month == start_m and day >= start_d) or (month == end_m and day <= end_d) or (start_m < month < end_m):
                return {"sign_cs": cs, "sign_en": en, "symbol": symbol, "themes": themes, "element": element,
                        "content_angle": f"Sluneční energie {cs} přináší: {themes}"}
        else:  # Kozoroh přes přelom roku
            if (month == start_m and day >= start_d) or (month == end_m and day <= end_d):
                return {"sign_cs": cs, "sign_en": en, "symbol": symbol, "themes": themes, "element": element,
                        "content_angle": f"Sluneční energie {cs} přináší: {themes}"}

    return {"sign_cs": "Ryby", "sign_en": "Pisces", "symbol": "♓",
            "themes": "intuice, empatie, spiritualita, sny", "element": "💧",
            "content_angle": "Sluneční energie Ryb přináší hlubokou intuici a snění"}


# ══════════════════════════════════════════════════════════════
# PLANETÁRNÍ VLÁDCE DNE (Chaldejský řád)
# ══════════════════════════════════════════════════════════════

def get_planetary_day(target_date: date = None) -> dict:
    """
    Vrátí planetu vládnoucí danému dni dle Chaldejského řádu.
    Po=Měsíc, Út=Mars, St=Merkur, Čt=Jupiter, Pá=Venuše, So=Saturn, Ne=Slunce.
    """
    if target_date is None:
        target_date = date.today()

    RULERS = [
        # weekday 0 = Pondělí
        {"planet": "Měsíc", "symbol": "☽", "day_cs": "Pondělí",
         "energy": "emoce, intuice, paměť, domov, ženský princip, sny",
         "content_angle": "Den Měsíce — ideální pro posty o intuici, emocích a ženské moudrosti."},
        {"planet": "Mars", "symbol": "♂", "day_cs": "Úterý",
         "energy": "akce, odvaha, energie, vůle, konflikt, průkopnictví",
         "content_angle": "Den Marsu — energie pro odvážné činy a překonávání překážek."},
        {"planet": "Merkur", "symbol": "☿", "day_cs": "Středa",
         "energy": "komunikace, myšlení, učení, informace, obchod",
         "content_angle": "Den Merkura — skvělý pro vzdělávací posty, tipy a sdílení znalostí."},
        {"planet": "Jupiter", "symbol": "♃", "day_cs": "Čtvrtek",
         "energy": "hojnost, moudrost, expanze, filozofie, štěstí, víra",
         "content_angle": "Den Jupitera — energie expanze a moudrosti. Sdílej znalosti velkoryse."},
        {"planet": "Venuše", "symbol": "♀", "day_cs": "Pátek",
         "energy": "láska, krása, vztahy, harmonie, hojnost, potěšení",
         "content_angle": "Den Venuše — ideální pro posty o lásce, vztazích a kráse."},
        {"planet": "Saturn", "symbol": "♄", "day_cs": "Sobota",
         "energy": "disciplína, karma, lekce, struktura, čas, trpělivost",
         "content_angle": "Den Saturnu — čas na reflexi, karmické lekce a disciplínu."},
        # weekday 6 = Neděle
        {"planet": "Slunce", "symbol": "☀", "day_cs": "Neděle",
         "energy": "vitalita, identita, sebeprojev, tvořivost, úspěch, radost",
         "content_angle": "Den Slunce — zářivá energie pro posty o identitě a sebevyjádření."},
    ]

    return RULERS[target_date.weekday()]


# ══════════════════════════════════════════════════════════════
# RETROGRADITY PLANET 2024–2027 (astronomicky přesné dle ephemeris)
# ══════════════════════════════════════════════════════════════

# Formát: (začátek, konec, znamení, popis pro obsah)
_RETROGRADES = {
    "Merkur": [
        (date(2024, 12, 13), date(2025, 1, 2),   "Střelec/Štír",  "revize přesvědčení a filozofie"),
        (date(2025, 3, 15),  date(2025, 4, 7),   "Beran/Ryby",    "revize identity a duchovní cesty"),
        (date(2025, 7, 18),  date(2025, 8, 11),  "Lev",           "revize sebevyjádření a tvořivosti"),
        (date(2025, 11, 9),  date(2025, 11, 29), "Střelec/Štír",  "revize přesvědčení a transformace"),
        (date(2026, 3, 2),   date(2026, 3, 26),  "Beran/Ryby",    "revize záměrů, identity a spirituality"),
        (date(2026, 6, 27),  date(2026, 7, 21),  "Rak/Blíženci",  "revize emocí a komunikace"),
        (date(2026, 10, 23), date(2026, 11, 12), "Štír/Váhy",     "revize hlubokých vztahů a transformace"),
    ],
    "Venuše": [
        (date(2025, 3, 1),   date(2025, 4, 12),  "Beran/Ryby",    "revize hodnot, lásky a identity"),
        (date(2026, 10, 3),  date(2026, 11, 13), "Štír",          "revize hlubokých vztahů a hodnot"),
    ],
    "Mars": [
        (date(2024, 12, 7),  date(2025, 2, 23),  "Lev/Rak",       "revize akce, touhy a odvahy"),
        (date(2027, 1, 12),  date(2027, 3, 21),  "Lev",           "revize vůle a sebevyjádření"),
    ],
    "Jupiter": [
        (date(2024, 10, 9),  date(2025, 2, 4),   "Blíženci",      "revize expanze v komunikaci a učení"),
        (date(2025, 11, 11), date(2026, 3, 11),  "Rak",           "revize expanze v emocích a rodině"),
        (date(2026, 11, 20), date(2027, 3, 14),  "Lev",           "revize expanze v sebevyjádření"),
    ],
    "Saturn": [
        (date(2025, 7, 13),  date(2025, 11, 28), "Beran/Ryby",    "revize disciplíny, hranic a karmy"),
        (date(2026, 7, 25),  date(2026, 12, 15), "Beran",         "revize karmických lekcí v odvaze"),
    ],
}


def get_retrograde_status(target_date: date = None) -> list[dict]:
    """
    Vrátí seznam aktuálně retrográdních planet pro dané datum.
    Prázdný seznam = žádná retrográdní planeta.
    """
    if target_date is None:
        target_date = date.today()

    active = []
    for planet, periods in _RETROGRADES.items():
        for start, end, sign, meaning in periods:
            if start <= target_date <= end:
                days_left = (end - target_date).days
                active.append({
                    "planet": planet,
                    "sign": sign,
                    "meaning": meaning,
                    "ends": end.isoformat(),
                    "days_left": days_left,
                    "content_note": (
                        f"{planet} retrográdní v {sign} — čas {meaning}. "
                        f"Vyhni se začínání nových projektů, preferuj revizi a reflexi. "
                        f"Zbývá {days_left} dní."
                    ),
                })
    return active


# ══════════════════════════════════════════════════════════════
# POLOHY POMALÝCH PLANET 2023–2027 (ingress dle ephemeris)
# ══════════════════════════════════════════════════════════════

# Každý záznam: (start, end, planeta, symbol, znamení, témata pro obsah)
_SLOW_PLANET_POSITIONS = [
    # ── JUPITER ──────────────────────────────────────────────
    (date(2024, 5, 25), date(2025, 6, 9),
     "Jupiter", "♃", "Blíženci",
     "expanze komunikace, učení, sdílení informací a blízkých vztahů — ideální pro vzdělávací obsah"),
    (date(2025, 6, 9), date(2026, 6, 30),
     "Jupiter", "♃", "Rak",
     "expanze emocionální inteligence, péče, rodiny a domova — příznivé pro osobní rozvoj a healing"),
    (date(2026, 6, 30), date(2027, 7, 26),
     "Jupiter", "♃", "Lev",
     "expanze tvořivosti, sebevyjádření, radosti a vůdcovství — energie pro velké projekty"),
    # ── SATURN ───────────────────────────────────────────────
    (date(2023, 3, 7), date(2025, 5, 24),
     "Saturn", "♄", "Ryby",
     "karmické lekce v spiritualitě, víře, sebeobětování a intuici — čas zpracovat duchovní vzorce"),
    (date(2025, 5, 24), date(2025, 9, 1),
     "Saturn", "♄", "Beran",
     "karmické lekce v odvaze, sebedisciplíně a vlastní identitě — čas převzít zodpovědnost za sebe"),
    (date(2025, 9, 1), date(2026, 2, 14),
     "Saturn", "♄", "Ryby",  # retrográd zpět
     "druhá vlna karmických lekcí v spiritualitě a víře — hlubší integrace duchovních vzorců"),
    (date(2026, 2, 14), date(2028, 4, 13),
     "Saturn", "♄", "Beran",
     "karmické lekce v odvaze, iniciativě a vlastní identitě — čas budovat z pevného základu sebe sama"),
    # ── NEPTUN ───────────────────────────────────────────────
    (date(2012, 2, 3), date(2025, 3, 30),
     "Neptun", "♆", "Ryby",
     "kolektivní spiritualita, iluze, empatie a splynutí hranic — generační téma duchovního probouzení"),
    (date(2025, 3, 30), date(2039, 3, 1),
     "Neptun", "♆", "Beran",
     "spirituální průkopnictví, nové duchovní vize a odvaha hledat vyšší pravdu — generační přechod"),
    # ── PLUTO ────────────────────────────────────────────────
    (date(2024, 1, 20), date(2044, 1, 1),
     "Pluto", "♇", "Vodnář",
     "transformace kolektivního vědomí, technologie a humanismu — čas osvobozující evoluce společnosti"),
    # ── URAN ─────────────────────────────────────────────────
    (date(2018, 5, 15), date(2026, 7, 7),
     "Uran", "⛢", "Býk",
     "revoluce v hodnotách, financích, přírodě a vztahu k tělu — čas přehodnotit co skutečně cenišme"),
    (date(2026, 7, 7), date(2033, 8, 1),
     "Uran", "⛢", "Blíženci",
     "revoluce v komunikaci, technologii a vzdělání — čas nových způsobů myšlení a sdílení"),
]


def get_slow_planets(target_date: date = None) -> list[dict]:
    """
    Vrátí aktuální polohy pomalých planet (Jupiter, Saturn, Neptun, Pluto, Uran).
    """
    if target_date is None:
        target_date = date.today()

    result = []
    seen = set()
    for start, end, planet, symbol, sign, themes in _SLOW_PLANET_POSITIONS:
        if start <= target_date <= end and planet not in seen:
            seen.add(planet)
            result.append({
                "planet": planet,
                "symbol": symbol,
                "sign": sign,
                "themes": themes,
            })
    return result


# ══════════════════════════════════════════════════════════════
# ZATMĚNÍ 2025–2027 (solární + lunární, dle NASA)
# ══════════════════════════════════════════════════════════════

_ECLIPSES = [
    (date(2025, 3, 29),  "Solární", "Beran",   "nové začátky, odvaha, průkopnictví, identita"),
    (date(2025, 9, 7),   "Lunární", "Ryby",    "ukončení karmických cyklů, spirituální uzavření"),
    (date(2025, 9, 21),  "Solární", "Panna",   "nové zdravotní a pracovní cykly, čistota záměru"),
    (date(2026, 2, 17),  "Solární", "Ryby",    "nové spirituální cykly, intuice, konec iluzí"),
    (date(2026, 3, 3),   "Lunární", "Panna",   "uzavření témat zdraví, rutiny a zdokonalování"),
    (date(2026, 8, 12),  "Solární", "Lev",     "nové cykly sebevyjádření a tvořivosti"),
    (date(2026, 8, 28),  "Lunární", "Ryby",    "hluboké emocionální uzavření, spirituální integrace"),
    (date(2027, 2, 6),   "Solární", "Vodnář",  "nové kolektivní cykly a společenské změny"),
    (date(2027, 7, 13),  "Solární", "Rak",     "nové emocionální a rodinné cykly"),
    (date(2027, 8, 28),  "Lunární", "Vodnář",  "uzavření témat kolektivity a svobody"),
]


def get_eclipse_context(target_date: date = None) -> Optional[dict]:
    """
    Vrátí kontext zatmění pokud jsme v orbisu ±14 dní od zatmění.
    Zatmění mají vliv 2 týdny před i po.
    """
    if target_date is None:
        target_date = date.today()

    for eclipse_date, eclipse_type, sign, themes in _ECLIPSES:
        delta = abs((target_date - eclipse_date).days)
        if delta <= 14:
            direction = "nadcházejícím" if target_date <= eclipse_date else "nedávném"
            days_delta = (eclipse_date - target_date).days
            timing = f"za {days_delta} dní" if days_delta > 0 else ("dnes" if days_delta == 0 else f"před {abs(days_delta)} dny")
            return {
                "type": eclipse_type,
                "sign": sign,
                "themes": themes,
                "date": eclipse_date.isoformat(),
                "timing": timing,
                "direction": direction,
                "content_note": (
                    f"ECLIPSE SEZONA: {eclipse_type} zatmění ve znamení {sign} ({timing}). "
                    f"Témata: {themes}. "
                    f"Zatmění otevírají portály změny — ideální pro obsah o uzlových bodech osudu, "
                    f"karmických uzavřeních a nových začátcích."
                ),
            }
    return None


# ══════════════════════════════════════════════════════════════
# NUMEROLOGICKÝ DEN
# ══════════════════════════════════════════════════════════════

def get_universal_day(target_date: date = None) -> dict:
    """Universální den — numerologický součet datumu."""
    if target_date is None:
        target_date = date.today()

    def reduce(n: int) -> int:
        s = sum(int(d) for d in str(n))
        return reduce(s) if s > 9 and s not in [11, 22, 33] else s

    total = target_date.day + target_date.month + sum(int(d) for d in str(target_date.year))
    day_num = reduce(total)

    MEANINGS = {
        1: ("nových začátků a iniciativy", "Sám si pilotem svého osudu. Čas jednat, ne čekat."),
        2: ("citlivosti a partnerství", "Den pro spolupráci, naslouchání a jemnou diplomacii."),
        3: ("kreativity a radosti", "Energie hravosti a sebevyjádření — skvělý den pro tvořivé posty."),
        4: ("struktury a práce", "Den pro budování pevných základů a zodpovědnou akci."),
        5: ("změn a dobrodružství", "Energie pohybu a svobody — den pro neočekávané a nové perspektivy."),
        6: ("harmonie a péče", "Den pro péči o sebe i druhé, domov a krásu ve vztazích."),
        7: ("introspekce a moudrosti", "Den ticha a hloubky — skvělý pro spirituální a filozofické posty."),
        8: ("síly a manifestace", "Energie hojnosti a moci — den pro posty o záměrech a přitažlivosti."),
        9: ("dokončení a soucitu", "Den uzavírání cyklů a laskavosti — čas pro hlubokou reflexi."),
        11: ("intuice a duchovního poznání", "Mistrovský den — bránou je intuice a duchovní probuzení."),
        22: ("velké vize a budování", "Mistrovský den stavitele — čas na velké, odvážné záměry."),
        33: ("lásky a učitelství", "Mistrovský den — energie bezpodmínečné lásky a moudrého vedení."),
    }

    meaning, hook = MEANINGS.get(day_num, ("přechodu", "Den tiché transformace."))
    return {"number": day_num, "meaning": meaning, "hook": hook}


# ══════════════════════════════════════════════════════════════
# DUCHOVNO-SEZÓNNÍ KALENDÁŘ
# ══════════════════════════════════════════════════════════════

# Sabbaty (Kolo roku) + české mystické svátky + portálové dny
_SPIRITUAL_CALENDAR = [
    # Sabbaty — Kolo roku (Wheel of the Year)
    {"date": "02-01", "name": "Imbolc",          "type": "sabbat",  "window": 5, "themes": "probouzení, očista, nové záměry, Brigid", "content_angle": "Rituál očisty a nastavení záměrů. Zapal bílou svíčku a zapiš 3 přání."},
    {"date": "03-20", "name": "Ostara (jarní rovnodennost)", "type": "sabbat", "window": 5, "themes": "rovnováha světla a tmy, nový začátek, plodnost, probuzení", "content_angle": "Den rovnováhy — ideální pro rituál balancování životních oblastí."},
    {"date": "04-30", "name": "Beltane / Čarodějnice", "type": "sabbat_cz", "window": 7, "themes": "oheň, vášeň, plodnost, ochrana, pálení starého", "content_angle": "Noc, kdy se tenčí hranice světů. Rituál pálení starých vzorců. České tradice + keltské kořeny."},
    {"date": "06-21", "name": "Litha (letní slunovrat)", "type": "sabbat", "window": 5, "themes": "vrchol světla, síla, hojnost, oslava, sluneční energie", "content_angle": "Nejdelší den roku — nabij si krystaly, medituj při východu slunce."},
    {"date": "08-01", "name": "Lughnasadh / Lammas", "type": "sabbat", "window": 5, "themes": "první sklizeň, vděčnost, sdílení plodů práce", "content_angle": "Čas sklízet plody své práce. Rituál vděčnosti za to, co letos přineslo ovoce."},
    {"date": "09-22", "name": "Mabon (podzimní rovnodennost)", "type": "sabbat", "window": 5, "themes": "rovnováha, vděčnost, sklizeň, příprava na tmu", "content_angle": "Druhá rovnováha roku — bilancuj, co jsi získal/a a co pustit."},
    {"date": "10-31", "name": "Samhain / Dušičky", "type": "sabbat_cz", "window": 7, "themes": "tenká hranice mezi světy, předci, stíny, smrt a znovuzrození, věštění", "content_angle": "Nejtenčí závoj mezi světy. Rituál spojení s předky. Ideální noc pro tarot."},
    {"date": "12-21", "name": "Yule (zimní slunovrat)", "type": "sabbat", "window": 7, "themes": "návrat světla, naděje, obnova, zimní klid, meditace", "content_angle": "Nejdelší noc — ale zítra je světla víc. Rituál svíček, záměry pro nový cyklus."},

    # České mystické svátky
    {"date": "11-02", "name": "Dušičky",          "type": "czech",   "window": 5, "themes": "vzpomínky na zemřelé, předci, karmické vazby, reflexe", "content_angle": "Tradiční den spojení s předky. Zapal svíčku a poděkuj těm, kdo tě formovali."},
    {"date": "12-24", "name": "Štědrý den",       "type": "czech",   "window": 5, "themes": "tradice, lití olova, krájení jablka, věštění budoucnosti", "content_angle": "České vánoční věštby — olovo, jablko, ořechy. Mystika ukrytá v tradicích."},
    {"date": "04-20", "name": "Velikonoce (Bílá sobota)", "type": "czech", "window": 5, "themes": "znovuzrození, jaro, očista, nový cyklus", "content_angle": "Symbolika znovuzrození — ideální pro rituál nového začátku."},

    # Portálové / numerologické dny
    {"date": "01-01", "name": "Portál 1:1",       "type": "portal",  "window": 1, "themes": "nový začátek, manifestace, záměry", "content_angle": "Portálový den 1:1 — energie nových začátků. Zapiš si svůj záměr pro rok."},
    {"date": "02-02", "name": "Portál 2:2",       "type": "portal",  "window": 1, "themes": "partnerství, rovnováha, dualita, vztahy", "content_angle": "Portál 2:2 — den vztahů a rovnováhy. Co tvůj nejdůležitější vztah potřebuje?"},
    {"date": "03-03", "name": "Portál 3:3",       "type": "portal",  "window": 1, "themes": "kreativita, komunikace, trojice, sebevyjádření", "content_angle": "Portálový den 3:3 — energie kreativity a komunikace."},
    {"date": "04-04", "name": "Portál 4:4",       "type": "portal",  "window": 1, "themes": "stabilita, základy, andělé, ochrana", "content_angle": "4:4 — andělské číslo stability. Postav dnes pevné základy."},
    {"date": "05-05", "name": "Portál 5:5",       "type": "portal",  "window": 1, "themes": "změna, svoboda, dobrodružství, transformace", "content_angle": "5:5 — den velkých změn. Co v životě volá po transformaci?"},
    {"date": "06-06", "name": "Portál 6:6",       "type": "portal",  "window": 1, "themes": "harmonie, domov, rodina, léčení", "content_angle": "6:6 — energie domova a léčení. Očisti svůj prostor."},
    {"date": "07-07", "name": "Portál 7:7",       "type": "portal",  "window": 1, "themes": "spiritualita, introspekce, mystika, probuzení", "content_angle": "7:7 — nejmystičtější portál roku. Den pro meditaci a hlubokou introspekci."},
    {"date": "08-08", "name": "Portál Lví brány",  "type": "portal",  "window": 3, "themes": "Lví brána, Sirius, manifestace, hojnost, kosmická energie", "content_angle": "Lví brána 8:8 — nejsilnější manifestační portál roku. Hvězda Sirius se zarovnává se Zemí."},
    {"date": "09-09", "name": "Portál 9:9",       "type": "portal",  "window": 1, "themes": "uzavření cyklů, odpuštění, karma, moudrost", "content_angle": "9:9 — den uzavírání cyklů. Co je čas pustit?"},
    {"date": "10-10", "name": "Portál 10:10",     "type": "portal",  "window": 1, "themes": "nový cyklus, důvěra vesmíru, synchronicita", "content_angle": "10:10 — vesmír ti posílá potvrzení. Všímej si znamení."},
    {"date": "11-11", "name": "Portál 11:11",     "type": "portal",  "window": 3, "themes": "probuzení, andělská čísla, manifestace, duchovní aktivace", "content_angle": "11:11 — nejznámější andělský portál. Tvé myšlenky se manifestují rychleji než jindy."},
    {"date": "12-12", "name": "Portál 12:12",     "type": "portal",  "window": 1, "themes": "dokončení, duchovní růst, vyšší vědomí", "content_angle": "12:12 — poslední velký portál roku. Shrň svůj duchovní růst."},

    # Pojmenované úplňky (přibližná data pro 2026 — aktualizovat ročně)
    {"date": "01-13", "name": "Vlčí úplněk",       "type": "full_moon", "window": 2, "themes": "instinkty, přežití, vnitřní síla, samota", "content_angle": "Vlčí měsíc — poslechni své instinkty. Co ti říká tvé vnitřní zvíře?"},
    {"date": "02-12", "name": "Sněžný úplněk",     "type": "full_moon", "window": 2, "themes": "klid, trpělivost, vnitřní práce, očista", "content_angle": "Sněžný měsíc — ticho pod sněhem ukrývá semena jara. Čas pro vnitřní práci."},
    {"date": "03-14", "name": "Červí úplněk",       "type": "full_moon", "window": 2, "themes": "probouzení, jaro, nové životy, plodnost", "content_angle": "Červí měsíc — země se probouzí. Co v tobě klíčí?"},
    {"date": "04-12", "name": "Růžový úplněk",      "type": "full_moon", "window": 2, "themes": "láska, krása, otevření srdce, romantika", "content_angle": "Růžový měsíc — otevři srdeční čakru. Rituál sebelásky."},
    {"date": "05-12", "name": "Květinový úplněk",    "type": "full_moon", "window": 2, "themes": "rozkvět, hojnost, plná síla, tvořivost", "content_angle": "Květinový měsíc — vše kvete. Tvá energie je na vrcholu."},
    {"date": "06-11", "name": "Jahodový úplněk",     "type": "full_moon", "window": 2, "themes": "sklizeň, sladkost života, vděčnost", "content_angle": "Jahodový měsíc — užij si sladkost okamžiku."},
    {"date": "07-10", "name": "Jelení úplněk",       "type": "full_moon", "window": 2, "themes": "růst, parohy jako koruna, duchovní autorita", "content_angle": "Jelení měsíc — období růstu. Jaký další krok tě volá?"},
    {"date": "08-09", "name": "Jeseterový úplněk",   "type": "full_moon", "window": 2, "themes": "hojnost, sklizeň, moudrost vody", "content_angle": "Jeseterový měsíc — hluboké vody moudrosti. Potop se dovnitř."},
    {"date": "09-07", "name": "Kukuřičný úplněk",    "type": "full_moon", "window": 2, "themes": "sklizeň, vděčnost, příprava na zimu", "content_angle": "Kukuřičný měsíc — bilancuj letošní úrodu. Co přineslo plody?"},
    {"date": "10-07", "name": "Lovecký úplněk",      "type": "full_moon", "window": 2, "themes": "zaměření, cíl, příprava, síla", "content_angle": "Lovecký měsíc — zaostři na svůj cíl. Žádné rozptylování."},
    {"date": "11-05", "name": "Bobří úplněk",        "type": "full_moon", "window": 2, "themes": "příprava, stavění, zásoby, domov", "content_angle": "Bobří měsíc — buduj pevné základy pro zimu."},
    {"date": "12-04", "name": "Studený úplněk",      "type": "full_moon", "window": 2, "themes": "stažení dovnitř, reflexe, meditace, ticho", "content_angle": "Studený měsíc — nejkratší dny volají po nejhlubší introspekci."},
]


def get_spiritual_calendar(target_date: date = None) -> list[dict]:
    """
    Vrátí duchovno-sezónní události relevantní pro daný den.
    Hledá v okně ±window dní (sabbaty mají větší okno).

    Returns:
        list[dict]: seznam událostí [{name, type, themes, content_angle, days_until}]
    """
    if target_date is None:
        target_date = date.today()

    year = target_date.year
    results = []

    for event in _SPIRITUAL_CALENDAR:
        # Parsuj datum události (MM-DD) → konkrétní den v aktuálním roce
        month, day = map(int, event["date"].split("-"))
        try:
            event_date = date(year, month, day)
        except ValueError:
            continue  # přestupný rok edge case

        # Vzdálenost ve dnech (může být záporná = už proběhlo)
        delta = (event_date - target_date).days

        # Window = kolik dní před a po je událost relevantní pro obsah
        window = event.get("window", 3)

        if -2 <= delta <= window:  # 2 dny po + window dní před
            timing = "dnes!" if delta == 0 else (
                f"za {delta} {'den' if delta == 1 else 'dny' if 2 <= delta <= 4 else 'dní'}" if delta > 0
                else f"před {abs(delta)} {'dnem' if abs(delta) == 1 else 'dny'}"
            )

            results.append({
                "name": event["name"],
                "type": event["type"],
                "themes": event["themes"],
                "content_angle": event["content_angle"],
                "days_until": delta,
                "timing": timing,
            })

    return results


# ══════════════════════════════════════════════════════════════
# KOMPLETNÍ ASTROLOGICKÝ KONTEXT
# ══════════════════════════════════════════════════════════════

def get_full_astrological_context(target_date: date = None) -> dict:
    """
    Vrátí kompletní astrologický kontext pro daný den.
    Zahrnuje: fázi + znamení Měsíce, sluneční znamení, planetárního vládce dne,
    retrogradity, polohy pomalých planet, eclipse sezónu a numerologii.
    """
    if target_date is None:
        target_date = date.today()

    moon_phase   = get_moon_phase(target_date)
    moon_sign    = get_moon_sign(target_date)
    sun          = get_sun_sign(target_date)
    planet_day   = get_planetary_day(target_date)
    retrogrades  = get_retrograde_status(target_date)
    slow_planets = get_slow_planets(target_date)
    eclipse      = get_eclipse_context(target_date)
    num_day      = get_universal_day(target_date)
    spiritual    = get_spiritual_calendar(target_date)

    # ── Retrográdní planety — stručný přehled ──
    retro_str = ""
    if retrogrades:
        retro_list = ", ".join(
            f"{r['planet']} Rx v {r['sign']}" for r in retrogrades
        )
        retro_str = f"Retrográdní: {retro_list}. "

    # ── Pomalé planety — jen klíčové (Jupiter + Saturn) pro content brief ──
    key_planets = [p for p in slow_planets if p["planet"] in ("Jupiter", "Saturn")]
    planets_str = "  ".join(
        f"{p['symbol']} {p['planet']} v {p['sign']}" for p in key_planets
    )

    # ── Eclipse ──
    eclipse_str = ""
    if eclipse:
        eclipse_str = f"  ECLIPSE SEZONA: {eclipse['type']} zatmění v {eclipse['sign']} ({eclipse['timing']})."

    # ── Duchovno-sezónní kalendář ──
    spiritual_str = ""
    if spiritual:
        parts = [f"  {s['name']} ({s['timing']}) — {s['content_angle']}" for s in spiritual]
        spiritual_str = "\n  DUCHOVNO-SEZÓNNÍ: " + "; ".join(
            f"{s['name']} ({s['timing']})" for s in spiritual
        )

    # ── Kompletní content brief pro AI generátor ──
    content_brief = (
        f"Měsíc v {moon_phase['phase_cs']} {moon_phase['emoji']} ve znamení {moon_sign['cs']} {moon_sign['symbol']} "
        f"({moon_sign['element']}) — {moon_sign['themes']}. "
        f"Slunce v {sun['sign_cs']} {sun['symbol']} — {sun['themes']}. "
        f"Vládce dne: {planet_day['planet']} {planet_day['symbol']} ({planet_day['day_cs']}) — {planet_day['energy']}. "
        f"{retro_str}"
        f"{planets_str}.  "
        f"Universální den {num_day['number']}: {num_day['meaning']}."
        f"{eclipse_str}"
        f"{spiritual_str}"
    )

    return {
        "date": target_date.isoformat(),
        "date_cs": f"{target_date.day}. {target_date.month}. {target_date.year}",
        "moon": moon_phase,
        "moon_sign": moon_sign,
        "sun": sun,
        "planetary_day": planet_day,
        "retrogrades": retrogrades,
        "slow_planets": slow_planets,
        "eclipse": eclipse,
        "universal_day": num_day["number"],
        "universal_day_meaning": num_day["meaning"],
        "spiritual_events": spiritual,
        "content_brief": content_brief,
    }


# ══════════════════════════════════════════════════════════════
# STANDALONE TEST
# ══════════════════════════════════════════════════════════════

if __name__ == "__main__":
    from rich.console import Console
    from rich.panel import Panel
    from rich.table import Table
    import rich.box as box

    console = Console()
    ctx = get_full_astrological_context()

    retro_text = ""
    if ctx["retrogrades"]:
        retro_text = "\n" + "\n".join(
            f"  {r['planet']} Rx v {r['sign']} (do {r['ends']}, zbývá {r['days_left']} dní)"
            for r in ctx["retrogrades"]
        )
    else:
        retro_text = "\n  Žádná planeta není retrográdní"

    eclipse_text = ""
    if ctx["eclipse"]:
        e = ctx["eclipse"]
        eclipse_text = f"\n\n  ECLIPSE SEZONA: {e['type']} zatmění v {e['sign']} {e['timing']}"

    planets_text = "\n".join(
        f"  {p['symbol']} {p['planet']} v {p['sign']}" for p in ctx["slow_planets"]
    )

    console.print(Panel(
        f"Datum: {ctx['date']}\n\n"
        f"{ctx['moon']['emoji']} Mesic: {ctx['moon']['phase_cs']} ({ctx['moon']['illumination_approx']}% osvetlen)\n"
        f"   Znameni: {ctx['moon_sign']['cs']} {ctx['moon_sign']['symbol']}  {ctx['moon_sign']['degree']}deg  "
        f"[{ctx['moon_sign']['element']}]\n"
        f"   {ctx['moon_sign']['content_hook']}\n\n"
        f"{ctx['sun']['symbol']} Slunce: {ctx['sun']['sign_cs']} — {ctx['sun']['themes']}\n\n"
        f"{ctx['planetary_day']['symbol']} Vladce dne: {ctx['planetary_day']['planet']} "
        f"({ctx['planetary_day']['day_cs']}) — {ctx['planetary_day']['energy']}\n\n"
        f"Retrogradity:{retro_text}\n\n"
        f"Pomale planety:\n{planets_text}"
        f"{eclipse_text}\n\n"
        f"Num. den {ctx['universal_day']}: {ctx['universal_day_meaning']}\n\n"
        f"CONTENT BRIEF:\n{ctx['content_brief']}",
        title="Astrological Context",
        border_style="purple",
    ))
