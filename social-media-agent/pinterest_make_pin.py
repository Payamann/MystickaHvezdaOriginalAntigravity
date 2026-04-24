"""
Pinterest Pin Maker
===================
Workflow:
  1. Vyber post (--slug nebo --index)
  2. Skript vypíše image prompt → ty vygeneruješ obrázek v Midjourney/Flux
  3. Ulož obrázek jako output/pinterest/inbox/<slug>.png (nebo .jpg)
  4. Spusť skript znovu se stejným argumentem → compositor přidá text overlay
  5. Výsledný pin je v output/pinterest/images/<slug>_pin.jpg

Použití:
    python pinterest_make_pin.py --slug "chiron-raneny-lecitel-natalni-karta"
    python pinterest_make_pin.py --index 0
    python pinterest_make_pin.py --list          # vypíše všechny posty
"""

import argparse
import json
import sys
from pathlib import Path

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

from pinterest_compositor import composite_pin

BASE_DIR   = Path(__file__).parent
REPO_DIR   = BASE_DIR.parent
BLOG_INDEX = REPO_DIR / "data" / "blog-index.json"
INBOX_DIR  = BASE_DIR / "output" / "pinterest" / "inbox"
OUTPUT_DIR = BASE_DIR / "output" / "pinterest" / "images"
LOG_PATH   = BASE_DIR / "output" / "pinterest" / "pinterest_log.json"

INBOX_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


# ─────────────────────────────────────────────────────────────────
# IMAGE PROMPTS — rucne psane pro kazdy post, zadne API
# Styl: 3D CGI icon-art, deep navy #050510, objekt v TOP 60%,
#       spodnich 40% prazdne pro text overlay, portrait 2:3
# ─────────────────────────────────────────────────────────────────

