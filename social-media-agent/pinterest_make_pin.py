"""
Pinterest Pin Maker — Gemini Image Generation
=============================================
Vygeneruje 1 Pinterest pin:
  1. Gemini -> krásný background obrázek
  2. Compositor -> text overlay (titulek, badge, URL)
  3. Uloží finální pin jako JPEG

Použití:
    python pinterest_make_pin.py                    # první post z blogu
    python pinterest_make_pin.py --index 3          # 4. post (0-based)
    python pinterest_make_pin.py --slug "merkur-v-retrograde-..."
"""

import argparse
import json
import os
import sys
import re
from pathlib import Path

# Fix Windows console encoding
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

sys.path.append(os.path.dirname(__file__))
import config
from pinterest_compositor import composite_pin

OUTPUT_DIR = Path(__file__).parent / "output" / "pinterest" / "images"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

BLOG_INDEX = Path("C:/Users/pavel/OneDrive/Desktop/MystickaHvezda/.claude/worktrees/magical-jepsen/data/blog-index.json")


# ─────────────────────────────────────────────
# Prompt builder — jeden prompt per kategorie
# ─────────────────────────────────────────────

CATEGORY_PROMPTS = {
    "Astrologie": """\
Breathtaking 3D CGI mystical scene: a golden celestial sphere engraved with intricate zodiac \
constellation maps, floating weightlessly in deep space. \
Fine gold filigree star charts etched on its surface, \
soft violet and blue nebula clouds swirling around it, \
thousands of tiny stars scattered in the cosmic background. \
Deep navy background (#050510), dramatic rim lighting in gold and deep purple. \
COMPOSITION: subject centered in the TOP 60% of the frame, \
bottom 40% is deep dark space gradually fading to near-black #050510 — intentionally empty for text overlay. \
COMPOSITION: subject centered in the TOP 60% of the frame, \
bottom 40% is deep dark space gradually fading to near-black #050510 — intentionally empty for text overlay. \
Photorealistic, ultra-high detail, cinematic, 8K quality. \
Portrait orientation 2:3. NO text, NO letters, NO people, NO borders, NO frames.\
""",

    "Tarot": """\
Breathtaking 3D CGI mystical scene: ornate ancient tarot card arcana symbol — \
a glowing Eye of Providence inside a golden triangle, surrounded by floating sacred geometry shapes. \
Rich gold and deep purple palette, fine ornamental engravings, \
soft candlelight glow emanating from the symbol, \
cosmic starfield background deep navy (#050510), wisps of silver magical smoke. \
COMPOSITION: subject centered in the TOP 60% of the frame, \
bottom 40% is deep dark space gradually fading to near-black #050510 — intentionally empty for text overlay. \
Photorealistic, ultra-high detail, cinematic, 8K quality. \
Portrait orientation 2:3. NO text, NO letters, NO people, NO borders, NO frames.\
""",

    "Numerologie": """\
Breathtaking 3D CGI mystical scene: glowing golden sacred geometry — \
a Fibonacci spiral made of liquid gold light, \
surrounded by floating luminous numerals dissolving into stardust. \
Deep navy cosmic background (#050510), \
warm golden light radiating from the spiral center, \
fine geometric grid lines in soft violet, scattered stars. \
COMPOSITION: subject centered in the TOP 60% of the frame, \
bottom 40% is deep dark space gradually fading to near-black #050510 — intentionally empty for text overlay. \
Photorealistic, ultra-high detail, cinematic, 8K quality. \
Portrait orientation 2:3. NO text, NO letters, NO people, NO borders, NO frames.\
""",

    "Spiritualita": """\
Breathtaking 3D CGI mystical scene: a levitating lotus flower made of luminous amethyst crystal, \
seven glowing chakra orbs of light rising upward from its center in a column of energy. \
Violet, indigo and white light rays, deep navy cosmic background (#050510), \
golden sacred geometry patterns shimmering in the background, soft ethereal mist. \
COMPOSITION: subject centered in the TOP 60% of the frame, \
bottom 40% is deep dark space gradually fading to near-black #050510 — intentionally empty for text overlay. \
Photorealistic, ultra-high detail, cinematic, 8K quality. \
Portrait orientation 2:3. NO text, NO letters, NO people, NO borders, NO frames.\
""",

    "Lunární Magie": """\
Breathtaking 3D CGI mystical scene: a magnificent crescent moon made of polished silver crystal, \
glowing from within with warm moonlight, \
surrounded by a ring of golden lunar phase symbols (new moon to full moon arc), \
thousands of tiny stars and silver dust particles floating around it. \
Deep navy background (#050510), soft silver and lavender light. \
COMPOSITION: subject centered in the TOP 60% of the frame, \
bottom 40% is deep dark space gradually fading to near-black #050510 — intentionally empty for text overlay. \
Photorealistic, ultra-high detail, cinematic, 8K quality. \
Portrait orientation 2:3. NO text, NO letters, NO people, NO borders, NO frames.\
""",

    "Vztahy": """\
Breathtaking 3D CGI mystical scene: two intertwined golden infinity symbols \
forming a glowing cosmic knot of light, surrounded by rose gold stardust. \
Warm rose gold and deep violet color palette, \
zodiac compatibility symbols faintly visible in the background nebula, \
deep navy background (#050510), soft dreamy bokeh of stars. \
COMPOSITION: subject centered in the TOP 60% of the frame, \
bottom 40% is deep dark space gradually fading to near-black #050510 — intentionally empty for text overlay. \
Photorealistic, ultra-high detail, cinematic, 8K quality. \
Portrait orientation 2:3. NO text, NO letters, NO people, NO borders, NO frames.\
""",

    "Šamanismus": """\
Breathtaking 3D CGI mystical scene: ancient Viking runic stone floating in space, \
glowing amber and gold runes carved deeply into dark obsidian rock surface, \
magical light emanating from each rune symbol, \
earthy deep purple and amber tones, deep navy background (#050510), \
particles of golden light and cosmic dust swirling around the stone. \
COMPOSITION: subject centered in the TOP 60% of the frame, \
bottom 40% is deep dark space gradually fading to near-black #050510 — intentionally empty for text overlay. \
Photorealistic, ultra-high detail, cinematic, 8K quality. \
Portrait orientation 2:3. NO text, NO letters, NO people, NO borders, NO frames.\
""",

    "Sny": """\
Breathtaking 3D CGI mystical scene: a luminous dreamcatcher woven from silver moonlight threads, \
floating weightlessly in deep space. \
Delicate feathers made of crystallized starlight hanging below, \
surreal silver mist and moonbeams passing through the web, \
deep navy background (#050510), soft blue and silver ethereal glow. \
COMPOSITION: subject centered in the TOP 60% of the frame, \
bottom 40% is deep dark space gradually fading to near-black #050510 — intentionally empty for text overlay. \
Photorealistic, ultra-high detail, cinematic, 8K quality. \
Portrait orientation 2:3. NO text, NO letters, NO people, NO borders, NO frames.\
""",
}

