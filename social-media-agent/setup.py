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
        ("OPENAI_API_KEY", "OpenAI API klíč pro texty a obrázky"),
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

    # Presence-only default; no paid text or image generation during setup.
    from dotenv import load_dotenv
    load_dotenv(env_path)
    if not os.getenv("OPENAI_API_KEY"):
        print("❌ OPENAI_API_KEY není nastaven. Bez něj generátory nefungují.")
        sys.exit(1)
    print("✓ OPENAI_API_KEY je nastaven; přístup k modelům zatím nebyl ověřen.")

    if "--check-models" in sys.argv:
        from openai import OpenAI
        from config import TEXT_MODEL_FAST, IMAGE_MODEL
        try:
            client = OpenAI(base_url="https://api.openai.com/v1", max_retries=0, timeout=30)
            for model in (TEXT_MODEL_FAST, IMAGE_MODEL):
                client.models.retrieve(model)
                print(f"✓ Model je dostupný v katalogu: {model}")
            print("Kontrola katalogu nezaručuje oprávnění ke generování.")
        except Exception:
            print("❌ Nepodařilo se ověřit modely v OpenAI. Zkontroluj přístup účtu.")
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
