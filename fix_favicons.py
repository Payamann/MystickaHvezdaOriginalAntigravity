import os, glob

FAVICON_SVG = '<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'><text y=\'.9em\' font-size=\'90\'>🔮</text></svg>">'

SKIP = ['.claude', 'node_modules', 'coverage', 'playwright-report', 'templates',
        'social-media-agent/output', 'tmp_email_previews', 'tests', 'server/node_modules',
        'components', '.claire', 'GA-HTML-SNIPPET', 'GA4-IMPLEMENTATION-CODE']

def get_prefix(path):
    parts = path.replace('\\', '/').split('/')
    depth = len(parts) - 1  # minus filename
    return '../' * depth

fixed = 0
skipped = 0
for path in glob.glob('**/*.html', recursive=True):
    path = path.replace('\\', '/')
    if any(s in path for s in SKIP):
        continue

    with open(path, encoding='utf-8', errors='ignore') as f:
        content = f.read()

    if 'rel="icon"' in content:
        continue

    prefix = get_prefix(path)
    favicon_block = f'  {FAVICON_SVG}\n  <link rel="apple-touch-icon" href="{prefix}img/icon-192.webp">'

    try:
        if '<meta charset' in content:
            insert_after = content.index('<meta charset')
            end = content.index('>', insert_after) + 1
            content = content[:end] + '\n' + favicon_block + content[end:]
        elif '<head>' in content.lower():
            idx = content.lower().index('<head>') + 6
            content = content[:idx] + '\n' + favicon_block + content[idx:]
        else:
            skipped += 1
            continue

        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        fixed += 1
    except Exception as e:
        print(f'Error {path}: {e}')

print(f'Fixed: {fixed}, Skipped (no head): {skipped}')