IMAGE_PROMPTS = {
    "chiron-raneny-lecitel-natalni-karta":
        "Breathtaking 3D CGI mystical scene: a golden arrow piercing a glowing crystal heart, "
        "the wound radiating healing light and blooming golden flowers from within, "
        "ancient zodiac engravings on the arrow shaft, fine gold filigree details, "
        "soft violet nebula swirling around, deep navy background (#050510). "
        "COMPOSITION: object centered in TOP 60%, bottom 40% fades to deep dark #050510 — empty for text. "
        "Portrait 2:3. NO text, NO people, NO borders.",

    "ctyri-zivly-astrologie-ohen-zeme-vzduch-voda":
        "Breathtaking 3D CGI mystical scene: four luminous elemental orbs arranged in a diamond — "
        "flame-red fire orb, deep-green earth crystal, sky-blue air sphere, sapphire water drop — "
        "each engraved with its alchemical symbol, connected by golden energy threads, "
        "cosmic starfield background deep navy (#050510). "
        "COMPOSITION: object centered in TOP 60%, bottom 40% fades to deep dark #050510 — empty for text. "
        "Portrait 2:3. NO text, NO people, NO borders.",

    "pentagramy-tarot-penize-kariera":
        "Breathtaking 3D CGI mystical scene: five golden pentagram coins floating in formation, "
        "intricate alchemical engravings on each coin surface, glowing amber light radiating from the pentagrams, "
        "scattered gold dust and tiny stars, rich warm gold palette, deep navy background (#050510). "
        "COMPOSITION: object centered in TOP 60%, bottom 40% fades to deep dark #050510 — empty for text. "
        "Portrait 2:3. NO text, NO people, NO borders.",

    "hulkove-karty-tarot-vyznam":
        "Breathtaking 3D CGI mystical scene: an ornate golden wand staff with a crystal tip, "
        "small flames and sparks dancing around its length, intricate vine and fire engravings, "
        "warm amber and crimson light, magical embers floating upward, deep navy background (#050510). "
        "COMPOSITION: object centered in TOP 60%, bottom 40% fades to deep dark #050510 — empty for text. "
        "Portrait 2:3. NO text, NO people, NO borders.",

    "numerologie-jmena-krizni-jmeno":
        "Breathtaking 3D CGI mystical scene: three golden letters dissolving into glowing numerals "
        "and stardust particles, each number vibrating with its own luminous color frequency, "
        "sacred geometry grid faintly visible in the background, deep navy background (#050510). "
        "COMPOSITION: object centered in TOP 60%, bottom 40% fades to deep dark #050510 — empty for text. "
        "Portrait 2:3. NO text, NO people, NO borders.",

    "cakrove-leceni-navod":
        "Breathtaking 3D CGI mystical scene: seven chakra lotus flowers stacked in a vertical column of light, "
        "each glowing in its sacred color — red, orange, yellow, green, blue, indigo, violet — "
        "energy spiraling upward between them, golden light connecting all seven, deep navy background (#050510). "
        "COMPOSITION: object centered in TOP 60%, bottom 40% fades to deep dark #050510 — empty for text. "
        "Portrait 2:3. NO text, NO people, NO borders.",

    "novy-mesic-ritual-zacatecnici":
        "Breathtaking 3D CGI mystical scene: a thin silver new moon crescent surrounded by floating ritual crystals — "
        "amethyst, rose quartz, clear quartz — and tiny golden candle flames, "
        "sacred herbs and flowers dissolving into stardust, silver moonlight mist, deep navy background (#050510). "
        "COMPOSITION: object centered in TOP 60%, bottom 40% fades to deep dark #050510 — empty for text. "
        "Portrait 2:3. NO text, NO people, NO borders.",

    "karta-soudce-tarot-vyznam":
        "Breathtaking 3D CGI mystical scene: a golden angelic trumpet floating in cosmic space, "
        "rays of divine white and gold light radiating from its bell, "
        "sacred geometry halos orbiting around it, stars awakening in the glow, deep navy background (#050510). "
        "COMPOSITION: object centered in TOP 60%, bottom 40% fades to deep dark #050510 — empty for text. "
        "Portrait 2:3. NO text, NO people, NO borders.",

    "numerologie-kompatibilita-partneru":
        "Breathtaking 3D CGI mystical scene: two golden Fibonacci spirals intertwining around each other, "
        "glowing numerals orbiting the spirals like planets, rose gold and warm amber light, "
        "cosmic stardust connecting both spirals, deep navy background (#050510). "
        "COMPOSITION: object centered in TOP 60%, bottom 40% fades to deep dark #050510 — empty for text. "
        "Portrait 2:3. NO text, NO people, NO borders.",

    "mecove-karty-tarot-vyznam":
        "Breathtaking 3D CGI mystical scene: two ornate swords crossed, their blades made of crystal-clear light, "
        "golden hilts with intricate engravings, sharp silver light slicing through violet mist, "
        "stars and sharp light fragments around the blades, deep navy background (#050510). "
        "COMPOSITION: object centered in TOP 60%, bottom 40% fades to deep dark #050510 — empty for text. "
        "Portrait 2:3. NO text, NO people, NO borders.",

    "keltsky-kriz-tarot-rozlozeni":
        "Breathtaking 3D CGI mystical scene: a Celtic cross made of glowing golden light, "
        "ancient knotwork patterns carved into the cross arms, ten card positions glowing as soft orbs around it, "
        "emerald and gold palette, mystical fog, deep navy background (#050510). "
        "COMPOSITION: object centered in TOP 60%, bottom 40% fades to deep dark #050510 — empty for text. "
        "Portrait 2:3. NO text, NO people, NO borders.",

    "shamansko-kolo-totemove-zvire":
        "Breathtaking 3D CGI mystical scene: a shamanic medicine wheel made of glowing amber and obsidian, "
        "four directions marked with animal spirit symbols — eagle, bear, wolf, serpent — "
        "carved in luminous gold, sacred geometric patterns, earthy amber and violet tones, deep navy background (#050510). "
        "COMPOSITION: object centered in TOP 60%, bottom 40% fades to deep dark #050510 — empty for text. "
        "Portrait 2:3. NO text, NO people, NO borders.",

    "retrograde-venus-2026-co-cekat-v-lasce":
        "Breathtaking 3D CGI mystical scene: the planet Venus made of rose gold crystal, "
        "a glowing retrograde spiral arrow looping backward around it, "
        "heart-shaped stardust and rose petals dissolving into cosmic mist, "
        "soft pink and gold palette, deep navy background (#050510). "
        "COMPOSITION: object centered in TOP 60%, bottom 40% fades to deep dark #050510 — empty for text. "
        "Portrait 2:3. NO text, NO people, NO borders.",

    "uplnek-v-panne-ritual-a-vyklad-pro-kazde-znameni":
        "Breathtaking 3D CGI mystical scene: a magnificent full moon made of luminous pearl crystal, "
        "golden wheat sheaves and intricate analytical symbols orbiting it in a ring, "
        "Virgo constellation glowing softly behind, silver moonlight mist, deep navy background (#050510). "
        "COMPOSITION: object centered in TOP 60%, bottom 40% fades to deep dark #050510 — empty for text. "
        "Portrait 2:3. NO text, NO people, NO borders.",

    "uplnek-v-kozorohovi-ritual-a-vyznam":
        "Breathtaking 3D CGI mystical scene: a glowing full moon above a dark crystalline mountain peak, "
        "Capricorn sea-goat sigil engraved in gold on the mountainside, "
        "ambitious golden light rays cutting through cosmic darkness, deep navy background (#050510). "
        "COMPOSITION: object centered in TOP 60%, bottom 40% fades to deep dark #050510 — empty for text. "
        "Portrait 2:3. NO text, NO people, NO borders.",

    "merkur-v-retrograde-co-to-znamena-pro-vase-znameni":
        "Breathtaking 3D CGI mystical scene: the planet Mercury made of quicksilver liquid metal, "
        "a backward looping retrograde spiral orbiting it, twelve zodiac glyphs floating around the orbit, "
        "silver and mercury-blue light, electric sparks, deep navy background (#050510). "
        "COMPOSITION: object centered in TOP 60%, bottom 40% fades to deep dark #050510 — empty for text. "
        "Portrait 2:3. NO text, NO people, NO borders.",

    "proc-vam-to-v-lasce-nevyhcazi":
        "Breathtaking 3D CGI mystical scene: two golden hearts entangled in glowing karmic chains, "
        "one heart luminous and open, the other wrapped in shadowy bonds slowly dissolving, "
        "rose gold light breaking through the chains, cosmic stardust, deep navy background (#050510). "
        "COMPOSITION: object centered in TOP 60%, bottom 40% fades to deep dark #050510 — empty for text. "
        "Portrait 2:3. NO text, NO people, NO borders.",

    "zivotni-cislo-odhaleni-kodu-vasi-duse":
        "Breathtaking 3D CGI mystical scene: a glowing golden numerological mandala, "
        "life path numbers 1-9 arranged in a sacred geometric pattern, "
        "each number radiating a different colored light ray, ancient mystical symbols woven between them, "
        "deep navy background (#050510). "
        "COMPOSITION: object centered in TOP 60%, bottom 40% fades to deep dark #050510 — empty for text. "
        "Portrait 2:3. NO text, NO people, NO borders.",

    "rozpoznejte-svou-astrologickou-signaturu":
        "Breathtaking 3D CGI mystical scene: three luminous zodiac symbols arranged in a golden triangle — "
        "sun glyph, moon crescent, and ascendant arrow — each glowing in gold, silver, and copper, "
        "cosmic energy flowing between the three points, starfield, deep navy background (#050510). "
        "COMPOSITION: object centered in TOP 60%, bottom 40% fades to deep dark #050510 — empty for text. "
        "Portrait 2:3. NO text, NO people, NO borders.",

    "tajemstvi-12-astrologickych-domu":
        "Breathtaking 3D CGI mystical scene: a twelve-pointed astrological wheel made of gold and crystal, "
        "each house division glowing with its planetary ruler's light, "
        "ancient zodiac glyphs engraved on the outer ring, celestial map depth, deep navy background (#050510). "
        "COMPOSITION: object centered in TOP 60%, bottom 40% fades to deep dark #050510 — empty for text. "
        "Portrait 2:3. NO text, NO people, NO borders.",

    "stir-muz-a-panna-zena-kompatibilita":
        "Breathtaking 3D CGI mystical scene: a gleaming Scorpion made of obsidian crystal facing "
        "a golden wheat bundle — the two symbols magnetized toward each other, "
        "deep teal and gold energy arcing between them, tension and attraction in the air, deep navy background (#050510). "
        "COMPOSITION: object centered in TOP 60%, bottom 40% fades to deep dark #050510 — empty for text. "
        "Portrait 2:3. NO text, NO people, NO borders.",

    "runy-severska-magie-v-modernim-svete":
        "Breathtaking 3D CGI mystical scene: ancient Viking runic stone made of dark obsidian floating in space, "
        "glowing amber and gold runes carved deeply into its surface — Elder Futhark symbols — "
        "magical light emanating from each rune, particles of golden light swirling, deep navy background (#050510). "
        "COMPOSITION: object centered in TOP 60%, bottom 40% fades to deep dark #050510 — empty for text. "
        "Portrait 2:3. NO text, NO people, NO borders.",

    "co-je-synastrie-jak-funguje-partnerska-astrologie":
        "Breathtaking 3D CGI mystical scene: two overlapping astrological chart wheels made of gold and silver, "
        "their intersection glowing with warm rose gold light, planetary aspects connecting between the two charts, "
        "cosmic energy lines, starfield, deep navy background (#050510). "
        "COMPOSITION: object centered in TOP 60%, bottom 40% fades to deep dark #050510 — empty for text. "
        "Portrait 2:3. NO text, NO people, NO borders.",

    "andelska-cisla-1111":
        "Breathtaking 3D CGI mystical scene: four tall pillars of divine golden-white light standing side by side, "
        "angelic light rays emanating from their tops, sacred geometry halos forming above the pillars, "
        "soft gold and white luminescence, deep navy background (#050510). "
        "COMPOSITION: object centered in TOP 60%, bottom 40% fades to deep dark #050510 — empty for text. "
        "Portrait 2:3. NO text, NO people, NO borders.",

    "5-znaku-ze-potkavate-svou-spriznenou-dusi":
        "Breathtaking 3D CGI mystical scene: two luminous soul flames — one gold, one silver — "
        "spiraling toward each other and beginning to merge into a single radiant white flame, "
        "cosmic stardust and heart-shaped light particles swirling around them, deep navy background (#050510). "
        "COMPOSITION: object centered in TOP 60%, bottom 40% fades to deep dark #050510 — empty for text. "
        "Portrait 2:3. NO text, NO people, NO borders.",

    "jak-zjistit-sve-logo-a-sestici-v-numerologii":
        "Breathtaking 3D CGI mystical scene: three glowing numerological symbols in a triangle formation — "
        "Expression number, Soul Urge, Personality — each a luminous golden glyph, "
        "sacred geometry connecting all three, soft warm light, deep navy background (#050510). "
        "COMPOSITION: object centered in TOP 60%, bottom 40% fades to deep dark #050510 — empty for text. "
        "Portrait 2:3. NO text, NO people, NO borders.",

    "iluze-spriznene-duse-karmicke-vztahy":
        "Breathtaking 3D CGI mystical scene: a golden ornate mirror reflecting a distorted soul silhouette, "
        "the reflection slightly different from reality, karmic chains dissolving into light around the mirror frame, "
        "shadowy and luminous contrast, deep navy background (#050510). "
        "COMPOSITION: object centered in TOP 60%, bottom 40% fades to deep dark #050510 — empty for text. "
        "Portrait 2:3. NO text, NO people, NO borders.",

    "co-znamenaji-pohary-v-tarotu":
        "Breathtaking 3D CGI mystical scene: an ornate golden chalice overflowing with luminous water and light, "
        "water droplets transforming into tiny stars as they fall, sapphire and gold palette, "
        "emotional energy rippling outward like waves, deep navy background (#050510). "
        "COMPOSITION: object centered in TOP 60%, bottom 40% fades to deep dark #050510 — empty for text. "
        "Portrait 2:3. NO text, NO people, NO borders.",

    "psychologie-snu-stici-stromy":
        "Breathtaking 3D CGI mystical scene: pearl-white teeth floating and slowly dissolving into silver stardust, "
        "dreamlike fog swirling around, surreal and ethereal atmosphere, "
        "silver and moonwhite palette, subconscious symbolism, deep navy background (#050510). "
        "COMPOSITION: object centered in TOP 60%, bottom 40% fades to deep dark #050510 — empty for text. "
        "Portrait 2:3. NO text, NO people, NO borders.",

    "ascendent-vs-slunecni-znameni-jaky-je-rozdil":
        "Breathtaking 3D CGI mystical scene: a radiant golden sun symbol and a silver ascendant arrow "
        "facing each other in cosmic balance, a yin-yang energy field between them, "
        "twelve zodiac glyphs faintly orbiting in the background, deep navy background (#050510). "
        "COMPOSITION: object centered in TOP 60%, bottom 40% fades to deep dark #050510 — empty for text. "
        "Portrait 2:3. NO text, NO people, NO borders.",

    "zaklady-sedmi-caker-anatomie":
        "Breathtaking 3D CGI mystical scene: seven glowing chakra orbs stacked in a column, "
        "each a perfect sphere in its sacred color with lotus petal engravings, "
        "golden energy serpent spiraling up through all seven — Kundalini rising — deep navy background (#050510). "
        "COMPOSITION: object centered in TOP 60%, bottom 40% fades to deep dark #050510 — empty for text. "
        "Portrait 2:3. NO text, NO people, NO borders.",

    "tajemstvi-kristalove-koule-scrying":
        "Breathtaking 3D CGI mystical scene: a flawless crystal ball containing a swirling galaxy within, "
        "purple and gold nebula visible inside the sphere, "
        "golden scrying symbols etched on the outer surface, ancient mystical stand, deep navy background (#050510). "
        "COMPOSITION: object centered in TOP 60%, bottom 40% fades to deep dark #050510 — empty for text. "
        "Portrait 2:3. NO text, NO people, NO borders.",

    "tajemstvi-snilku-jak-rozklivovat-nocni-vzazy":
        "Breathtaking 3D CGI mystical scene: a luminous dreamcatcher woven from silver moonlight threads, "
        "cosmic visions and symbols caught in its web — stars, crescent, eye — "
        "delicate crystal feathers hanging below, silver mist, deep navy background (#050510). "
        "COMPOSITION: object centered in TOP 60%, bottom 40% fades to deep dark #050510 — empty for text. "
        "Portrait 2:3. NO text, NO people, NO borders.",

    "znameni-zverokruhu-a-penize":
        "Breathtaking 3D CGI mystical scene: a golden zodiac wheel with twelve signs, "
        "golden coins orbiting around it at different distances — some signs showered in gold, others sparse — "
        "rich warm gold and deep purple palette, deep navy background (#050510). "
        "COMPOSITION: object centered in TOP 60%, bottom 40% fades to deep dark #050510 — empty for text. "
        "Portrait 2:3. NO text, NO people, NO borders.",

    "skryty-kod-biorytmu-energeticke-cykly":
        "Breathtaking 3D CGI mystical scene: three glowing sine wave cycles in physical, emotional and intellectual colors — "
        "red, blue, gold — flowing through cosmic space, "
        "their intersection point marked with a bright white flash, deep navy background (#050510). "
        "COMPOSITION: object centered in TOP 60%, bottom 40% fades to deep dark #050510 — empty for text. "
        "Portrait 2:3. NO text, NO people, NO borders.",

    "biorytmy-proc-se-vam-nedari":
        "Breathtaking 3D CGI mystical scene: three biorhythm wave cycles crossing at a critical zero-point, "
        "the intersection glowing in warning amber, energy fragments scattering at the cross, "
        "cosmic graph aesthetic, deep navy background (#050510). "
        "COMPOSITION: object centered in TOP 60%, bottom 40% fades to deep dark #050510 — empty for text. "
        "Portrait 2:3. NO text, NO people, NO borders.",

    "vidite-vsude-1111-poselstvi-andelu":
        "Breathtaking 3D CGI mystical scene: a large angelic wing made of golden-white feathers and light, "
        "four pillars of divine light behind it forming the pattern of 1111, "
        "heavenly radiance, sacred geometry circles, deep navy background (#050510). "
        "COMPOSITION: object centered in TOP 60%, bottom 40% fades to deep dark #050510 — empty for text. "
        "Portrait 2:3. NO text, NO people, NO borders.",

    "lekce-padajici-veze-tarot":
        "Breathtaking 3D CGI mystical scene: a stone tower struck by a cosmic lightning bolt from above, "
        "its crown exploding into golden light and stardust rather than destruction — liberation energy, "
        "the tower made of ancient carved stone, electric sky, deep navy background (#050510). "
        "COMPOSITION: object centered in TOP 60%, bottom 40% fades to deep dark #050510 — empty for text. "
        "Portrait 2:3. NO text, NO people, NO borders.",

    "pruvodce-energie-ochrana":
        "Breathtaking 3D CGI mystical scene: a luminous amethyst crystal sphere surrounded by a protective "
        "golden energy shield — translucent hexagonal barrier — "
        "dark shadowy tendrils bouncing off the shield, inner glow intensifying, deep navy background (#050510). "
        "COMPOSITION: object centered in TOP 60%, bottom 40% fades to deep dark #050510 — empty for text. "
        "Portrait 2:3. NO text, NO people, NO borders.",

    "zatmeni-slunce-a-mesice-2026":
        "Breathtaking 3D CGI mystical scene: a total solar eclipse — moon perfectly aligned over the sun — "
        "diamond ring corona effect blazing in gold and white, solar prominence arcs, "
        "cosmic significance radiating outward, deep navy background (#050510). "
        "COMPOSITION: object centered in TOP 60%, bottom 40% fades to deep dark #050510 — empty for text. "
        "Portrait 2:3. NO text, NO people, NO borders.",

    "panna-a-beran-partnerska-shoda":
        "Breathtaking 3D CGI mystical scene: a golden ram's horns symbol and a detailed wheat sheaf "
        "facing each other across a charged energy divide, fire energy vs. earth energy, "
        "dynamic tension between the two symbols, deep navy background (#050510). "
        "COMPOSITION: object centered in TOP 60%, bottom 40% fades to deep dark #050510 — empty for text. "
        "Portrait 2:3. NO text, NO people, NO borders.",

    "retrogradni-merkur-pruvodce":
        "Breathtaking 3D CGI mystical scene: the planet Mercury in liquid silver, "
        "communication symbols — envelopes, lightning bolts — orbiting backward in a reverse spiral, "
        "chaotic sparks and static energy, mercury-silver palette, deep navy background (#050510). "
        "COMPOSITION: object centered in TOP 60%, bottom 40% fades to deep dark #050510 — empty for text. "
        "Portrait 2:3. NO text, NO people, NO borders.",

    "zakon-pritazlivosti-chyby":
        "Breathtaking 3D CGI mystical scene: a golden magnet radiating law-of-attraction energy, "
        "luminous gold and abundance symbols flowing toward it — coins, stars, hearts — "
        "but three energy leaks shown as shadowy cracks blocking the flow, deep navy background (#050510). "
        "COMPOSITION: object centered in TOP 60%, bottom 40% fades to deep dark #050510 — empty for text. "
        "Portrait 2:3. NO text, NO people, NO borders.",

    "vyklad-tarotu-pro-zacatecniky":
        "Breathtaking 3D CGI mystical scene: three tarot card backs floating in a spread, "
        "ornate deep blue and gold backs with sacred geometry patterns — no faces visible — "
        "golden energy rising from the cards, mystical glow, deep navy background (#050510). "
        "COMPOSITION: object centered in TOP 60%, bottom 40% fades to deep dark #050510 — empty for text. "
        "Portrait 2:3. NO text, NO people, NO borders.",

    "saturuv-navrat-29-rok-zivota":
        "Breathtaking 3D CGI mystical scene: the planet Saturn with its iconic rings made of crystalline gold, "
        "a glowing portal gate in the rings marked with the number 29 in ancient numerals, "
        "karmic energy swirling through the portal, deep navy background (#050510). "
        "COMPOSITION: object centered in TOP 60%, bottom 40% fades to deep dark #050510 — empty for text. "
        "Portrait 2:3. NO text, NO people, NO borders.",

    "karta-hvezda-tarot-vyznam":
        "Breathtaking 3D CGI mystical scene: a radiant eight-pointed star pouring two streams of luminous water "
        "downward, the water transforming into stardust as it falls, "
        "healing blue and gold light, hope and renewal energy, deep navy background (#050510). "
        "COMPOSITION: object centered in TOP 60%, bottom 40% fades to deep dark #050510 — empty for text. "
        "Portrait 2:3. NO text, NO people, NO borders.",

    "uzel-osudu-severni-jizni-uzel":
        "Breathtaking 3D CGI mystical scene: a dragon's head node in gold and a tail node in silver "
        "spiraling around each other like a cosmic DNA strand, "
        "karmic past and future energies encoded in the spiral, deep navy background (#050510). "
        "COMPOSITION: object centered in TOP 60%, bottom 40% fades to deep dark #050510 — empty for text. "
        "Portrait 2:3. NO text, NO people, NO borders.",

    "osobni-rok-numerologie-2026":
        "Breathtaking 3D CGI mystical scene: a glowing nine-cycle numerological wheel for the year 2026, "
        "each year number 1-9 as a luminous gemstone in a ring, the current cycle highlighted in gold, "
        "time and cycles concept, deep navy background (#050510). "
        "COMPOSITION: object centered in TOP 60%, bottom 40% fades to deep dark #050510 — empty for text. "
        "Portrait 2:3. NO text, NO people, NO borders.",

    "karta-mesic-tarot-vyznam":
        "Breathtaking 3D CGI mystical scene: a full moon reflected in dark waters below, "
        "a crayfish made of crystal emerging from the depths, "
        "twin towers of moonstone on either side, illusion and mystery atmosphere, deep navy background (#050510). "
        "COMPOSITION: object centered in TOP 60%, bottom 40% fades to deep dark #050510 — empty for text. "
        "Portrait 2:3. NO text, NO people, NO borders.",

    "attachment-styly-vzorce-ve-vztazich":
        "Breathtaking 3D CGI mystical scene: four glowing bond patterns — secure golden circle, "
        "anxious clinging vine, avoidant wall, disorganized chaos — "
        "arranged around a central heart light, relationship psychology visualized cosmically, deep navy background (#050510). "
        "COMPOSITION: object centered in TOP 60%, bottom 40% fades to deep dark #050510 — empty for text. "
        "Portrait 2:3. NO text, NO people, NO borders.",

    "letani-ve-snu-vyznam":
        "Breathtaking 3D CGI mystical scene: a pair of luminous golden wings made of light and stardust, "
        "soaring through a cosmic dreamscape of nebula clouds, "
        "freedom energy radiating outward, silver and gold dreamlight, deep navy background (#050510). "
        "COMPOSITION: object centered in TOP 60%, bottom 40% fades to deep dark #050510 — empty for text. "
        "Portrait 2:3. NO text, NO people, NO borders.",

    "feng-shui-doma-energie-penizy-laska":
        "Breathtaking 3D CGI mystical scene: a glowing bagua octagon made of jade and gold, "
        "each sector radiating its elemental energy — coins, roses, water, wood — "
        "harmonious flow of energy connecting all sections, deep navy background (#050510). "
        "COMPOSITION: object centered in TOP 60%, bottom 40% fades to deep dark #050510 — empty for text. "
        "Portrait 2:3. NO text, NO people, NO borders.",

    "karta-slunce-tarot-vyznam":
        "Breathtaking 3D CGI mystical scene: a magnificent golden sun with face-like engravings on its disc, "
        "radiant light rays extending outward in all directions, warm golden flowers blooming at the base, "
        "joyful victory energy, rich warm gold palette, deep navy background (#050510). "
        "COMPOSITION: object centered in TOP 60%, bottom 40% fades to deep dark #050510 — empty for text. "
        "Portrait 2:3. NO text, NO people, NO borders.",

    "mistrovska-cisla-numerologie":
        "Breathtaking 3D CGI mystical scene: three master number pillars of sacred golden light, "
        "double-digit power visually doubled in intensity, "
        "sacred geometry crowns above each pillar, deep navy background (#050510). "
        "COMPOSITION: object centered in TOP 60%, bottom 40% fades to deep dark #050510 — empty for text. "
        "Portrait 2:3. NO text, NO people, NO borders.",

    "jak-se-pripravit-na-uplnek":
        "Breathtaking 3D CGI mystical scene: a glowing full moon with a ritual crystal grid arranged below it, "
        "moonstone, selenite and clear quartz crystals radiating moonlight, "
        "silver lunar energy descending, preparation and magic, deep navy background (#050510). "
        "COMPOSITION: object centered in TOP 60%, bottom 40% fades to deep dark #050510 — empty for text. "
        "Portrait 2:3. NO text, NO people, NO borders.",

    "andelska-cisla-333-444-555":
        "Breathtaking 3D CGI mystical scene: three groups of angelic light pillars — "
        "three, four, and five tall beams of divine light — arranged left to right, "
        "each group a different ethereal color, angel feathers floating between, deep navy background (#050510). "
        "COMPOSITION: object centered in TOP 60%, bottom 40% fades to deep dark #050510 — empty for text. "
        "Portrait 2:3. NO text, NO people, NO borders.",

    "jak-cist-natalni-kartu-pruvodce":
        "Breathtaking 3D CGI mystical scene: a detailed natal chart wheel in gold and silver, "
        "all twelve houses glowing with their planetary rulers, aspect lines connecting planets in sacred geometry, "
        "the center glowing with personal energy, deep navy background (#050510). "
        "COMPOSITION: object centered in TOP 60%, bottom 40% fades to deep dark #050510 — empty for text. "
        "Portrait 2:3. NO text, NO people, NO borders.",

    "lilith-v-natalni-karte":
        "Breathtaking 3D CGI mystical scene: the Black Moon Lilith symbol — a crescent with a cross below — "
        "made of obsidian and dark amethyst, glowing with rebellious dark purple energy, "
        "shadowy feminine power radiating outward, deep navy background (#050510). "
        "COMPOSITION: object centered in TOP 60%, bottom 40% fades to deep dark #050510 — empty for text. "
        "Portrait 2:3. NO text, NO people, NO borders.",

    "runovy-vyklad-doma-pruvodce":
        "Breathtaking 3D CGI mystical scene: nine glowing rune stones scattered in a casting spread, "
        "each stone made of dark wood with luminous amber rune symbols, "
        "mystical reading light falling on the stones, ancient and earthy, deep navy background (#050510). "
        "COMPOSITION: object centered in TOP 60%, bottom 40% fades to deep dark #050510 — empty for text. "
        "Portrait 2:3. NO text, NO people, NO borders.",

    "pluto-ve-vodnari-2024-2043":
        "Breathtaking 3D CGI mystical scene: the planet Pluto made of dark crystal and ice, "
        "Aquarius water-bearer waves transforming its surface — old structures dissolving, new forms emerging — "
        "generational transformation energy, dark violet and electric teal, deep navy background (#050510). "
        "COMPOSITION: object centered in TOP 60%, bottom 40% fades to deep dark #050510 — empty for text. "
        "Portrait 2:3. NO text, NO people, NO borders.",

    "mesicni-znak-natalni-karta":
        "Breathtaking 3D CGI mystical scene: a silver crescent moon nested inside a glowing zodiac ring, "
        "emotional waters rippling below the moon symbol, twelve zodiac glyphs on the ring, "
        "the moon's glow reflecting inward into the soul, deep navy background (#050510). "
        "COMPOSITION: object centered in TOP 60%, bottom 40% fades to deep dark #050510 — empty for text. "
        "Portrait 2:3. NO text, NO people, NO borders.",

    "cinsky-horoskop-2026-rok-ohniveho-kone":
        "Breathtaking 3D CGI mystical scene: a fire horse made of pure flame and golden energy, "
        "Chinese decorative style with red and gold lacquer aesthetic, "
        "fire sparks and Eastern mystical symbols orbiting it, deep navy background (#050510). "
        "COMPOSITION: object centered in TOP 60%, bottom 40% fades to deep dark #050510 — empty for text. "
        "Portrait 2:3. NO text, NO people, NO borders.",

    "jak-funguji-andelske-karty":
        "Breathtaking 3D CGI mystical scene: three ornate angel card backs floating face-down in soft light, "
        "divine golden halos glowing above each card, angelic white feathers drifting around them, "
        "heavenly soft light and gold palette, deep navy background (#050510). "
        "COMPOSITION: object centered in TOP 60%, bottom 40% fades to deep dark #050510 — empty for text. "
        "Portrait 2:3. NO text, NO people, NO borders.",

    "co-je-aura-jak-ji-videt-cist-cistit":
        "Breathtaking 3D CGI mystical scene: a luminous human aura energy field — without a body — "
        "shown as seven concentric oval layers of colored light, "
        "each layer a different frequency from red to violet, energy field visualization, deep navy background (#050510). "
        "COMPOSITION: object centered in TOP 60%, bottom 40% fades to deep dark #050510 — empty for text. "
        "Portrait 2:3. NO text, NO people, NO borders.",
}


