"""
Astro Event Triggers — automatické spouštění postů na základě astrologických událostí.

Kalendář zahrnuje:
  - Zatmění Slunce a Měsíce
  - Retrogradity planet (Merkur, Venuše, Mars, Jupiter, Saturn)
  - Slunovraty a ekvinokce
  - Nový měsíc a úplněk (přesná data)
  - Angel number dny (11.1., 22.2., 11.11. atd.)
  - Ingresse Slunce do znamení (astro sezóny)

Použití:
    from generators.astro_events import get_upcoming_events, get_today_triggers
    triggers = get_today_triggers()
    for t in triggers:
        print(f"{t['name']} — {t['suggested_topic']}")
"""
from datetime import date, timedelta
from typing import Optional

import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from logger import get_logger

log = get_logger(__name__)


# ══════════════════════════════════════════════════════════════
# ASTRO KALENDÁŘ 2026
# ══════════════════════════════════════════════════════════════

ECLIPSES_2026 = [
    {
        "date": date(2026, 2, 17),
        "name": "Prstencové zatmění Slunce",
        "name_cs": "Prstencové zatmění Slunce v Rybách",
        "type": "solar_eclipse",
        "sign": "Ryby",
        "element": "voda",
        "priority": "high",
        "pre_buzz_days": 3,
        "post_buzz_days": 1,
        "suggested_topic": "astrologie",
        "suggested_hook": "fear_reversal",
        "suggested_type": "educational",
        "content_angle": "Zatmění Slunce v Rybách rozpouští iluze. Co jsi nechtěl vidět?",
    },
    {
        "date": date(2026, 3, 3),
        "name": "Úplné zatmění Měsíce",
        "name_cs": "Úplné zatmění Měsíce v Panně",
        "type": "lunar_eclipse",
        "sign": "Panna",
        "element": "země",
        "priority": "high",
        "pre_buzz_days": 3,
        "post_buzz_days": 1,
        "suggested_topic": "lunární rituály a fáze měsíce",
        "suggested_hook": "curiosity_gap",
        "suggested_type": "educational",
        "content_angle": "Zatmění v Panně čistí návyky. Který rituál tě drží zpátky?",
    },
    {
        "date": date(2026, 8, 12),
        "name": "Částečné zatmění Slunce",
        "name_cs": "Částečné zatmění Slunce ve Lvu",
        "type": "solar_eclipse",
        "sign": "Lev",
        "element": "oheň",
        "priority": "high",
        "pre_buzz_days": 3,
        "post_buzz_days": 1,
        "suggested_topic": "astrologie",
        "suggested_hook": "pattern_interrupt",
        "suggested_type": "story",
        "content_angle": "Zatmění ve Lvu ti ukazuje, kde hraješ roli místo toho, abys žil.",
    },
    {
        "date": date(2026, 8, 28),
        "name": "Částečné zatmění Měsíce",
        "name_cs": "Částečné zatmění Měsíce v Rybách",
        "type": "lunar_eclipse",
        "sign": "Ryby",
        "element": "voda",
        "priority": "medium",
        "pre_buzz_days": 2,
        "post_buzz_days": 1,
        "suggested_topic": "lunární rituály a fáze měsíce",
        "suggested_hook": "vulnerability",
        "suggested_type": "story",
        "content_angle": "Zatmění v Rybách probouzí sny. Věnuj pozornost tomu, co ti říkají.",
    },
]

