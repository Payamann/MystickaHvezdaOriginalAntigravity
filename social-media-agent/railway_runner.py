"""
Railway runner pro Comment Bot.
Výchozí review režim v non-interactive prostředí pouze uloží návrhy jako čekající.
Automatické odesílání vyžaduje dvě explicitní konfigurační hodnoty.
"""
import sys
import os
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / ".env", override=True, encoding="utf-8")

from comment_bot import run_once

if __name__ == "__main__":
    mode = os.getenv("COMMENT_BOT_MODE", "review").strip().lower()
    if mode not in {"review", "auto", "dry-run"}:
        raise RuntimeError("COMMENT_BOT_MODE musí být review, auto nebo dry-run")
    if mode == "auto":
        confirmation = os.getenv("COMMENT_BOT_AUTO_CONFIRM", "").strip()
        if confirmation != "SEND_REPLIES_WITHOUT_REVIEW":
            raise RuntimeError(
                "Auto režim vyžaduje COMMENT_BOT_AUTO_CONFIRM=SEND_REPLIES_WITHOUT_REVIEW"
            )
    run_once(mode)