# ─────────────────────────────────────────────────────────────────
# Pinterest hook titulky
# ─────────────────────────────────────────────────────────────────

PINTEREST_HOOKS = {
    "chiron-raneny-lecitel-natalni-karta":
        "TVÁ NEJHLUBŠÍ RANA: Je také tvůj největší dar — Chiron v natální kartě ti to ukáže",
    "ctyri-zivly-astrologie-ohen-zeme-vzduch-voda":
        "KTERÝ ŽIVEL JSI: Oheň, Země, Vzduch nebo Voda — tvůj horoskop to prozradí",
    "pentagramy-tarot-penize-kariera": [
        "PENÍZE A TAROT: Co ti karty říkají — o kariéře a hojnosti",
        "TAROT A KARIÉRA: Pentagramy odhalí, co ti brání v hojnosti",
    ],
    "hulkove-karty-tarot-vyznam":
        "OHEŇ V KARTÁCH: Hůlky ti prozradí, kde v tobě hoří vůle i vášeň",
    "numerologie-jmena-krizni-jmeno": [
        "TVOJE JMÉNO: Skrývá vibrace — zjisti, co tvoje jméno o tobě prozrazuje",
        "KŘÍŽNÍ JMÉNO: Proč záleží na každém písmenu tvého jména",
    ],
    "cakrove-leceni-navod":
        "BLOKOVANÉ ČAKRY: Praktický návod, jak je otevřít a znovu nechat proudit energii",
    "novy-mesic-ritual-zacatecnici":
        "NOVÝ MĚSÍC: Nejsilnější chvíle pro záměry — rituál pro začátečníky bez balastu",
    "karta-soudce-tarot-vyznam":
        "KARTA SOUDCE: Volání tvého vyššího já — karmická bilance přichází",
    "numerologie-kompatibilita-partneru":
        "VAŠE ČÍSLA LÁSKY: Jsou čísla osudu ve shodě, nebo v konfliktu?",
    "mecove-karty-tarot-vyznam":
        "MEČE V TAROTU: Nejobávanější suit přináší osvobozující pravdu — přijmi ji",
    "keltsky-kriz-tarot-rozlozeni":
        "KELTSKÝ KŘÍŽ: Jak číst nejslavnější tarotové rozložení krok za krokem",
    "shamansko-kolo-totemove-zvire":
        "TVOJE TOTEMOVÉ ZVÍŘE: Šamanské kolo odhalí, kdo tě chrání na životní cestě",
    "retrograde-venus-2026-co-cekat-v-lasce":
        "VENUŠE RETRO 2026: Co čekat v lásce, vztazích a financích — pro každé znamení",
    "uplnek-v-panne-ritual-a-vyklad-pro-kazde-znameni":
        "ÚPLNĚK V PANNĚ: Rituál a výklad pro každé znamení — využij tuto lunaci naplno",
    "uplnek-v-kozorohovi-ritual-a-vyznam":
        "ÚPLNĚK V KOZOROHU: Čas sklizně ambicí a uvolnění strachu z neúspěchu",
    "merkur-v-retrograde-co-to-znamena-pro-vase-znameni":
        "MERKUR RETRO: Co to skutečně znamená pro každé ze 12 znamení zvěrokruhu",
    "proc-vam-to-v-lasce-nevyhcazi":
        "PROČ TI TO V LÁSCE NEVYCHÁZÍ: Karmický vztah, nebo spřízněná duše?",
    "zivotni-cislo-odhaleni-kodu-vasi-duse":
        "ŽIVOTNÍ ČÍSLO: Starověký klíč k tvé karmě a skrytému potenciálu duše",
    "rozpoznejte-svou-astrologickou-signaturu":
        "TVOJE VELKÁ TROJKA: Slunce, Měsíc a Ascendent — tři klíče k sobě samé",
    "tajemstvi-12-astrologickych-domu":
        "12 ASTROLOGICKÝCH DOMŮ: Skrytá tajemství, která mění čtení horoskopu navždy",
    "stir-muz-a-panna-zena-kompatibilita":
        "ŠTÍR + PANNA: Jeden z nejsilnějších párů — nebo tichá katastrofa ve vztahu?",
    "runy-severska-magie-v-modernim-svete":
        "RUNY: Severská magie není pro slabé — syrová pravda starých symbolů",
    "co-je-synastrie-jak-funguje-partnerska-astrologie":
        "SYNASTRIE: Jak astrologie odhalí, co ve vašem vztahu skutečně funguje",
    "andelska-cisla-1111":
        "VIDÍŠ 11:11: Ztrácíš rozum, nebo s tebou promlouvá vesmír?",
    "5-znaku-ze-potkavate-svou-spriznenou-dusi":
        "5 ZNAMENÍ: Právě jsi potkal svou spřízněnou duši — poznáš to?",
    "jak-zjistit-sve-logo-a-sestici-v-numerologii":
        "3 ČÍSLA TVÉ DUŠE: Číslo Výrazu, Duše a Osobnosti — co o tobě prozrazují",
    "iluze-spriznene-duse-karmicke-vztahy":
        "ILUZE SPŘÍZNĚNÉ DUŠE: Proč nás tytéž vztahy chronicky stahují ke dnu",
    "co-znamenaji-pohary-v-tarotu":
        "POHÁRY V TAROTU: Skrytý svět emocí, lásky a intuice ve vodním živlu",
    "psychologie-snu-stici-stromy":
        "VYPADANÉ ZUBY VE SNE: Co se ti snaží říct tvoje stínové podvědomí?",
    "ascendent-vs-slunecni-znameni-jaky-je-rozdil":
        "ASCENDENT VS. SLUNCE: Proč se někdy nevztahuješ ke svému znamení?",
    "zaklady-sedmi-caker-anatomie":
        "7 ČAKER: Anatomie neviditelného energetického těla — kompletní průvodce",
    "tajemstvi-kristalove-koule-scrying":
        "KŘIŠŤÁLOVÁ KOULE: Starověká technika zření, která funguje dodnes",
    "tajemstvi-snilku-jak-rozklivovat-nocni-vzazy":
        "TAJEMSTVÍ SNŮ: Jak dekódovat noční poselství tvého podvědomí",
    "znameni-zverokruhu-a-penize":
        "TVOJE ZNAMENÍ A PENÍZE: Kdo se topí ve zlatě a kdo má průvan v peněžence?",
    "skryty-kod-biorytmu-energeticke-cykly":
        "PROČ MÁŠ ŠPATNÉ DNY: Biorytmy vysvětlují, proč neštěstí nechodí náhodou",
    "biorytmy-proc-se-vam-nedari":
        "KRITICKÝ DEN BIORYTMU: Proč padá všechno z rukou — a jak se připravit",
    "vidite-vsude-1111-poselstvi-andelu":
        "VIDÍŠ VŠUDE 11:11: Andělé ti posílají silné poselství — přečteš ho?",
    "lekce-padajici-veze-tarot":
        "KARTA VĚŽ: Proč kartáři hrabnou, když ji spatří — a co ti skutečně přináší",
    "pruvodce-energie-ochrana":
        "ENERGETIČTÍ UPÍŘI: Jak se zamknout a ochránit svoji životní energii",
    "zatmeni-slunce-a-mesice-2026":
        "ZATMĚNÍ 2026: Urychlovač osudu — jak přežít kosmický chaos a využít ho",
    "panna-a-beran-partnerska-shoda":
        "PANNA + BERAN: Anatomie vztahové katastrofy — proč to na papíře neklapí",
    "retrogradni-merkur-pruvodce":
        "MERKUR RETRO: Ultimátní průvodce přežitím — rozbité telefony, ex v DMs",
    "zakon-pritazlivosti-chyby":
        "ZÁKON PŘITAŽLIVOSTI: 3 fatální chyby, které tě blokují od hojnosti",
    "vyklad-tarotu-pro-zacatecniky":
        "TAROT DOMA: Jak vyložit karty zdarma — manuál pro úplné začátečníky",
    "saturuv-navrat-29-rok-zivota":
        "SATURNŮV NÁVRAT: Proč je 29. rok života zlomový a co ti přinese",
    "karta-hvezda-tarot-vyznam":
        "KARTA HVĚZDA: Naděje a uzdravení po nejtěžších časech — tvůj nový začátek",
    "uzel-osudu-severni-jizni-uzel":
        "UZEL OSUDU: Severní a Jižní uzel odhalí tvoji karmickou misi v tomto životě",
    "osobni-rok-numerologie-2026":
        "TVŮJ OSOBNÍ ROK 2026: Co ti numerologie předpovídá — vypočítej si ho",
    "karta-mesic-tarot-vyznam":
        "KARTA MĚSÍC: Iluze a podvědomí — jak projít mlžným územím bez ztráty sebe",
    "attachment-styly-vzorce-ve-vztazich":
        "PROČ PŘITAHUJEŠ STÁLE STEJNÉ: Attachment styly a skryté vztahové vzorce",
    "letani-ve-snu-vyznam":
        "LÉTÁNÍ VE SNE: Nejkrásnější sen má konkrétní poselství — znáš ho?",
    "feng-shui-doma-energie-penizy-laska":
        "FENG SHUI DOMA: Jak upravit prostor pro příliš energie, lásky a peněz",
    "karta-slunce-tarot-vyznam":
        "KARTA SLUNCE: Symbol radosti a vítězství — jak přivolat její zlatou energii",
    "mistrovska-cisla-numerologie":
        "11, 22, 33: Mistrovská čísla v numerologii — dar, nebo prokletí?",
    "jak-se-pripravit-na-uplnek":
        "ÚPLNĚK SE BLÍŽÍ: Jak se připravit a využít naplno jeho silnou energii",
    "andelska-cisla-333-444-555":
        "333, 444, 555: Co ti vesmír opakovaně posílá — přečteš svoji zprávu?",
    "jak-cist-natalni-kartu-pruvodce":
        "NATÁLNÍ KARTA: Kompletní průvodce čtením — i pro úplné začátečníky",
    "lilith-v-natalni-karte":
        "LILITH V KARTĚ: Temná bohyně a tvůj skrytý rebel — kde v tobě žije",
    "runovy-vyklad-doma-pruvodce":
        "RUNOVÝ VÝKLAD: Průvodce pro začátečníky — od výběru run po interpretaci",
    "pluto-ve-vodnari-2024-2043":
        "PLUTO VE VODNÁŘI: Největší generační transformace za 248 let — co to znamená pro tebe",
    "mesicni-znak-natalni-karta":
        "TVŮJ MĚSÍČNÍ ZNAK: Co Měsíc v natální kartě říká o tvé duši a emocích",
    "cinsky-horoskop-2026-rok-ohniveho-kone":
        "ROK OHNIVÉHO KONĚ 2026: Co čeká každé čínské zvíře — přečteš svůj osud",
    "jak-funguji-andelske-karty":
        "ANDĚLSKÉ KARTY: Jak fungují a jak s nimi pracovat — průvodce pro začátečníky",
    "co-je-aura-jak-ji-videt-cist-cistit":
        "TVOJE AURA: Jak ji vidět, číst barvy a čistit pro více energie a ochrany",
}