RETROGRADES_2026 = [
    # Merkur — 3× ročně, vždy high priority (největší vliv na každodenní život)
    {
        "start": date(2026, 1, 26), "end": date(2026, 2, 16),
        "planet": "Merkur", "planet_en": "Mercury",
        "sign_start": "Vodnář", "sign_end": "Kozoroh",
        "priority": "high",
        "suggested_topic": "astrologie",
        "suggested_hook": "myth_bust",
        "suggested_type": "myth_bust",
        "content_angle": "Merkur retrográdní neznamená katastrofu. Znamená zpomalit a zkontrolovat.",
    },
    {
        "start": date(2026, 5, 22), "end": date(2026, 6, 14),
        "planet": "Merkur", "planet_en": "Mercury",
        "sign_start": "Blíženci", "sign_end": "Býk",
        "priority": "high",
        "suggested_topic": "astrologie",
        "suggested_hook": "contrarian",
        "suggested_type": "educational",
        "content_angle": "Merkur retrográdní v Blížencích — slova se zamotají, ale pravda vyjde najevo.",
    },
    {
        "start": date(2026, 9, 17), "end": date(2026, 10, 9),
        "planet": "Merkur", "planet_en": "Mercury",
        "sign_start": "Váhy", "sign_end": "Panna",
        "priority": "high",
        "suggested_topic": "astrologie",
        "suggested_hook": "curiosity_gap",
        "suggested_type": "tip",
        "content_angle": "Merkur retrográdní ve Vahách přehodnocuje vztahy. S kým potřebuješ mluvit?",
    },
    # Venuše — jednou ročně, high priority (láska + finance)
    {
        "start": date(2026, 3, 2), "end": date(2026, 4, 13),
        "planet": "Venuše", "planet_en": "Venus",
        "sign_start": "Beran", "sign_end": "Ryby",
        "priority": "high",
        "suggested_topic": "karmické vztahy a spřízněné duše",
        "suggested_hook": "vulnerability",
        "suggested_type": "story",
        "content_angle": "Venuše retrográdní přivádí zpět lidi z minulosti. Ne všichni si zaslouží druhou šanci.",
    },
    # Mars — jednou za 2 roky
    {
        "start": date(2026, 1, 6), "end": date(2026, 2, 24),
        "planet": "Mars", "planet_en": "Mars",
        "sign_start": "Lev", "sign_end": "Rak",
        "priority": "medium",
        "suggested_topic": "astrologie",
        "suggested_hook": "fear_reversal",
        "suggested_type": "tip",
        "content_angle": "Mars retrográdní = přehodnoť, na co dáváš energii. Ne vše si ji zaslouží.",
    },
    # Saturn
    {
        "start": date(2026, 7, 13), "end": date(2026, 11, 28),
        "planet": "Saturn", "planet_en": "Saturn",
        "sign_start": "Beran", "sign_end": "Beran",
        "priority": "low",
        "suggested_topic": "sebepoznání a životní účel",
        "suggested_hook": "contrarian",
        "suggested_type": "educational",
        "content_angle": "Saturn retrográdní v Beranu — testuje tvou zodpovědnost za vlastní život.",
    },
    # Jupiter
    {
        "start": date(2026, 7, 25), "end": date(2026, 11, 21),
        "planet": "Jupiter", "planet_en": "Jupiter",
        "sign_start": "Rak", "sign_end": "Rak",
        "priority": "low",
        "suggested_topic": "duchovní rozvoj",
        "suggested_hook": "curiosity_gap",
        "suggested_type": "educational",
        "content_angle": "Jupiter retrográdní v Raku — růst jde dovnitř, ne ven.",
    },
]

SOLSTICES_EQUINOXES_2026 = [
    {
        "date": date(2026, 3, 20),
        "name": "Jarní rovnodennost",
        "name_en": "Spring Equinox",
        "type": "equinox",
        "priority": "high",
        "pre_buzz_days": 2,
        "post_buzz_days": 0,
        "suggested_topic": "sezónní energie a astrologie roku",
        "suggested_hook": "celebration",
        "suggested_type": "tip",
        "content_angle": "Astrolog. nový rok! Jarní rovnodennost = čas zasít záměry pro celý rok.",
    },
    {
        "date": date(2026, 6, 21),
        "name": "Letní slunovrat",
        "name_en": "Summer Solstice",
        "type": "solstice",
        "priority": "high",
        "pre_buzz_days": 2,
        "post_buzz_days": 0,
        "suggested_topic": "sezónní energie a astrologie roku",
        "suggested_hook": "celebration",
        "suggested_type": "tip",
        "content_angle": "Nejdelší den roku. Světlo je na svém vrcholu — a s ním i tvá manifestační síla.",
    },
    {
        "date": date(2026, 9, 22),
        "name": "Podzimní rovnodennost",
        "name_en": "Autumn Equinox",
        "type": "equinox",
        "priority": "medium",
        "pre_buzz_days": 2,
        "post_buzz_days": 0,
        "suggested_topic": "sezónní energie a astrologie roku",
        "suggested_hook": "micro_story",
        "suggested_type": "story",
        "content_angle": "Den a noc v rovnováze. Co potřebuješ vyvážit ve svém životě?",
    },
    {
        "date": date(2026, 12, 21),
        "name": "Zimní slunovrat",
        "name_en": "Winter Solstice",
        "type": "solstice",
        "priority": "high",
        "pre_buzz_days": 2,
        "post_buzz_days": 0,
        "suggested_topic": "sezónní energie a astrologie roku",
        "suggested_hook": "vulnerability",
        "suggested_type": "story",
        "content_angle": "Nejdelší noc. Ticho před znovuzrozením světla. Čas jít dovnitř.",
    },
]

