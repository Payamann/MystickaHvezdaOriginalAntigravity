"""Build source-only release evidence from the existing full-site inventory.

This does not launch the application, test links or claim browser coverage.
Run from any directory; output stays in docs/release-prep-2026-10-15.
"""
import csv
import json
from pathlib import Path
from html.parser import HTMLParser

ROOT = Path(__file__).resolve().parents[1]
BASELINE = ROOT / 'docs/page-simplification-2026-10-14'
OUTPUT = ROOT / 'docs/release-prep-2026-10-15'


class Styles(HTMLParser):
    def __init__(self):
        super().__init__()
        self.paths = []

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        if tag == 'link' and 'stylesheet' in attrs.get('rel', '').split():
            self.paths.append(attrs.get('href', ''))


def family(url, category):
    stem = Path(url).stem
    if category == 'internal':
        return 'internal-exception'
    if stem in {'404', 'offline'}:
        return 'ucet-podpora-stav'
    if stem in {'profil', 'prihlaseni', 'registrace', 'reset-hesla', 'obnovit-heslo',
                'onboarding', 'dekujeme', 'platba-uspesna', 'kontakt', 'podminky',
                'soukromi', 'gdpr', 'faq', 'jak-to-funguje'}:
        return 'ucet-podpora-stav'
    if category == 'content':
        return 'vysledek-reference'
    if stem in {'index', 'blog', 'snar', 'slovnik', 'tarot-vyznam-karet', 'horoskopy'}:
        if url in {'/index.html', '/sk/index.html', '/pl/index.html'}:
            return 'uvod-produkt'
        return 'katalog'
    if stem in {'cenik', 'osobni-mapa', 'vztahovy-vyklad', 'o-nas', 'rocni-horoskop'}:
        return 'uvod-produkt'
    return 'nastroj'


def write_json(name, value):
    (OUTPUT / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def main():
    with (BASELINE / 'all-files.csv').open(encoding='utf-8-sig', newline='') as source:
        inventory = list(csv.DictReader(source))
    functional = {item['path'] for item in json.loads((BASELINE / 'functional-pages.json').read_text(encoding='utf-8'))}
    issues = {item['path']: item['issueIds'] for item in json.loads((BASELINE / 'review-ledger.json').read_text(encoding='utf-8'))}
    pages = []
    observations = {}
    for viewport in ('desktop', 'mobile'):
        report = OUTPUT / 'qa-evidence' / f'browser-{viewport}.json'
        if report.is_file():
            for observation in json.loads(report.read_text(encoding='utf-8')):
                observations.setdefault(observation['path'], {})[viewport] = {
                    'evidence': f'qa-evidence/browser-{viewport}.json',
                    'viewport': observation['width'],
                    'documentWidth': observation['scroll'],
                    'scope': 'initial route load and DOM layout; not every tool interaction'
                }
    for item in inventory:
        url = item['URL']
        file = ROOT / url.lstrip('/')
        parser = Styles()
        if file.is_file():
            parser.feed(file.read_text(encoding='utf-8'))
        pages.append({
            'url': url, 'familyDraft': family(url, item['category']),
            'previousCategory': item['category'], 'functionalEntry': url in functional,
            'previousIssues': issues.get(url, []), 'stylesheets': parser.paths,
            'sourceExists': file.is_file(), 'state': 'awaiting-final-review',
            'browserLoadEvidence': observations.get(url),
            'evidenceBaseline': '../page-simplification-2026-10-14/README.md',
            'assignmentMethod': 'source-path rule; validate exceptions in final review'
        })
    OUTPUT.mkdir(parents=True, exist_ok=True)
    write_json('page-ledger.json', {'date': '2026-10-16', 'method': 'complete source inventory plus linked initial-load observations where available; not exhaustive functional acceptance', 'pages': pages})

    # Deliberately exclude documentation and generated JS/CSS bundles. A missing
    # literal reference cannot rule out a dynamically constructed runtime path.
    source_files = {ROOT / url.lstrip('/') for url in functional}
    source_files.update(ROOT.glob('*.html'))
    source_files.update(file for file in (ROOT / 'css').rglob('*.css') if not file.name.endswith('.min.css'))
    source_files.update(file for file in (ROOT / 'js').rglob('*.js') if 'dist' not in file.relative_to(ROOT / 'js').parts and 'vendor' not in file.relative_to(ROOT / 'js').parts)
    texts = {file.relative_to(ROOT).as_posix(): file.read_text(encoding='utf-8') for file in sorted(source_files) if file.is_file()}
    assets = []
    for file in sorted((ROOT / 'img/atlas').rglob('*.webp')):
        relative = file.relative_to(ROOT).as_posix()
        refs = [name for name, text in texts.items() if relative in text]
        assets.append({
            'asset': relative, 'sourceBytes': file.stat().st_size,
            'roleDraft': 'derived zodiac picker thumbnail' if relative.endswith('western-zodiac-v1-grid.webp') else 'tool illustration' if '/tools-v1/' in relative else 'editorial scene or symbolic detail',
            'directReferenceFiles': refs,
            'usageStatus': 'direct source reference found' if refs else 'no literal reference in scanned source; runtime use unverified',
            'needsNewArtwork': None, 'finalVisualReview': 'pending'
        })
    write_json('art-usage.json', {
        'date': '2026-10-16', 'method': 'literal references in functional/root HTML, source CSS and JS; excludes docs/dist/minified CSS; counts physical WebP files including technical derivatives; no runtime claims',
        'scannedSourceFiles': len(texts), 'assets': assets
    })
    print(f'Source ledger saved: {len(pages)} pages; {len(functional)} functional entries; {len(assets)} atlas WebP files including derivatives. Linked browser load evidence: {len(observations)} routes.')


if __name__ == '__main__':
    main()
