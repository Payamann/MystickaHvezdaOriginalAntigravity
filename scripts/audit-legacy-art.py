"""Inventory legacy art candidates, not an automatic visual verdict."""
import importlib.util
import json
import re
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('rollout', ROOT / 'scripts/audit-visual-rollout.py')
rollout = importlib.util.module_from_spec(spec)
spec.loader.exec_module(rollout)

class ArtParser(HTMLParser):
    def __init__(self):
        super().__init__(); self.refs=[]; self.classes=[]; self.css=[]
    def handle_starttag(self, tag, attrs):
        a=dict(attrs)
        if tag=='body': self.classes=(a.get('class') or '').split()
        if tag=='img' and a.get('src'): self.refs.append(('image',a['src']))
        if tag=='source' and a.get('srcset'):
            for entry in a['srcset'].split(','):
                self.refs.append(('source',entry.strip().split()[0]))
        if tag=='meta' and (a.get('property') or a.get('name')) in ('og:image','twitter:image'):
            self.refs.append(('share',a.get('content','')))
        if tag=='link' and 'stylesheet' in (a.get('rel') or ''): self.css.append(a.get('href',''))
        for match in re.findall(r'url\([\'\"]?([^\)\'\"]+)',a.get('style','')):
            self.refs.append(('inline-background',match))

counts=Counter(); rows=[]; missing_shell=[]
for path in rollout.public_html_files(ROOT):
    parser=ArtParser(); parser.feed(path.read_text(encoding='utf-8'))
    rel=path.relative_to(ROOT).as_posix()
    if not set(parser.classes)&rollout.ATLAS_CLASSES: missing_shell.append(rel)
    refs=[]
    for kind, raw in parser.refs:
        parsed=urlparse(raw)
        if parsed.scheme in ('data','blob'): continue
        if parsed.netloc and parsed.netloc not in rollout.INTERNAL_HOSTS: continue
        target=(ROOT / parsed.path.lstrip('/')) if parsed.path.startswith('/') else (path.parent / parsed.path)
        try: asset=target.resolve().relative_to(ROOT).as_posix()
        except ValueError: continue
        if not asset.startswith('img/'): continue
        counts[asset]+=1
        modern=asset.startswith(('img/atlas/','img/tarot-v2/','img/search-preview/'))
        brand=Path(asset).name.startswith(('logo','favicon','icon-192','icon-512'))
        candidate=not(modern or brand)
        refs.append({'kind':kind,'asset':asset,'candidate':candidate,'exists':target.is_file()})
    rows.append({'page':rel,'classes':parser.classes,'refs':refs,'css':parser.css})

candidates=[row for row in rows if any(r['candidate'] for r in row['refs'])]
out=ROOT/'docs/visual-legacy-review'
out.mkdir(exist_ok=True)
result={'checked':len(rows),'without_shell':missing_shell,'candidate_pages':len(candidates),'asset_counts':dict(counts.most_common()),'pages':rows}
(out/'inventory.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
lines=['# Legacy art candidates','',f'Checked {len(rows)} public pages. Candidate filenames need browser/editorial review.','', '| Page | Candidate assets |','|---|---|']
for row in candidates:
    assets=sorted({r['asset']+' ('+r['kind']+')' for r in row['refs'] if r['candidate']})
    lines.append('| '+row['page']+' | '+'; '.join(assets)+' |')
(out/'candidates.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
print(json.dumps({'checked':len(rows),'without_shell':missing_shell,'candidate_pages':len(candidates),'candidate_asset_counts':{k:v for k,v in counts.most_common() if not k.startswith(('img/atlas/','img/tarot-v2/','img/search-preview/'))}},ensure_ascii=False))
