"""Offline HTML localization with explicit, complete translation dictionaries.

Only human-facing text is translated. Source formatting, executable content and
unselected attributes are retained byte-for-byte wherever possible.
"""
from __future__ import annotations

import hashlib
import html as _html
from html.parser import HTMLParser
import json
import re
from urllib.parse import urljoin, urlsplit, urlunsplit

_VOID = set('area base br col embed hr img input link meta param source track wbr'.split())
_SKIP = set('script style code pre svg math textarea'.split())
_HUMAN = {'alt', 'title', 'aria-label', 'placeholder', 'aria-description'}
_META = {'description', 'og:title', 'og:description', 'twitter:title', 'twitter:description', 'og:image:alt', 'twitter:image:alt'}
_JSON_TEXT = {'headline', 'description', 'text', 'caption', 'alternativeHeadline'}


def _outer_whitespace(raw):
    tokens = list(re.finditer(r'&(?:#\d+|#x[0-9a-fA-F]+|\w+);|.', raw, re.S))
    visible = [m for m in tokens if not _html.unescape(m.group()).isspace()]
    return (raw[:visible[0].start()], raw[visible[-1].end():]) if visible else (raw, '')


def segment_hash(segment: dict) -> str:
    return hashlib.sha256(json.dumps([segment['text'], segment['context']], ensure_ascii=False,
                                    separators=(',', ':')).encode('utf-8')).hexdigest()


def validate_translation(source: str, target: str) -> None:
    if not isinstance(target, str) or not target.strip():
        raise ValueError('Translation must be a nonempty string')
    if re.search(r'<\s*[!/?a-zA-Z]', target) or re.search(r'&(?:lt|#0*60|#x0*3c);', target, re.I):
        raise ValueError('HTML markup is not permitted in translations')
    # Keep template variables, numeric literals, currency and existing URLs exact.
    patterns = [r'Mystická Hvězda', r'\{\{.*?\}\}|\$\{.*?\}|\{[\w.:-]+\}|%\([^)]+\)[a-z]|%[sdif]',
                r'\d+(?:[.,:/-]\d+)*', r'Kč|CZK|EUR|PLN|USD|€|\$|zł',
                r'https?://[^\s<>"\']+|www\.[^\s<>"\']+']
    for pattern in patterns:
        if sorted(re.findall(pattern, source)) != sorted(re.findall(pattern, target)):
            raise ValueError('Translation changed protected placeholders, numbers, currency or URLs')


