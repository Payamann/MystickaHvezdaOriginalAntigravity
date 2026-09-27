"""
Setup skript — nastavení agenta při prvním spuštění
"""
import os
import sys
from getpass import getpass
from pathlib import Path


def main():
    print("🔮 Mystická Hvězda — Social Media Agent Setup")
    print("=" * 50)

    env_path = Path(__file__).parent / ".env"
    env_example = Path(__file__).parent / ".env.example"

    # Vytvoř nebo bezpečně doplň jen chybějící klíče; existující .env zachovej.
    env_path.touch(exist_ok=True)
    env_text = env_path.read_text(encoding="utf-8")
    env_values = {}
    for line in env_text.splitlines():
        stripped = line.strip()
        if stripped and not stripped.startswith("#") and "=" in stripped:
            key, value = stripped.split("=", 1)
            env_values[key.strip()] = value.strip().strip("\"'")

    missing_values = {}
    for key, prompt in (
        ("OPENAI_API_KEY", "OpenAI API klíč pro generování textů"),
        ("GEMINI_API_KEY", "Gemini API klíč pro generování obrázků"),
    ):
        if not env_values.get(key):
            value = getpass(f"{prompt} (vstup je skrytý, Enter přeskočí): ").strip()
            if value:
                missing_values[key] = value

    if missing_values:
        with env_path.open("a", encoding="utf-8") as env_file:
            if env_text and not env_text.endswith("\n"):
                env_file.write("\n")
            env_file.write("\n# Doplněno setup.py\n")
            for key, value in missing_values.items():
                env_file.write(f"{key}={value}\n")
        print(f"✓ Chybějící API klíče doplněny do: {env_path}")
    else:
        print("✓ API klíče už jsou nastavené")

    # Instalace závislostí
    print("\n📦 Instaluji Python závislosti...")
    os.system(f"{sys.executable} -m pip install -r requirements.txt -q")
    print("✓ Závislosti nainstalovány")

    # Test aktuálního textového providera.
    print("\n🧪 Testuju OpenAI API pro generování textů...")
    try:
        from dotenv import load_dotenv
        load_dotenv(env_path)

        openai_key = os.getenv("OPENAI_API_KEY")
        if not openai_key:
            print("❌ OPENAI_API_KEY není nastaven. Bez něj generátor textů nefunguje.")
            sys.exit(1)

        from openai import OpenAI
        from config import TEXT_MODEL_FAST, TEXT_REASONING_EFFORT

        client = OpenAI(api_key=openai_key)
        response = client.responses.create(
            model=TEXT_MODEL_FAST,
            reasoning={"effort": TEXT_REASONING_EFFORT},
            max_output_tokens=2048,
            input="Odpověz jedním českým slovem: funguje.",
        )
        print(f"✓ OpenAI API funguje ({TEXT_MODEL_FAST}, reasoning={TEXT_REASONING_EFFORT}): {response.output_text.strip()}")

    except Exception as e:
        print(f"❌ Chyba OpenAI API: {e}")
        print("   Zkontroluj OPENAI_API_KEY v .env souboru a přístup k modelu GPT-6 Luna")
        sys.exit(1)

    # Test Gemini API pro obrázky.
    print("\n🧪 Testuju Gemini API pro generování obrázků...")
    try:
        from google import genai
        from config import GEMINI_API_KEY

        if not GEMINI_API_KEY:
            print("⚠️  GEMINI_API_KEY není nastaven; generování obrázků nebude dostupné.")
        else:
            client = genai.Client(api_key=GEMINI_API_KEY)
            client.models.generate_content(
                model="gemini-2.0-flash",
                contents="Odpověz jedním slovem: OK.",
            )
            print("✓ Gemini API funguje")
    except Exception as e:
        print(f"❌ Chyba Gemini API: {e}")
        print("   Zkontroluj GEMINI_API_KEY v .env souboru")
        sys.exit(1)

    print("\n" + "=" * 50)
    print("✅ Setup dokončen!")
    print("\nSpusť agenta:")
    print("  python agent.py generate     — vytvoř nový post")
    print("  python agent.py plan         — týdenní plán obsahu")
    print("  python agent.py blog         — promo post pro blog")
    print("  python agent.py --help       — zobraz nápovědu")


if __name__ == "__main__":
    main()