DEFAULT_PROMPT = """\
Breathtaking 3D CGI mystical scene: a glowing crystal orb of deep amethyst floating in deep space, \
intricate gold filigree sacred geometry patterns on its surface, \
soft violet and gold light radiating from within, \
cosmic starfield background deep navy (#050510), \
particles of golden stardust swirling around the orb. \
COMPOSITION: subject centered in the TOP 60% of the frame, \
bottom 40% is deep dark space gradually fading to near-black #050510 — intentionally empty for text overlay. \
Photorealistic, ultra-high detail, cinematic, 8K quality. \
Portrait orientation 2:3. NO text, NO letters, NO people, NO borders, NO frames.\
"""


# ─────────────────────────────────────────────
# Pinterest hook titulky — emotivní, scroll-stopping
# Formát: "HOOK: Subtitle — Detail" nebo jen "HOOK: Subtitle"
# Compositor zpracuje přes _parse_title()
# ─────────────────────────────────────────────

PINTEREST_HOOKS = {
    "chiron-raneny-lecitel-natalni-karta":
        "TVÁ NEJHLUBŠÍ RÁNA: Je také tvůj největší dar — Chiron v natální kartě ti to ukáže",
    "ctyri-zivly-astrologie-ohen-zeme-vzduch-voda":
        "KTERÝ ŽIVEL JSI: Oheň, Země, Vzduch nebo Voda — tvůj horoskop to prozradí",
    "pentagramy-tarot-penize-kariera":
        "PENÍZE A TAROT: Co ti karty říkají o kariéře a hojnosti",
    "hulkove-karty-tarot-vyznam":
        "OHEŇ V KARTÁCH: Hůlky ti prozradí, kde v tobě hoří vůle i vášeň",
    "numerologie-jmena-krizni-jmeno":
        "TVOJE JMÉNO: Vibruje na konkrétní frekvenci — zjisti co to o tobě prozrazuje",
    "cakrove-leceni-navod":
        "BLOKOVANÉ ČAKRY: Praktický návod jak je otevřít a znovu nechat proudit energii",
    "novy-mesic-ritual-zacatecnici":
        "NOVÝ MĚSÍC: Nejsilnější chvíle pro záměry — rituál pro začátečníky bez balastu",
    "karta-soudce-tarot-vyznam":
        "KARTA SOUDCE: Volání tvého vyššího já — karmická bilance přichází",
    "numerologie-kompatibilita-partneru":
        "VAŠE ČÍSLA LÁSKY: Jsou čísla osudu ve shodě nebo v konfliktu?",
    "mecove-karty-tarot-vyznam":
        "MEČE V TAROTU: Nejobávanější suit přináší osvobozující pravdu — přijmi ji",
    "keltsky-kriz-tarot-rozlozeni":
        "KELTSKÝ KŘÍŽ: Jak číst nejslavnější tarotové rozložení krok za krokem",
    "shamansko-kolo-totemove-zvire":
        "TVOJE TOTEMOVÉ ZVÍŘE: Šamanské Kolo odhalí, kdo tě chrání na životní cestě",
    "retrograde-venus-2026-co-cekat-v-lasce":
        "VENUŠE RETRO 2026: Co čekat v lásce, vztazích a financích — pro každé znamení",
    "uplnek-v-panne-ritual-a-vyklad-pro-kazde-znameni":
        "ÚPLNĚK V PANNĚ: Rituál a výklad pro každé znamení — využij tuto lunaci naplno",
    "uplnek-v-kozorohovi-ritual-a-vyznam":
        "ÚPLNĚK V KOZOROHU: Čas sklizně ambicí a uvolnění strachu z neúspěchu",
    "merkur-v-retrograde-co-to-znamena-pro-vase-znameni":
        "MERKUR RETRO: Co to skutečně znamená pro každé ze 12 znamení zvěrokruhu",
    "proc-vam-to-v-lasce-nevyhcazi":
        "PROČ TI TO V LÁSCE NEVYCHÁZÍ: Karmický vztah nebo spřízněná duše?",
    "zivotni-cislo-odhaleni-kodu-vasi-duse":
        "ŽIVOTNÍ ČÍSLO: Starověký klíč k tvé karmě a skrytému potenciálu duše",
    "rozpoznejte-svou-astrologickou-signaturu":
        "TVOJE VELKÁ TROJKA: Slunce, Měsíc a Ascendent — tři klíče k sobě samé",
    "tajemstvi-12-astrologickych-domu":
        "12 ASTROLOGICKÝCH DOMŮ: Skryté tajemství, které mění čtení horoskopu navždy",
    "stir-muz-a-panna-zena-kompatibilita":
        "ŠTÍR + PANNA: Jeden z nejsilnějších párů — nebo tichá katastrofa ve vztahu?",
    "runy-severska-magie-v-modernim-svete":
        "RUNY: Severská magie není pro slabé — syrová pravda starých symbolů",
    "co-je-synastrie-jak-funguje-partnerska-astrologie":
        "SYNASTRIE: Jak astrologie odhalí, co ve vašem vztahu skutečně funguje",
    "andelska-cisla-1111":
        "VIDÍŠ 11:11: Ztrácíš rozum nebo s tebou promlouvá vesmír?",
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
        "VIDÍŠ VŠUDE 1111: Andělé ti posílají silné poselství — přečti si ho",
    "lekce-padajici-veze-tarot":
        "KARTA VĚŽ: Proč kartáři hrábnou, když ji spatří — a co ti skutečně přináší",
    "pruvodce-energie-ochrana":
        "ENERGETIČTÍ UPÍŘI: Jak se zamknout a ochránit svou životní energii",
    "zatmeni-slunce-a-mesice-2026":
        "ZATMĚNÍ 2026: Urychlovač osudu — jak přežít kosmický chaos a využít ho",
    "panna-a-beran-partnerska-shoda":
        "PANNA + BERAN: Anatomie vztahové katastrofy — proč to na papíře neklape",
    "retrogradni-merkur-pruvodce":
        "MERKUR RETRO: Ultimátní průvodce přežitím — rozbité telefony, ex v DMs",
    "zakon-pritazlivosti-chyby":
        "ZÁKON PŘITAŽLIVOSTI: 3 fatální chyby, které tě blokují od hojnosti",
    "vyklad-tarotu-pro-zacatecniky":
        "TAROT DOMA: Jak vyložit karty zadarmo — manuál pro úplné začátečníky",
    "saturuv-navrat-29-rok-zivota":
        "SATURŮV NÁVRAT: Proč je 29. rok života zlomový a co ti přinese",
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
        "FENG SHUI DOMA: Jak upravit prostor pro příliv energie, lásky a peněz",
    "karta-slunce-tarot-vyznam":
        "KARTA SLUNCE: Symbol radosti a vítězství — jak přivolat její zlatou energii",
    "mistrovska-cisla-numerologie":
        "11, 22, 33: Mistrovská čísla v numerologii — dar nebo prokletí?",
    "jak-se-pripravit-na-uplnek":
        "ÚPLNĚK SE BLÍŽÍ: Jak se připravit a využít naplno jeho silnou energii",
    "andelska-cisla-333-444-555":
        "333, 444, 555: Co ti vesmír opakovaně posílá — přečti si svoji zprávu",
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
        "ROK OHNIVÉHO KONĚ 2026: Co čeká každé čínské zvíře — přečti si svůj osud",
    "jak-funguji-andelske-karty":
        "ANDĚLSKÉ KARTY: Jak fungují a jak s nimi pracovat — průvodce pro začátečníky",
    "co-je-aura-jak-ji-videt-cist-cistit":
        "TVOJE AURA: Jak ji vidět, číst barvy a čistit pro více energie a ochrany",
}