# Přesná data novoluní a úplňků 2026 (UTC)
LUNATIONS_2026 = [
    {"date": date(2026, 1, 29), "type": "new_moon", "sign": "Vodnář"},
    {"date": date(2026, 2, 12), "type": "full_moon", "sign": "Lev"},
    {"date": date(2026, 2, 28), "type": "new_moon", "sign": "Ryby"},
    {"date": date(2026, 3, 14), "type": "full_moon", "sign": "Panna"},
    {"date": date(2026, 3, 29), "type": "new_moon", "sign": "Beran"},
    {"date": date(2026, 4, 12), "type": "full_moon", "sign": "Váhy"},
    {"date": date(2026, 4, 28), "type": "new_moon", "sign": "Býk"},
    {"date": date(2026, 5, 12), "type": "full_moon", "sign": "Štír"},
    {"date": date(2026, 5, 27), "type": "new_moon", "sign": "Blíženci"},
    {"date": date(2026, 6, 11), "type": "full_moon", "sign": "Střelec"},
    {"date": date(2026, 6, 26), "type": "new_moon", "sign": "Rak"},
    {"date": date(2026, 7, 10), "type": "full_moon", "sign": "Kozoroh"},
    {"date": date(2026, 7, 25), "type": "new_moon", "sign": "Lev"},
    {"date": date(2026, 8, 9),  "type": "full_moon", "sign": "Vodnář"},
    {"date": date(2026, 8, 24), "type": "new_moon", "sign": "Panna"},
    {"date": date(2026, 9, 7),  "type": "full_moon", "sign": "Ryby"},
    {"date": date(2026, 9, 22), "type": "new_moon", "sign": "Váhy"},
    {"date": date(2026, 10, 7), "type": "full_moon", "sign": "Beran"},
    {"date": date(2026, 10, 22),"type": "new_moon", "sign": "Štír"},
    {"date": date(2026, 11, 5), "type": "full_moon", "sign": "Býk"},
    {"date": date(2026, 11, 21),"type": "new_moon", "sign": "Střelec"},
    {"date": date(2026, 12, 4), "type": "full_moon", "sign": "Blíženci"},
    {"date": date(2026, 12, 20),"type": "new_moon", "sign": "Kozoroh"},
]

# Angel number dny — opakující se vzory v datu
ANGEL_NUMBER_DATES_2026 = [
    {"date": date(2026, 1, 1),   "pattern": "1.1.",   "meaning": "Nový začátek, manifestace"},
    {"date": date(2026, 1, 11),  "pattern": "11.1.",  "meaning": "Probuzení, intuice, andělské vedení"},
    {"date": date(2026, 2, 2),   "pattern": "2.2.",   "meaning": "Rovnováha, partnerství, trpělivost"},
    {"date": date(2026, 2, 22),  "pattern": "22.2.",  "meaning": "Master number 22, stavitel snů"},
    {"date": date(2026, 3, 3),   "pattern": "3.3.",   "meaning": "Kreativita, komunikace, radost"},
    {"date": date(2026, 3, 13),  "pattern": "13.3.",  "meaning": "Transformace, odvaha ke změně"},
    {"date": date(2026, 4, 4),   "pattern": "4.4.",   "meaning": "Stabilita, andělská ochrana"},
    {"date": date(2026, 5, 5),   "pattern": "5.5.",   "meaning": "Změna, svoboda, dobrodružství"},
    {"date": date(2026, 6, 6),   "pattern": "6.6.",   "meaning": "Láska, harmonie, domov"},
    {"date": date(2026, 7, 7),   "pattern": "7.7.",   "meaning": "Duchovní probuzení, mystika"},
    {"date": date(2026, 8, 8),   "pattern": "8.8.",   "meaning": "Hojnost, Lví brána, manifestace"},
    {"date": date(2026, 9, 9),   "pattern": "9.9.",   "meaning": "Dokončení, moudrost, služba"},
    {"date": date(2026, 10, 10), "pattern": "10.10.", "meaning": "Nový cyklus, karmické dokončení"},
    {"date": date(2026, 11, 1),  "pattern": "1.11.",  "meaning": "Portál intuice"},
    {"date": date(2026, 11, 11), "pattern": "11.11.", "meaning": "Nejsilnější andělský portál roku"},
    {"date": date(2026, 12, 12), "pattern": "12.12.", "meaning": "Dokončení cyklu, vděčnost"},
    {"date": date(2026, 12, 21), "pattern": "21.12.", "meaning": "Zrcadlové datum, slunovrat"},
]