class _Document(HTMLParser):
    def __init__(self, source: str):
        super().__init__(convert_charrefs=False)
        self.source = source
        self.lines = [0] + [m.end() for m in re.finditer('\n', source)]
        self.stack = []
        self.counts = [{}]
        self.nodes = {}
        self.records = []
        self.segments = []
        self.json_blocks = []
        self.pending = None
        self.feed(source)
        self.flush()
        self.close()
        for record in self.records:
            if record['tag'] == 'script' and record['attrs'].get('type', '').lower() == 'application/ld+json':
                if 'close_start' not in record or not any(record['end'] <= b['start'] < record['close_start'] for b in self.json_blocks):
                    raise ValueError('Empty or unclosed JSON-LD at ' + record['path'])

    def position_offset(self):
        line, col = self.getpos()
        return self.lines[line - 1] + col

    def flush(self):
        if self.pending is None:
            return
        start, end, path = self.pending
        self.pending = None
        raw = self.source[start:end]
        decoded = _html.unescape(raw)
        if not decoded.strip():
            return
        n = self.nodes.get(path, 0)
        self.nodes[path] = n + 1
        self.add(path + '/text()[' + str(n) + ']', decoded.strip(), path,
                 kind='text', start=start, end=end, raw=raw)

    def add(self, ident, text, context, **extra):
        if text.strip():
            self.segments.append(dict(id=ident, text=text.strip(), context=context, **extra))

    def handle_starttag(self, tag, attrs):
        self.flush()
        start = self.position_offset()
        raw = self.get_starttag_text()
        count = self.counts[-1].get(tag, 0)
        self.counts[-1][tag] = count + 1
        path = (self.stack[-1]['path'] if self.stack else '') + '/' + tag + '[' + str(count) + ']'
        attrmap = dict(attrs)
        record = dict(tag=tag, attrs=attrmap, start=start, end=start + len(raw), path=path, raw=raw)
        record['attr_ranges'] = {}
        # Match complete attributes; quoting is preserved by replacing only values.
        for match in re.finditer(r'''([^\s=<>/]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))''', raw):
            name = match.group(1).lower()
            group = next(i for i in (2, 3, 4) if match.group(i) is not None)
            a, b = match.span(group)
            record['attr_ranges'][name] = (start + a, start + b, group == 4)
            human = name in _HUMAN or (tag == 'input' and name == 'value' and attrmap.get('type', '').lower() in ('submit', 'button', 'reset')) or (tag == 'meta' and name == 'content' and
                    (attrmap.get('name', '').lower() in _META or attrmap.get('property', '').lower() in _META))
            if human and not any(x['tag'] in _SKIP or 'hidden' in x['attrs'] or x['attrs'].get('translate') == 'no' or x['attrs'].get('aria-hidden') == 'true' for x in self.stack):
                self.add(path + '/@' + name, _html.unescape(match.group(group)), path + ' @' + name,
                         kind='attr', start=start + a, end=start + b, unquoted=group == 4)
        self.records.append(record)
        if tag not in _VOID:
            self.stack.append(record)
            self.counts.append({})

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in _VOID:
            self.handle_endtag(tag)

    def handle_endtag(self, tag):
        self.flush()
        for index in range(len(self.stack) - 1, -1, -1):
            if self.stack[index]['tag'] == tag:
                self.stack[index]['close_start'] = self.position_offset()
                self.stack[index]['close_end'] = self.source.find('>', self.position_offset()) + 1
                del self.stack[index:]
                del self.counts[index + 1:]
                break

    def handle_data(self, data):
        start = self.position_offset()
        if self.stack and self.stack[-1]['tag'] == 'script':
            record = self.stack[-1]
            if record['attrs'].get('type', '').lower() == 'application/ld+json':
                try:
                    obj = json.loads(data)
                except (ValueError, TypeError) as exc:
                    raise ValueError('Malformed JSON-LD at ' + record['path']) from exc
                block = dict(start=start, end=start + len(data), obj=obj, segments=[])
                self.json_blocks.append(block)
                self.walk_json(obj, record['path'] + '/json', (), block)
            return
        if any(x['tag'] in _SKIP or 'hidden' in x['attrs'] or x['attrs'].get('translate') == 'no' or x['attrs'].get('aria-hidden') == 'true'
               for x in self.stack):
            return
        path = self.stack[-1]['path'] if self.stack else ''
        if self.pending and self.pending[1] == start:
            self.pending[1] = start + len(data)
        else:
            self.flush()
            self.pending = [start, start + len(data), path]

    def handle_entityref(self, name):
        self.handle_data('&' + name + (';' if self.source[self.position_offset() + len(name) + 1:self.position_offset() + len(name) + 2] == ';' else ''))

    def handle_charref(self, name):
        self.handle_data('&#' + name + (';' if self.source[self.position_offset() + len(name) + 2:self.position_offset() + len(name) + 3] == ';' else ''))

    def handle_comment(self, data):
        self.flush()

    def walk_json(self, obj, base, path, block, parent_type=None):
        if isinstance(obj, dict):
            typ = obj.get('@type', parent_type)
            protected = any(t in {'Organization', 'Brand', 'Person', 'WebSite'} for t in (typ if isinstance(typ, list) else [typ]))
            for key, value in obj.items():
                loc = path + (key,)
                human = key in _JSON_TEXT or (key == 'name' and typ in ('Question', 'Answer', 'FAQPage', 'WebPage', 'Article', 'BlogPosting', 'Service', 'Product'))
                if isinstance(value, str) and human and not protected:
                    ident = base + '/' + '/'.join(map(str, loc))
                    self.add(ident, value, 'JSON-LD ' + '/'.join(map(str, loc)), kind='json', json_path=loc)
                    block['segments'].append(self.segments[-1]) if value.strip() else None
                elif isinstance(value, (dict, list)):
                    self.walk_json(value, base, loc, block)
        elif isinstance(obj, list):
            for index, value in enumerate(obj):
                self.walk_json(value, base, path + (index,), block)