def build_prompt(post: dict) -> str:
    category = post.get("category", "")
    return CATEGORY_PROMPTS.get(category, DEFAULT_PROMPT)


# ─────────────────────────────────────────────
# Gemini image generation
# ─────────────────────────────────────────────

def generate_with_gemini(prompt: str, output_path: Path) -> Path:
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=config.GEMINI_API_KEY)

    print(f"\n📡 Volám Gemini ({config.IMAGE_MODEL})...")

    # Zkus Imagen 3 přes generate_images
    try:
        result = client.models.generate_images(
            model=config.IMAGE_MODEL,
            prompt=prompt,
            config={
                "number_of_images": 1,
                "aspect_ratio": "9:16",          # nejblíže 2:3 z dostupných
                "safety_filter_level": "BLOCK_ONLY_HIGH",
                "person_generation": "DONT_ALLOW",
            },
        )
        if result.generated_images:
            img_bytes = result.generated_images[0].image.image_bytes
            output_path.write_bytes(img_bytes)
            print(f"✅ Imagen 3: obrázek uložen ({len(img_bytes)//1024} KB)")
            return output_path
    except Exception as e:
        print(f"⚠️  Imagen 3 selhal: {e}")

    # Fallback: gemini-2.0-flash-preview-image-generation
    print("🔄 Zkouším gemini-2.0-flash-preview-image-generation...")
    try:
        resp = client.models.generate_content(
            model="gemini-2.0-flash-preview-image-generation",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_modalities=["IMAGE"],
            ),
        )
        for part in resp.candidates[0].content.parts:
            if hasattr(part, "inline_data") and part.inline_data:
                img_bytes = part.inline_data.data
                if isinstance(img_bytes, str):
                    import base64
                    img_bytes = base64.b64decode(img_bytes)
                output_path.write_bytes(img_bytes)
                print(f"✅ Gemini Flash Image: uložen ({len(img_bytes)//1024} KB)")
                return output_path
    except Exception as e:
        print(f"❌ Gemini Flash Image selhal: {e}")
        raise RuntimeError("Žádný Gemini model nefungoval — zkontroluj GEMINI_API_KEY v .env")