# Ingresse Slunce do znamení (astro sezóny 2026)
SUN_INGRESSES_2026 = [
    {"date": date(2026, 1, 20),  "sign": "Vodnář",  "sign_en": "Aquarius"},
    {"date": date(2026, 2, 18),  "sign": "Ryby",    "sign_en": "Pisces"},
    {"date": date(2026, 3, 20),  "sign": "Beran",   "sign_en": "Aries"},
    {"date": date(2026, 4, 20),  "sign": "Býk",     "sign_en": "Taurus"},
    {"date": date(2026, 5, 21),  "sign": "Blíženci", "sign_en": "Gemini"},
    {"date": date(2026, 6, 21),  "sign": "Rak",     "sign_en": "Cancer"},
    {"date": date(2026, 7, 22),  "sign": "Lev",     "sign_en": "Leo"},
    {"date": date(2026, 8, 22),  "sign": "Panna",   "sign_en": "Virgo"},
    {"date": date(2026, 9, 22),  "sign": "Váhy",    "sign_en": "Libra"},
    {"date": date(2026, 10, 23), "sign": "Štír",    "sign_en": "Scorpio"},
    {"date": date(2026, 11, 22), "sign": "Střelec", "sign_en": "Sagittarius"},
    {"date": date(2026, 12, 21), "sign": "Kozoroh", "sign_en": "Capricorn"},
]

# Speciální astro eventy
SPECIAL_EVENTS_2026 = [
    {
        "date": date(2026, 8, 8),
        "name": "Lví brána 8:8",
        "name_en": "Lion's Gate Portal",
        "priority": "high",
        "pre_buzz_days": 2,
        "post_buzz_days": 1,
        "suggested_topic": "astrologie",
        "suggested_hook": "celebration",
        "suggested_type": "educational",
        "content_angle": "8.8. — Lví brána se otevírá. Sirius se zarovnává se Zemí. Nejsilnější manifestační den roku.",
    },
    {
        "date": date(2026, 5, 26),
        "name": "Saturn vstupuje do Berana",
        "name_en": "Saturn enters Aries",
        "priority": "medium",
        "pre_buzz_days": 3,
        "post_buzz_days": 2,
        "suggested_topic": "astrologie",
        "suggested_hook": "pattern_interrupt",
        "suggested_type": "educational",
        "content_angle": "Saturn v Beranu poprvé od 1999. Nové lekce zodpovědnosti pro celou generaci.",
    },
    {
        "date": date(2026, 6, 9),
        "name": "Jupiter vstupuje do Raka",
        "name_en": "Jupiter enters Cancer",
        "priority": "medium",
        "pre_buzz_days": 3,
        "post_buzz_days": 2,
        "suggested_topic": "astrologie",
        "suggested_hook": "celebration",
        "suggested_type": "educational",
        "content_angle": "Jupiter v Raku = exaltace. Největší štěstí přichází přes rodinu a domov.",
    },
]


# ══════════════════════════════════════════════════════════════
# HLAVNÍ FUNKCE
# ══════════════════════════════════════════════════════════════

