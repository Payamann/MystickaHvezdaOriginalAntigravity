"""
Railway runner pro Comment Bot.
Spouští comment_bot.py --auto a pak čeká na další cron trigger.
"""
import sys
import os
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / ".env", override=True, encoding="utf-8")

from comment_bot import run_once

if __name__ == "__main__":
    run_once("auto")