# ─────────────────────────────────────────────
# Hlavní funkce
# ─────────────────────────────────────────────

def make_pin(post: dict) -> Path:
    slug     = post["slug"]
    title    = post["title"]
    category = post.get("category", "")

    print(f"\n{'='*60}")
    print(f"📌 Generuji pin: {title[:70]}")
    print(f"   Kategorie: {category}")
    print(f"   Slug: {slug}")

    bg_path  = OUTPUT_DIR / f"{slug}_bg.png"
    pin_path = OUTPUT_DIR / f"{slug}_pin.jpg"

    # Pinterest hook titulek (emotivní) místo SEO titulku
    pinterest_title = PINTEREST_HOOKS.get(slug, title)
    if pinterest_title != title:
        print(f"   Hook: {pinterest_title[:70]}")

    # 1) Prompt
    prompt = build_prompt(post)
    print(f"\n🎨 PROMPT (Gemini):\n{'-'*40}\n{prompt}\n{'-'*40}")

    # 2) Vygeneruj background
    generate_with_gemini(prompt, bg_path)

    # 3) Compositor — text overlay
    print("\n🖼️  Přidávám text overlay...")
    composite_pin(
        bg_image_path=bg_path,
        title=pinterest_title,
        category=category,
        url="mystickahvezda.cz",
        output_path=pin_path,
    )

    print(f"\n✅ Finální pin: {pin_path}")
    return pin_path


def main():
    parser = argparse.ArgumentParser(description="Pinterest Pin Maker")
    parser.add_argument("--index", type=int, default=0, help="Index postu v blog-index.json (default: 0)")
    parser.add_argument("--slug",  type=str, default=None, help="Slug konkrétního postu")
    args = parser.parse_args()

    with open(BLOG_INDEX, encoding="utf-8") as f:
        posts = json.load(f)

    if args.slug:
        post = next((p for p in posts if p["slug"] == args.slug), None)
        if not post:
            print(f"❌ Post se slugem '{args.slug}' nenalezen.")
            sys.exit(1)
    else:
        post = posts[args.index]

    pin_path = make_pin(post)

    # Otevři výsledek v prohlížeči
    import subprocess
    subprocess.Popen(["explorer", str(pin_path.parent)])
    print(f"\n📂 Složka otevřena: {pin_path.parent}")


if __name__ == "__main__":
    main()