def get_upcoming_events(target_date: date = None, days_ahead: int = 3) -> list[dict]:
    """
    Vrátí všechny astro eventy v rozmezí [target_date - 1, target_date + days_ahead].
    Zahrnuje pre-buzz periody (např. "zatmění za 2 dny").

    Returns:
        list of dicts, každý s klíči:
            name, date, type, priority, days_until, is_today, is_pre_buzz,
            suggested_topic, suggested_hook, suggested_type, content_angle
    """
    if target_date is None:
        target_date = date.today()

    window_start = target_date - timedelta(days=1)
    window_end = target_date + timedelta(days=days_ahead)
    results = []

    # --- Zatmění ---
    for e in ECLIPSES_2026:
        pre_start = e["date"] - timedelta(days=e["pre_buzz_days"])
        post_end = e["date"] + timedelta(days=e["post_buzz_days"])
        if pre_start <= target_date <= post_end:
            days_until = (e["date"] - target_date).days
            results.append({
                "name": e["name_cs"],
                "date": e["date"],
                "type": e["type"],
                "priority": e["priority"],
                "days_until": days_until,
                "is_today": days_until == 0,
                "is_pre_buzz": days_until > 0,
                "is_post_buzz": days_until < 0,
                "suggested_topic": e["suggested_topic"],
                "suggested_hook": e["suggested_hook"],
                "suggested_type": e["suggested_type"],
                "content_angle": e["content_angle"],
                "sign": e.get("sign", ""),
                "category": "eclipse",
            })

    # --- Retrogradity ---
    for r in RETROGRADES_2026:
        start_days = (r["start"] - target_date).days
        end_days = (r["end"] - target_date).days

        # Den startu (±1 den)
        if -1 <= start_days <= 2:
            results.append({
                "name": f"{r['planet']} začíná retrográdní pohyb ({r['sign_start']})",
                "date": r["start"],
                "type": "retrograde_start",
                "priority": r["priority"],
                "days_until": start_days,
                "is_today": start_days == 0,
                "is_pre_buzz": start_days > 0,
                "is_post_buzz": start_days < 0,
                "suggested_topic": r["suggested_topic"],
                "suggested_hook": r["suggested_hook"],
                "suggested_type": r["suggested_type"],
                "content_angle": r["content_angle"],
                "planet": r["planet"],
                "category": "retrograde",
            })
        # Den konce (±1 den)
        elif -1 <= end_days <= 2:
            results.append({
                "name": f"{r['planet']} se vrací do přímého pohybu",
                "date": r["end"],
                "type": "retrograde_end",
                "priority": r["priority"],
                "days_until": end_days,
                "is_today": end_days == 0,
                "is_pre_buzz": end_days > 0,
                "is_post_buzz": end_days < 0,
                "suggested_topic": r["suggested_topic"],
                "suggested_hook": "celebration",
                "suggested_type": "tip",
                "content_angle": f"{r['planet']} jde zase přímo! Čas jednat na tom, co jsi přehodnotil.",
                "planet": r["planet"],
                "category": "retrograde",
            })

    # --- Slunovraty / rovnodennosti ---
    for s in SOLSTICES_EQUINOXES_2026:
        pre_start = s["date"] - timedelta(days=s["pre_buzz_days"])
        post_end = s["date"] + timedelta(days=s["post_buzz_days"])
        if pre_start <= target_date <= post_end:
            days_until = (s["date"] - target_date).days
            results.append({
                "name": s["name"],
                "date": s["date"],
                "type": s["type"],
                "priority": s["priority"],
                "days_until": days_until,
                "is_today": days_until == 0,
                "is_pre_buzz": days_until > 0,
                "is_post_buzz": days_until < 0,
                "suggested_topic": s["suggested_topic"],
                "suggested_hook": s["suggested_hook"],
                "suggested_type": s["suggested_type"],
                "content_angle": s["content_angle"],
                "category": "season",
            })

    # --- Novoluní / úplňky (přesná data) ---
    for lun in LUNATIONS_2026:
        days_until = (lun["date"] - target_date).days
        if -1 <= days_until <= 1:
            is_full = lun["type"] == "full_moon"
            results.append({
                "name": f"{'Úplněk' if is_full else 'Novoluní'} v {lun['sign']}",
                "date": lun["date"],
                "type": lun["type"],
                "priority": "medium",
                "days_until": days_until,
                "is_today": days_until == 0,
                "is_pre_buzz": days_until > 0,
                "is_post_buzz": days_until < 0,
                "suggested_topic": "lunární rituály a fáze měsíce",
                "suggested_hook": "micro_story" if is_full else "curiosity_gap",
                "suggested_type": "tip",
                "content_angle": (
                    f"Úplněk v {lun['sign']} zesiluje emoce. Čas pustit to, co ti neslouží."
                    if is_full else
                    f"Novoluní v {lun['sign']} — nový cyklus, nový záměr. Co chceš přivolat?"
                ),
                "sign": lun["sign"],
                "category": "lunation",
            })

    # --- Angel number dny ---
    for a in ANGEL_NUMBER_DATES_2026:
        days_until = (a["date"] - target_date).days
        if days_until == 0:
            results.append({
                "name": f"Andělský den {a['pattern']}",
                "date": a["date"],
                "type": "angel_number",
                "priority": "medium" if "11" in a["pattern"] else "low",
                "days_until": 0,
                "is_today": True,
                "is_pre_buzz": False,
                "is_post_buzz": False,
                "suggested_topic": "andělé a andělské karty",
                "suggested_hook": "pattern_interrupt",
                "suggested_type": "daily_energy",
                "content_angle": f"Dnes je {a['pattern']} — {a['meaning']}",
                "angel_pattern": a["pattern"],
                "category": "angel_number",
            })

    # --- Speciální eventy ---
    for sp in SPECIAL_EVENTS_2026:
        pre_start = sp["date"] - timedelta(days=sp["pre_buzz_days"])
        post_end = sp["date"] + timedelta(days=sp["post_buzz_days"])
        if pre_start <= target_date <= post_end:
            days_until = (sp["date"] - target_date).days
            results.append({
                "name": sp["name"],
                "date": sp["date"],
                "type": "special",
                "priority": sp["priority"],
                "days_until": days_until,
                "is_today": days_until == 0,
                "is_pre_buzz": days_until > 0,
                "is_post_buzz": days_until < 0,
                "suggested_topic": sp["suggested_topic"],
                "suggested_hook": sp["suggested_hook"],
                "suggested_type": sp["suggested_type"],
                "content_angle": sp["content_angle"],
                "category": "special",
            })

    # --- Ingresse Slunce ---
    for ing in SUN_INGRESSES_2026:
        days_until = (ing["date"] - target_date).days
        if -1 <= days_until <= 1:
            results.append({
                "name": f"Slunce vstupuje do {ing['sign']}",
                "date": ing["date"],
                "type": "sun_ingress",
                "priority": "medium",
                "days_until": days_until,
                "is_today": days_until == 0,
                "is_pre_buzz": days_until > 0,
                "is_post_buzz": days_until < 0,
                "suggested_topic": "sezónní energie a astrologie roku",
                "suggested_hook": "curiosity_gap",
                "suggested_type": "educational",
                "content_angle": f"Sezóna {ing['sign']} začíná! Co to přináší pro tvé znamení?",
                "sign": ing["sign"],
                "category": "ingress",
            })

    # Seřadit: high > medium > low, pak podle blízkosti
    priority_order = {"high": 0, "medium": 1, "low": 2}
    results.sort(key=lambda x: (priority_order.get(x["priority"], 3), abs(x["days_until"])))

    log.info("Astro events pro %s (±%d dní): nalezeno %d", target_date, days_ahead, len(results))
    return results


