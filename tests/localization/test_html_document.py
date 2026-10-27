import json
import re
import unittest

from scripts.localization.html_document import extract_page, render_page, segment_hash, validate_translation


class HtmlDocumentTests(unittest.TestCase):
    def render(self, source, translations=None, **kwargs):
        values = {s['id']: s['text'] for s in extract_page(source)} if translations is None else translations
        return render_page(source, values, locale='sk', source_url='https://example.cz/blog/page.html',
                           target_url='https://example.cz/sk/blog/page.html',
                           alternates={'cs': 'https://example.cz/blog/page.html', 'sk': 'https://example.cz/sk/blog/page.html'}, **kwargs)

    def test_lossless_content_and_entity_roundtrip(self):
        source = '<!DOCTYPE html><html lang="cs"><head><title>A &amp; B</title></head><body>\n  A &amp; B  <p title="A &quot;B&quot;">Text</p><script>let x="<p>";</script><style>p{color:red}</style><code>code</code><svg><text>svg</text></svg></body></html>'
        segments = extract_page(source)
        self.assertIn('A & B', [s['text'] for s in segments])
        self.assertNotIn('code', [s['text'] for s in segments])
        out = self.render(source)
        self.assertIn('\n  A &amp; B  <p title="A &quot;B&quot;">Text</p>', out)
        self.assertIn('<script>let x="<p>";</script><style>p{color:red}</style>', out)
        self.assertIn('<html lang="sk">', out)

    def test_coverage_is_exact(self):
        source = '<html><head><title>Title</title></head><body>Body</body></html>'
        with self.assertRaises(ValueError):
            self.render(source, {})
        values = {s['id']: s['text'] for s in extract_page(source)}
        values['unknown'] = 'extra'
        with self.assertRaises(ValueError):
            self.render(source, values)

    def test_validation_protects_values(self):
        source = 'Cena 199 Kč pro {name}, {{ value }}, ${thing}, %s https://example.cz/a'
        validate_translation(source, source.replace('Cena', 'Price'))
        for target in ('', source.replace('199', '299'), source.replace('Kč', 'EUR'),
                       source.replace('{name}', '{other}'), source + ' https://evil.test/', '<b>Hello</b>'):
            with self.subTest(target=target), self.assertRaises(ValueError):
                validate_translation(source, target)

    def test_attribute_escaping_and_unquoted_values(self):
        source = '<html><head><title>Title</title></head><body><img alt=Hello><p title="Hello">Hello</p></body></html>'
        values = {s['id']: 'A "quoted" & safe' for s in extract_page(source)}
        out = self.render(source, values)
        self.assertIn('alt="A &quot;quoted&quot; &amp; safe"', out)
        self.assertIn('title="A &quot;quoted&quot; &amp; safe"', out)
        values[next(iter(values))] = '<script>alert(1)</script>'
        with self.assertRaises(ValueError):
            self.render(source, values)

    def test_urls_seo_and_czech_marker(self):
        source = '<html><head><link rel="canonical" href="old"><link rel="alternate" hreflang="de" href="old"><meta name="robots" content="index"><meta property="og:url" content="old"></head><body><img src="../img/a.webp" srcset="../img/a.webp 1x, ../img/b.webp 2x"><a href="../tarot.html">Tarot</a><a href="../other.html">Other</a><a href="#anchor">Anchor</a></body></html>'
        out = self.render(source, link_map={'https://example.cz/tarot.html': 'https://example.cz/sk/tarot.html'})
        self.assertIn('src="/img/a.webp"', out)
        self.assertIn('/img/b.webp 2x', out)
        self.assertIn('href="/sk/tarot.html">Tarot</a>', out)
        self.assertIn('Other <span class="destination-language" lang="cs">(CZ)</span>', out)
        self.assertIn('href="#anchor">Anchor</a>', out)
        self.assertEqual(out.count('rel="canonical"'), 1)
        self.assertIn('noindex, follow', out)
        self.assertIn('content="sk_SK"', out)
        self.assertNotIn('hreflang="de"', out)
        self.assertNotIn('noindex', self.render(source, preview=False))

    def test_url_mapping_preserves_query_fragment_and_local_assets(self):
        source = '<html><head><script src="../js/app.js?v=7"></script><link rel="stylesheet" href="../css/app.css"></head><body><a href="../horoskopy.html?source=guide&amp;feature=moon#daily">Horoscope</a><a href="https://external.test/path?q=a#b">External</a><a href="../other.html?q=a#b">Czech</a><video src="https://example.cz/media/a.mp4" poster="../img/poster.webp"></video><form action="../submit"></form><img srcset="../img/a.webp 1x, https://cdn.test/b.webp 2x"></body></html>'
        segments = extract_page(source)
        out = self.render(source, link_map={'https://example.cz/horoskopy.html': 'https://example.cz/sk/horoskopy.html'})
        self.assertIn('href="/sk/horoskopy.html?source=guide&amp;feature=moon#daily">Horoscope</a>', out)
        self.assertIn('href="https://external.test/path?q=a#b">External</a>', out)
        self.assertIn('href="/other.html?q=a#b">Czech <span', out)
        self.assertEqual(out.count('(CZ)'), 1)
        self.assertIn('src="/js/app.js?v=7"', out)
        self.assertIn('href="/css/app.css"', out)
        self.assertIn('src="/media/a.mp4" poster="/img/poster.webp"', out)
        self.assertIn('action="/submit"', out)
        self.assertIn('srcset="/img/a.webp 1x, https://cdn.test/b.webp 2x"', out)
        self.assertIn('rel="canonical" href="https://example.cz/sk/blog/page.html"', out)
        self.assertEqual(segments, extract_page(source))

    def test_jsonld_fields_and_faq_sync(self):
        obj = {'@context': 'https://schema.org', '@type': 'FAQPage', 'url': 'https://example.cz/blog/page.html',
               '@id': 'https://example.cz/blog/page.html#faq', 'datePublished': '2026-10-01',
               'publisher': {'@type': 'Organization', 'name': 'Mystická Hvězda', 'description': 'Brand text'},
               'mainEntity': [{'@type': 'Question', 'name': 'Question', 'acceptedAnswer': {'@type': 'Answer', 'text': 'Answer'}}]}
        source = '<html><head><script type="application/ld+json">' + json.dumps(obj) + '</script></head><body><h2>Question</h2><p>Answer</p></body></html>'
        segments = extract_page(source)
        self.assertNotIn('Mystická Hvězda', [s['text'] for s in segments])
        self.assertNotIn('Brand text', [s['text'] for s in segments])
        values = {s['id']: {'Question': 'Otázka', 'Answer': 'Odpoveď'}.get(s['text'], s['text']) for s in segments}
        out = self.render(source, values)
        data = json.loads(re.search(r'application/ld\+json">(.*?)</script>', out).group(1))
        self.assertEqual(data['mainEntity'][0]['name'], 'Otázka')
        self.assertEqual(data['mainEntity'][0]['acceptedAnswer']['text'], 'Odpoveď')
        self.assertIn('<h2>Otázka</h2><p>Odpoveď</p>', out)
        self.assertEqual(data['@id'], 'https://example.cz/sk/blog/page.html#faq')
        self.assertEqual(data['datePublished'], '2026-10-01')
        json_question = next(s['id'] for s in segments if '/json/' in s['id'] and s['text'] == 'Question')
        values[json_question] = 'Iná otázka'
        with self.assertRaisesRegex(ValueError, 'FAQ JSON-LD'):
            self.render(source, values)

    def test_malformed_json_fails_closed(self):
        for content in ('{bad}', '', '   '):
            with self.subTest(content=content), self.assertRaises(ValueError):
                extract_page('<html><head><script type="application/ld+json">' + content + '</script></head></html>')

    def test_hidden_source_and_entity_whitespace(self):
        source = '<html><head></head><body><p>&nbsp;Hello&#160;</p><p hidden>Hidden</p><div translate="no"><p title="Keep">Keep</p></div><p aria-hidden="true">Decor</p><input type="submit" value="Send"></body></html>'
        segments = extract_page(source)
        self.assertEqual([s['text'] for s in segments], ['Hello', 'Send'])
        values = {s['id']: {'Hello': 'Ahoj', 'Send': 'Odoslať'}[s['text']] for s in segments}
        out = self.render(source, values)
        self.assertIn('&nbsp;Ahoj&#160;', out)
        self.assertIn('<p title="Keep">Keep</p>', out)

    def test_stable_ids_and_hash_invalidation(self):
        first = extract_page('<html><head><title>Title</title></head><body><p>One</p><p>Two</p></body></html>')
        second = extract_page('<html><head><title>Title</title></head><body><p>Changed</p><p>Two</p></body></html>')
        self.assertEqual([s['id'] for s in first], [s['id'] for s in second])
        self.assertEqual(segment_hash(first[-1]), segment_hash(second[-1]))
        self.assertNotEqual(segment_hash(first[-2]), segment_hash(second[-2]))

    def test_managed_source_hreflang_does_not_change_render_or_segments(self):
        source = '<html lang="cs"><head><title>Title</title></head><body><p>Body</p></body></html>'
        managed = source.replace('</head>', '<link rel="alternate" hreflang="cs" href="https://example.cz/blog/page.html">\n<link rel="alternate" hreflang="sk" href="https://example.cz/sk/blog/page.html">\n</head>')
        self.assertEqual(extract_page(source), extract_page(managed))
        self.assertEqual(self.render(source), self.render(managed))


if __name__ == '__main__':
    unittest.main()