def extract_page(html: str) -> list[dict]:
    return [{k: s[k] for k in ('id', 'text', 'context')} for s in _Document(html).segments]


def _json_urls(obj, source_url, target_url, locale):
    if isinstance(obj, dict):
        for key, value in obj.items():
            if key in ('url', '@id') and isinstance(value, str) and value.split('#')[0].rstrip('/') == source_url.rstrip('/'):
                obj[key] = target_url + ('#' + value.split('#', 1)[1] if '#' in value else '')
            elif key == 'inLanguage' and isinstance(value, str):
                obj[key] = locale
            else:
                _json_urls(value, source_url, target_url, locale)
    elif isinstance(obj, list):
        for value in obj:
            _json_urls(value, source_url, target_url, locale)


def render_page(html: str, translations: dict[str, str], *, locale: str, source_url: str,
                target_url: str, alternates: dict[str, str], preview: bool = True,
                link_map: dict[str, str] | None = None) -> str:
    doc = _Document(html)
    expected = {s['id'] for s in doc.segments}
    if set(translations) != expected:
        raise ValueError('Translation dictionary coverage mismatch: missing=' + str(sorted(expected - set(translations))) +
                         ' extra=' + str(sorted(set(translations) - expected)))
    visible_values = {}
    for segment in doc.segments:
        if segment['kind'] == 'text':
            visible_values.setdefault(segment['text'], set()).add(translations[segment['id']])
    for segment in doc.segments:
        if segment['kind'] == 'json' and 'mainEntity' in segment['json_path'] and segment['text'] in visible_values:
            if visible_values[segment['text']] != {translations[segment['id']]}:
                raise ValueError('FAQ JSON-LD translation differs from its visible source text')
    patches = []
    for segment in doc.segments:
        value = translations[segment['id']]
        validate_translation(segment['text'], value)
        if segment['kind'] == 'json':
            continue
        escaped = _html.escape(value, quote=segment['kind'] == 'attr')
        if segment['kind'] == 'text':
            prefix, suffix = _outer_whitespace(segment['raw'])
            escaped = prefix + escaped + suffix
        elif segment.get('unquoted'):
            escaped = '"' + escaped + '"'
        patches.append((segment['start'], segment['end'], escaped))
    for block in doc.json_blocks:
        for segment in block['segments']:
            obj = block['obj']
            path = segment['json_path']
            for key in path[:-1]:
                obj = obj[key]
            obj[path[-1]] = translations[segment['id']]
        _json_urls(block['obj'], source_url, target_url, locale)
        encoded = json.dumps(block['obj'], ensure_ascii=False).replace('<', '\\u003c').replace('>', '\\u003e').replace('&', '\\u0026')
        patches.append((block['start'], block['end'], encoded))
    links = link_map or {}
    source_origin = urlsplit(source_url)[:2]
    route_map = {urlunsplit(urlsplit(urljoin(source_url, key))._replace(query='', fragment='')):
                 urljoin(source_url, value) for key, value in links.items()}
    localized_paths = {urlsplit(value).path for value in route_map.values()
                       if urlsplit(value)[:2] == source_origin}
    for record in doc.records:
        attrs = record['attrs']
        tag = record['tag']
        remove = (tag == 'link' and attrs.get('rel', '').lower() in ('canonical', 'alternate') and
                  (attrs.get('rel', '').lower() == 'canonical' or 'hreflang' in attrs)) or (
                  tag == 'meta' and (attrs.get('name', '').lower() in ('robots', 'googlebot') or
                  attrs.get('property', '').lower() in ('og:url', 'og:locale', 'og:locale:alternate')))
        if remove:
            patches = [p for p in patches if not (record['start'] <= p[0] < record['end'])]
            # Managed SEO tags are a line-oriented generated block. Consume
            # trailing whitespace too, so source hreflang insertion cannot
            # accumulate blank lines in localized outputs across rebuilds.
            end = record['end']
            while end < len(html) and html[end].isspace():
                end += 1
            patches.append((record['start'], end, ''))
            continue
        if tag == 'html':
            if 'lang' in record['attr_ranges']:
                a, b, unquoted = record['attr_ranges']['lang']
                patches.append((a, b, ('"' if unquoted else '') + _html.escape(locale, quote=True) + ('"' if unquoted else '')))
            else:
                patches.append((record['end'] - 1, record['end'] - 1, ' lang="' + _html.escape(locale, quote=True) + '"'))
        for name in ('href', 'src', 'poster', 'action', 'srcset'):
            if name not in record['attr_ranges']:
                continue
            value = attrs[name] or ''
            if not value or value.startswith(('#', 'mailto:', 'tel:', 'data:', 'javascript:')):
                continue
            mapped_destination = False
            destination = None
            def resolved(url):
                nonlocal mapped_destination, destination
                absolute = urljoin(source_url, url)
                parts = urlsplit(absolute)
                if tag == 'a' and name == 'href':
                    route = route_map.get(urlunsplit(parts._replace(query='', fragment='')))
                    if route is not None:
                        mapped_destination = True
                        absolute = urlunsplit(urlsplit(route)._replace(query=parts.query, fragment=parts.fragment))
                        parts = urlsplit(absolute)
                    destination = parts
                if parts[:2] == source_origin:
                    return urlunsplit(('', '', parts.path or '/', parts.query, parts.fragment))
                return absolute
            if name == 'srcset':
                value = ', '.join(' '.join([resolved(part.split()[0])] + part.split()[1:]) for part in value.split(',') if part.strip())
            else:
                value = resolved(value)
            a, b, unquoted = record['attr_ranges'][name]
            patches.append((a, b, ('"' if unquoted else '') + _html.escape(value, quote=True) + ('"' if unquoted else '')))
            if (tag == 'a' and name == 'href' and destination is not None and
                    destination[:2] == source_origin and not mapped_destination and
                    destination.path not in localized_paths and destination.path != urlsplit(target_url).path and
                    not destination.path.startswith('/' + locale + '/')):
                # A visible language marker makes untranslated destinations explicit.
                at = record.get('close_start')
                if at is not None:
                    patches.append((at, at, ' <span class="destination-language" lang="cs">(CZ)</span>'))
    head = next((r for r in doc.records if r['tag'] == 'head'), None)
    if head is None or 'close_start' not in head:
        raise ValueError('A complete HTML head is required')
    esc = lambda s: _html.escape(s, quote=True)
    seo = '\n<link rel="canonical" href="' + esc(target_url) + '">\n'
    seo += ''.join('<link rel="alternate" hreflang="' + esc(lang) + '" href="' + esc(url) + '">\n' for lang, url in sorted(alternates.items()))
    seo += '<meta property="og:url" content="' + esc(target_url) + '">\n<meta property="og:locale" content="' + esc({'cs': 'cs_CZ', 'sk': 'sk_SK', 'pl': 'pl_PL', 'en': 'en_US'}.get(locale, locale)) + '">\n'
    if preview:
        seo += '<meta name="robots" content="noindex, follow">\n'
    patches.append((head['close_start'], head['close_start'], seo))
    patches.sort(key=lambda p: (p[0], p[1]))
    last_end = -1
    for start, end, _ in patches:
        if start < last_end:
            raise ValueError('Overlapping HTML localization patches')
        last_end = max(last_end, end)
    for start, end, replacement in reversed(patches):
        html = html[:start] + replacement + html[end:]
    return html

