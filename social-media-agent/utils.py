"""
Sdílené utility pro social-media-agent
"""
import re


def slugify(text: str, max_length: int = 30) -> str:
    """
    Převede český text na URL/filename-safe slug.
    Odstraní diakritiku, nahradí speciální znaky podtržítkem.
    """
    text = text.lower()
    replacements = {
        'á': 'a', 'č': 'c', 'ď': 'd', 'é': 'e', 'ě': 'e',
        'í': 'i', 'ň': 'n', 'ó': 'o', 'ř': 'r', 'š': 's',
        'ť': 't', 'ú': 'u', 'ů': 'u', 'ý': 'y', 'ž': 'z',
    }
    for k, v in replacements.items():
        text = text.replace(k, v)
    text = re.sub(r'[^a-z0-9]', '_', text)
    text = re.sub(r'_+', '_', text).strip('_')
    return text[:max_length]
