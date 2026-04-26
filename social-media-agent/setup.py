"""
Setup skript — nastavení agenta při prvním spuštění
"""
import os
import sys
from pathlib import Path


def main():
    print("🔮 Mystická Hvězda — Social Media Agent Setup")
    print("=" * 50)

    env_path = Path(__file__).parent / ".env"
    env_example = Path(__file__).parent / ".env.example"

    # Vytvoření .env souboru
    if not env_path.exists():
        print("\n📝 Vytváříme .env konfigurační soubor...")
        api_key = input("Zadej svůj Gemini API klíč: ").strip()

        if not api_key:
            print("⚠️  API klíč je povinný!")
            sys.exit(1)

        env_content = f"""# === GEMINI API ===
GEMINI_API_KEY={api_key}

# === META / FACEBOOK (vyplníš až budeš mít FB stránku) ===
META_ACCESS_TOKEN=
META_PAGE_ID=
INSTAGRAM_ACCOUNT_ID=

# === NASTAVENÍ ===
LANGUAGE=cs
BRAND_NAME=Mystická Hvězda
WEBSITE_URL=https://www.mystickahvezda.cz
"""
        with open(env_path, 'w') as f:
            f.write(env_content)

        print(f"✓ .env soubor vytvořen: {env_path}")
    else:
        print("✓ .env soubor již existuje")

    # Instalace závislostí
    print("\n📦 Instaluji Python závislosti...")
    os.system(f"{sys.executable} -m pip install -r requirements.txt -q")
    print("✓ Závislosti nainstalovány")

    # Test Gemini API
    print("\n🧪 Testuju Gemini API...")
    try:
        from dotenv import load_dotenv
        load_dotenv(env_path)

        from google import genai
        api_key = os.getenv("GEMINI_API_KEY")

        if not api_key:
            print("❌ API klíč není nastaven v .env")
            sys.exit(1)

        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents="Rekni jen: 'Ahoj! Agent funguje.' cesky.",
        )
        print(f"✓ Gemini API funguje: {response.text.strip()}")

    except Exception as e:
        print(f"❌ Chyba Gemini API: {e}")
        print("   Zkontroluj API klíč v .env souboru")
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