def get_today_triggers(target_date: date = None) -> list[dict]:
    """
    Vrátí eventy, které by měly dnes triggerovat speciální post.
    Filtruje na is_today=True nebo (is_pre_buzz=True a priority=high).
    """
    events = get_upcoming_events(target_date, days_ahead=0)
    triggers = []
    for e in events:
        if e["is_today"]:
            triggers.append(e)
        elif e["is_pre_buzz"] and e["priority"] == "high":
            triggers.append(e)
    return triggers


def get_active_retrogrades(target_date: date = None) -> list[dict]:
    """Vrátí seznam planet aktuálně v retrográdním pohybu."""
    if target_date is None:
        target_date = date.today()

    active = []
    for r in RETROGRADES_2026:
        if r["start"] <= target_date <= r["end"]:
            active.append({
                "planet": r["planet"],
                "sign": r["sign_start"],
                "started": r["start"],
                "ends": r["end"],
                "days_remaining": (r["end"] - target_date).days,
            })
    return active


def get_current_astro_season(target_date: date = None) -> dict:
    """Vrátí aktuální astro sezónu (znamení Slunce) na základě ingresů."""
    if target_date is None:
        target_date = date.today()

    current = None
    for ing in SUN_INGRESSES_2026:
        if target_date >= ing["date"]:
            current = ing
        else:
            break

    if current is None:
        # Před prvním ingresem v roce = Kozoroh z konce 2025
        return {"sign": "Kozoroh", "sign_en": "Capricorn", "since": date(2025, 12, 21)}

    return {"sign": current["sign"], "sign_en": current["sign_en"], "since": current["date"]}


def format_event_for_prompt(event: dict) -> str:
    """Formátuje event do textu pro systémový prompt text generátoru."""
    timing = ""
    if event["is_today"]:
        timing = "DNES"
    elif event.get("is_pre_buzz"):
        timing = f"za {event['days_until']} {'den' if event['days_until'] == 1 else 'dny'}"
    elif event.get("is_post_buzz"):
        timing = "včera"

    lines = [
        f"⚡ ASTRO EVENT ({timing}): {event['name']}",
        f"   Priorita: {event['priority']}",
        f"   Téma: {event['suggested_topic']}",
        f"   Hook: {event['suggested_hook']}",
        f"   Úhel: {event['content_angle']}",
    ]
    return "\n".join(lines)