def _load_log() -> dict:
    if LOG_PATH.exists():
        return json.loads(LOG_PATH.read_text(encoding="utf-8"))
    return {"published": [], "pending": [], "stats": {}}


def _load_posts() -> list:
    return json.loads(BLOG_INDEX.read_text(encoding="utf-8"))


def _find_inbox_image(slug: str):
    for ext in (".png", ".jpg", ".jpeg", ".webp"):
        p = INBOX_DIR / f"{slug}{ext}"
        if p.exists():
            return p
    return None


def cmd_list(posts):
    log = _load_log()
    published = {e["slug"] for e in log.get("published", [])}
    print(f"\n{'IDX':>4}  {'SLUG':<55} {'STATUS'}")
    print("-" * 75)
    for i, p in enumerate(posts):
        slug = p["slug"]
        status = "OK hotovo" if slug in published else "-- ceka"
        inbox  = "[v inbox]" if _find_inbox_image(slug) else ""
        print(f"{i:>4}  {slug:<55} {status} {inbox}")


def cmd_prompt(post):
    slug   = post["slug"]
    hook   = PINTEREST_HOOKS.get(slug, post["title"])
    prompt = IMAGE_PROMPTS.get(slug, "")
    print(f"\n{'='*60}")
    print(f"POST:   {post['title'][:70]}")
    print(f"HOOK:   {hook}")
    print(f"\nIMAGE PROMPT:\n{'-'*50}")
    print(prompt)
    print(f"{'-'*50}")
    print(f"\nUloz obrazek jako:")
    print(f"   {INBOX_DIR / f'{slug}.png'}")
    print(f"\nPak spust znovu stejny prikaz pro compositor.")


