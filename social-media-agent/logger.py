"""
Centrální logging pro Social Media Agent.
Nahrazuje print() volání strukturovaným logováním.

Použití v modulech:
    from logger import get_logger
    log = get_logger(__name__)
    log.info("Post uložen: %s", path)
    log.warning("Imagen nedostupný, fallback na placeholder")
    log.error("Chyba při publikaci: %s", err)
"""
import logging
import sys
from pathlib import Path

import config

# Adresář pro logy
LOG_DIR = config.OUTPUT_DIR / "logs"
LOG_DIR.mkdir(parents=True, exist_ok=True)
LOG_FILE = LOG_DIR / "agent.log"


def _setup_root_logger():
    """Konfiguruje root logger — volá se jednou při importu."""
    root = logging.getLogger("mystika")
    if root.handlers:
        return root  # už nakonfigurovaný

    root.setLevel(logging.DEBUG)

    # Formát
    fmt = logging.Formatter(
        fmt="%(asctime)s │ %(levelname)-7s │ %(name)-28s │ %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    # Console handler — INFO+ do stderr (neruší Rich výstup na stdout)
    console_handler = logging.StreamHandler(sys.stderr)
    console_handler.setLevel(logging.WARNING)
    console_handler.setFormatter(fmt)
    root.addHandler(console_handler)

    # File handler — DEBUG+ do souboru (rotuje se ručně / denně)
    file_handler = logging.FileHandler(LOG_FILE, encoding="utf-8")
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(fmt)
    root.addHandler(file_handler)

    return root


# Inicializace při importu
_setup_root_logger()


def get_logger(name: str) -> logging.Logger:
    """
    Vrátí logger pro daný modul.

    Args:
        name: typicky __name__ (např. 'generators.text_generator')

    Returns:
        logging.Logger s hierarchií pod 'mystika'
    """
    # Odstraní prefix cesty, ponechá jen název modulu
    short = name.replace("social-media-agent.", "").replace("social_media_agent.", "")
    return logging.getLogger(f"mystika.{short}")
