"""
Low-cost deterministic reply templates.

These replies avoid an AI call for common cases where a short human answer is
better than a freshly generated paragraph.
"""
from __future__ import annotations

import hashlib
import re

from reply_strategy import ReplyStrategy, classify_comment_context

ZODIAC_LABELS = {
    "beran": "Beran",
    "býk": "Býk",
    "byk": "Býk",
    "blíženci": "Blíženci",
    "blizenci": "Blíženci",
    "rak": "Rak",
    "lev": "Lev",
    "panna": "Panna",
    "váhy": "Váhy",
    "vahy": "Váhy",
    "štír": "Štír",
    "stir": "Štír",
    "střelec": "Střelec",
    "strelec": "Střelec",
    "kozoroh": "Kozoroh",
    "vodnář": "Vodnář",
    "vodnar": "Vodnář",
    "ryby": "Ryby",
}

ZODIAC_ADJECTIVES = {
    "Beran": "beraní",
    "Býk": "býčí",
    "Blíženci": "blíženecká",
    "Rak": "račí",
    "Lev": "lví",
    "Panna": "panenská",
    "Váhy": "váhová",
    "Štír": "štíří",
    "Střelec": "střelecká",
    "Kozoroh": "kozoroží",
    "Vodnář": "vodnářská",
    "Ryby": "rybí",
}


def _pick(seed: str, variants: list[str]) -> str:
    if not variants:
        return ""
    digest = hashlib.sha1(seed.encode("utf-8")).hexdigest()
    return variants[int(digest[:8], 16) % len(variants)]


def _comment_fragment(message: str, max_len: int = 54) -> str:
    text = re.sub(r"\s+", " ", (message or "").strip())
    text = re.sub(r"https?://\S+", "", text).strip()
    if len(text) <= max_len:
        return text
    return text[: max_len - 1].rstrip(" ,.;:!?") + "…"


def _detect_zodiac(message: str) -> str | None:
    lower = (message or "").lower()
    for key, label in ZODIAC_LABELS.items():
        if key in lower:
            return label
    return None


def render_template_reply(
    comment: dict,
    strategy: ReplyStrategy,
    thread_memory: dict | None = None,
) -> str:
    """Return a deterministic reply for template-capable comments."""
    message = comment.get("message", "")
    key = strategy.template_key or classify_comment_context(message, comment.get("sentiment", ""))
    seed = f"{comment.get('id', '')}|{message}|{key}"
    fragment = _comment_fragment(message)

    if key == "crisis":
        return (
            "Tohle bereme vážně a nechceme, aby na tobě teď zůstalo všechno. "
            "Jestli jsi v bezprostředním ohrožení, volej 112; pokud můžeš, zavolej teď někomu blízkému "
            "nebo na Linku první psychické pomoci 116 123."
        )

    if key == "rude":
        return _pick(seed, [
            "Rozumím, nemusí ti to sedět. Pokud chceš věcně říct, co přesně ti na tom nesedí, rádi na to navážeme.",
            "V pohodě, tenhle pohled není pro každého. Když budeš chtít konkrétně rozebrat, co ti přijde mimo, můžeme zůstat u věci.",
            "Beru, že to tak můžeš vnímat. Bez urážek se o tom dá bavit mnohem líp.",
        ])

    if key == "skeptic":
        return _pick(seed, [
            "Tohle beru. Někdy člověk prostě neví, a i to je poctivější než si něco tlačit přes sílu.",
            "Rozumím. Ne všechno musí sednout hned; někdy stačí nechat si z toho jen jednu otázku.",
            "To dává smysl. U těchhle věcí je lepší držet si vlastní úsudek než se do něčeho nutit.",
        ])

    if key == "praise":
        zodiac = _detect_zodiac(message)
        if zodiac:
            zodiac_adj = ZODIAC_ADJECTIVES.get(zodiac, zodiac)
            return _pick(seed, [
                f"{zodiac} v tomhle často pozná pravdu rychleji, než ji stihne vysvětlit. Hezky řečeno.",
                f"Tohle k energii {zodiac} sedí: když něco uvnitř víš, nepotřebuješ to moc obhajovat.",
                f"Ta {zodiac_adj} jistota je v tom cítit. Díky za milou reakci.",
            ])
        if fragment and len(fragment) <= 18:
            return _pick(seed, [
                "Někdy stačí jedno slovo. Když to sedne, člověk to pozná hned.",
                "Přesně tak. Někdy se v tom člověk prostě najde bez dlouhého vysvětlování.",
                "Tohle sedlo hezky. Díky za milou reakci.",
            ])
        if fragment:
            return _pick(seed, [
                "Tohle potěšilo. Je hezké vidět, že sis z toho vzal přesně ten svůj kousek.",
                "Díky za milou reakci. Když text takhle sedne, má smysl ho poslat dál.",
                "Tohle se čte hezky. Ať ti ta myšlenka zůstane přesně tam, kde ji teď potřebuješ.",
            ])
        return _pick(seed, [
            "Děkujeme, tohle se čte hezky. Ať si z toho dnes vezmeš přesně to, co potřebuješ.",
            "Tohle potěšilo. Díky za milou reakci.",
            "Díky za milou reakci. Ať ti ta myšlenka dnes sedne někam přesně.",
        ])

    if key == "humor":
        return _pick(seed, [
            "Přesně tenhle typ komentáře má vlastní malou energii 😄",
            "Tady hvězdy mlčí, ale úsměv schvalují 😄",
            "Tohle je ta lehčí magie komentářové sekce 😄",
        ])

    if key == "off_topic_question":
        return _pick(seed, [
            "Tohle je trochu mimo téma postu, takže nechci střílet odpověď od boku. Tady radši zůstanu u mystiky a výkladů.",
            "Na tohle nejsme nejlepší místo. Radši nechci dávat radu, která by zněla jistěji, než si zaslouží.",
        ])

    return _pick(seed, [
        "Díky za komentář. Zůstávám u toho hlavního: vezmi si z toho jen to, co s tebou opravdu rezonuje.",
        "Tohle beru. Někdy stačí jedna věta, která člověka na chvíli zastaví.",
    ])