def cmd_composite(post):
    slug     = post["slug"]
    img_path = _find_inbox_image(slug)
    if not img_path:
        print(f"\nObrazek nenalezen v inbox: {INBOX_DIR / f'{slug}.png'}")
        print("   Nejpriv vygeneruj obrazek a uloz ho do inbox/")
        return None

    hook      = PINTEREST_HOOKS.get(slug, post["title"])
    category  = post.get("category", "")
    out_path  = OUTPUT_DIR / f"{slug}_pin.jpg"

    print(f"\nCompositor: {slug}")
    composite_pin(
        bg_image_path=img_path,
        title=hook,
        category=category,
        url="mystickahvezda.cz",
        output_path=out_path,
    )
    print(f"Ulozeno: {out_path}")
    return out_path


def main():
    parser = argparse.ArgumentParser(description="Pinterest Pin Maker")
    parser.add_argument("--index",  type=int,  default=None)
    parser.add_argument("--slug",   type=str,  default=None)
    parser.add_argument("--list",   action="store_true", help="Vypise vsechny posty")
    parser.add_argument("--prompt-only", action="store_true", help="Jen vypise prompt")
    args = parser.parse_args()

    posts = _load_posts()

    if args.list:
        cmd_list(posts)
        return

    if args.slug:
        post = next((p for p in posts if p["slug"] == args.slug), None)
        if not post:
            print(f"Slug '{args.slug}' nenalezen.")
            sys.exit(1)
    elif args.index is not None:
        post = posts[args.index]
    else:
        log = _load_log()
        published = {e["slug"] for e in log.get("published", [])}
        post = next((p for p in posts if p["slug"] not in published), posts[0])

    if args.prompt_only or not _find_inbox_image(post["slug"]):
        cmd_prompt(post)
    else:
        cmd_composite(post)


if __name__ == "__main__":
    main()
