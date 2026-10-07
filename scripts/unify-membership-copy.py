"""Explicit UI compatibility migration; never touches stored billing records."""
from pathlib import Path
import importlib.util
import re

root = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('rollout', root / 'scripts/audit-visual-rollout.py')
rollout = importlib.util.module_from_spec(spec)
spec.loader.exec_module(rollout)

def update(relative, replacements):
    path = root / relative
    original = path.read_text(encoding='utf-8')
    text = original
    for old, new in replacements:
        text = text.replace(old, new)
    if text != original:
        path.write_text(text, encoding='utf-8')

update('js/premium-gates.js', [
    ("'osviceni'", "'pruvodce'"),
    ('Odemknout Osvícení', 'Odemknout členství'),
    ("title: 'Osvícení'", "title: 'Členství Mystické Hvězdy'"),
    ('Tato funkce je dostupná od plánu Osvícení.', 'Tato funkce je součástí členství Mystické Hvězdy.'),
    ('Tato pokročilá mapa patří do plánu Osvícení a ukáže, kde se podporuje práce, vztahy i vnitřní růst.', 'Členství zahrnuje astrologickou mapu míst a jejich symbolický výklad.'),
    ('Hvězdný Průvodce bez limitu', 'Návazné otázky pro Hvězdného Průvodce'),
    ('Neomezené otázky na průvodce', 'Návazné otázky v rámci provozních limitů'),
    ('Pokračuj v otázce bez limitu', 'Pokračuj ve své otázce'),
    ('Prioritní odpovědi duchovního průvodce', 'Návazné odpovědi Hvězdného Průvodce'),
])
update('js/astro-map.js', [
    ("'osviceni'", "'pruvodce'"),
    ('Osvícení funkce', 'Součást členství'),
    ('Astrokartografie je dostupná od plánu Osvícení (499 Kč/měsíc).', 'Astrokartografie je součástí členství Mystické Hvězdy. Podmínky najdeš v ceníku.'),
    ('Zobrazit plány', 'Prohlédnout členství'),
    ('window.Auth.isExclusive()', 'window.Auth.isPremium()'),
])
update('js/prihlaseni.js', [
    ('Odemkneš plné výklady, natální kartu, numerologii a každodenní vedení bez limitu.', 'Odemkneš plné výklady, natální kartu a numerologii. Generované výklady podléhají provozním limitům.'),
    ("title: 'Hvězdný Průvodce'", "title: 'Členství Mystické Hvězdy'"),
    ('VIP členství bez ztráty kontextu', 'Členství bez ztráty kontextu'),
    ('Po registraci budete pokračovat k VIP plánu s Keltským křížem a pokročilými výklady.', 'Po registraci můžeš pokračovat ke členství s Keltským křížem a dalšími výklady.'),
    ('Vrátíme vás k VIP plánu', 'Vrátíme tě ke členství'),
])
update('tarot.html', [('<div class="t-spread-price text-gold">VIP</div>', '<div class="t-spread-price text-gold">Členství</div>')])
update('tarot.html', [('Neomezené výklady — 7 dní zdarma', 'Členské výklady — 7 dní zdarma')])
update('index.html', [
    ('Neomezené tarotové výklady', 'Tarotové výklady včetně Keltského kříže'),
    ('Neomezený chat a Křišťálová koule', 'Návazný chat a Křišťálová koule'),
    ('Chceš porovnat všechny tarify včetně vyšších plánů?', 'Chceš znát podmínky členství?'),
    ('<h3 class="card__title">Hvězdný Průvodce</h3>', '<h3 class="card__title">Členství Mystické Hvězdy</h3>'),
])
update('js/auth-client.js', [
    ('Můžete pokračovat k porovnání plánů a vybrat úroveň vedení, která dává smysl.', 'Můžeš si prohlédnout členství a jeho podmínky.'),
    ('Můžete pokračovat k VIP členství a nejvyšší úrovni osobního vedení.', 'Můžeš pokračovat ke členství s Keltským křížem a dalšími výklady.'),
])
update('js/crystal-ball.js', [
    ('Pro neomezené odpovědi pokračuj na Premium.', 'Další odpovědi jsou součástí členství a podléhají provozním limitům.'),
    ('Chceš neomezené odpovědi? Aktivuj si Hvězdného Průvodce.', 'Ve členství můžeš pokračovat v rámci provozních limitů.'),
])
update('js/profile/dashboard.js', [('součástí VIP plánu', 'součástí členství')])
update('tarot-keltsky-kriz.html', [
    ('ve VIP', 've členství'), ('ve VIP', 've členství'),
    ('součástí VIP', 'součástí členství'), ('bez VIP', 'bez členství'),
    ('VIP výklad', 'členský výklad'), ('· VIP', '· členství'),
    ('Otevřít VIP Keltský kříž', 'Otevřít Keltský kříž'),
    ('Odemknout VIP rozklady', 'Prohlédnout členství'),
    ('"category":"VIP"', '"category":"Členství"'),
])

versioned = {'tarot', 'premium-gates', 'auth-client', 'core', 'astro-map', 'prihlaseni', 'cenik', 'crystal-ball', 'cenik-copy-fixes', 'profile/dashboard'}
changed = 0
for path in rollout.public_html_files(root):
    original = path.read_text(encoding='utf-8')
    text = re.sub(r'(plan=)(?:vip-majestrat|osviceni(?:-rocne)?|pruvodce-rocne)(?=[&"\s])', r'\1pruvodce', original)
    text = re.sub(r'((?:data-plan|data-analytics-plan)=")(?:(?:vip-majestrat)|osviceni(?:-rocne)?|pruvodce-rocne)(")', r'\1pruvodce\2', text)
    for name in versioned:
        text = re.sub(r'(src="(?:\./|\.\./|/)?js/dist/' + re.escape(name) + r'\.js)(?:\?[^"\s]*)?(")', r'\1?v=20261003-single-membership\2', text)
    if text != original:
        path.write_text(text, encoding='utf-8')
        changed += 1
print(f'[membership-copy] updated {changed} public pages')
