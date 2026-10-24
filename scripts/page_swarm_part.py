import importlib.util, json, re
from pathlib import Path
from html.parser import HTMLParser
spec=importlib.util.spec_from_file_location('audit','scripts/audit-visual-rollout.py'); m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
root=Path('.').resolve(); pages=m.public_html_files(root)[0::3]
class P(HTMLParser):
 def __init__(self): super().__init__(); self.title=''; self.h1=[]; self.in_title=False; self.in_h1=False; self.img=[]; self.scripts=[]
 def handle_starttag(self,t,a):
  d=dict(a)
  if t=='title': self.in_title=True
  if t=='h1': self.in_h1=True
  if t=='img': self.img.append(d)
  if t=='script' and d.get('src'): self.scripts.append(d['src'])
 def handle_endtag(self,t):
  if t=='title': self.in_title=False
  if t=='h1': self.in_h1=False
 def handle_data(self,d):
  if self.in_title: self.title+=d.strip()
  if self.in_h1 and d.strip(): self.h1.append(d.strip())
out=[]
for page in pages:
 rel=m.norm_rel(page.relative_to(root)); text=page.read_text(encoding='utf-8',errors='replace'); p=P(); p.feed(text)
 body=re.search(r'<body\b[^>]*class=["\']([^"\']*)',text,re.I); classes=(body.group(1).split() if body else []); markers=sorted(set(classes)&m.ATLAS_CLASSES)
 css=re.findall(r'<link\b[^>]*rel=["\'][^"\']*stylesheet[^"\']*["\'][^>]*href=["\']([^"\']+)',text,re.I)
 refs=[]; missing=[]; dynamic=[]
 for raw in css+p.scripts+[x.get('src','') for x in p.img if x.get('src')]:
  if not raw: continue
  c=m.parse_reference(raw,page,root); refs.append({'raw':raw,'kind':c['kind'],'target':c.get('target')})
  if c['kind']=='missing-static': missing.append(raw)
  if c['kind']=='dynamic-uncovered': dynamic.append(raw)
 imgs=[]
 for x in p.img:
  c=m.parse_reference(x.get('src',''),page,root); target=c.get('target'); exists=bool(target and (root/target).is_file()); imgs.append({'src':x.get('src'),'exists':exists,'alt':x.get('alt'),'width':x.get('width'),'height':x.get('height'),'target':target,'kind':c['kind']})
 local=[]
 for a in re.findall(r'<a\b[^>]*href=["\']([^"\']+)',text,re.I):
  c=m.parse_reference(a,page,root)
  if c['kind'] in ('static','missing-static'): local.append({'href':a,'kind':c['kind'],'target':c.get('target')})
 out.append({'file':rel,'title':p.title,'h1':p.h1,'atlas_markers':markers,'body_classes':classes,'css':css,'scripts':p.scripts,'images':imgs,'local_links':local,'missing_assets':missing,'dynamic_assets':dynamic,'legacy_3d_galaxy':bool(re.search(r'3d|galaxy|space[-_ ]?background|starfield',text,re.I))})
report={'scope':{'partition':'[0::3]','total_pages':len(m.public_html_files(root)),'checked_pages':len(pages)},'pages':out}
Path('docs/page-swarm').mkdir(parents=True,exist_ok=True); Path('docs/page-swarm/part-0.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'total':len(m.public_html_files(root)),'checked':len(pages),'missing_assets':sum(map(lambda x:len(x['missing_assets']),out)),'legacy':sum(x['legacy_3d_galaxy'] for x in out)}))
