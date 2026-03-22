"""
Pytest konfigurace — sdílené fixtures pro testy.
"""
import sys
from pathlib import Path

# Přidej root projektu do path
sys.path.insert(0, str(Path(__file__).parent.parent))
