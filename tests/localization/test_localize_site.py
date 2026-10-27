"""Isolated offline contract tests; never call a translation provider."""
import contextlib
import importlib.util
import io
import json
from pathlib import Path
import sys
import tempfile
import unittest
from types import SimpleNamespace
from unittest.mock import patch

SCRIPTS = Path(__file__).resolve().parents[2] / 'scripts'
if str(SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SCRIPTS))
SPEC = importlib.util.spec_from_file_location('localize_site_test_subject', SCRIPTS / 'localize_site.py')
cli = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(cli)


class LocalizeSiteTests(unittest.TestCase):
    def setUp(self):
        # The Windows sandbox's OS temp directory may have restricted child ACLs.
        # Keep isolated, automatically removed projects in the writable workspace.
        test_temp = SCRIPTS.parent / '.tmp/localization-tests'
        test_temp.mkdir(parents=True, exist_ok=True)
        self.temporary = tempfile.TemporaryDirectory(prefix='offline-', dir=test_temp)
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.source = '<!doctype html><html lang="cs"><head><title>Průvodce</title><meta name="description" content="Český popis"></head><body><h1>Jak to funguje</h1><p>Cena je 199 Kč.</p><p>Další text</p></body></html>'
        (self.root / 'guide.html').write_text(self.source, encoding='utf-8')
        self.manifest = {'version': 1, 'sourceLanguage': 'cs', 'origin': 'https://www.mystickahvezda.cz',
                         'policyVersion': 'test-v1', 'locales': {'sk': 'Slovak', 'pl': 'Polish', 'en': 'English'},
                         'existingRoutes': {}, 'pages': [{'id': 'guide', 'source': 'guide.html',
                         'reviewRequired': True, 'targets': {lang: lang + '/guide.html' for lang in ('sk', 'pl', 'en')}}]}
        self.write_manifest()
        self.selection = cli.selected(self.manifest)
        self.page = self.manifest['pages'][0]

    def write_manifest(self):
        path = self.root / cli.MANIFEST
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(self.manifest), encoding='utf-8')

    def import_file(self, locale='sk', mutate=None):
        _, segments, source_hash = cli.page_data(self.root, self.page)
        envelope = {'sourceHash': source_hash, 'translations': {s['id']: locale + ' ' + s['text'] for s in segments}}
        if mutate:
            mutate(envelope)
        path = self.root / ('import-' + locale + '.json')
        path.write_text(json.dumps(envelope, ensure_ascii=False), encoding='utf-8')
        return path

    def seed(self):
        for locale in self.page['targets']:
            cli.import_translations(self.root, self.manifest, [(self.page, locale)], self.import_file(locale))

    def snapshot(self):
        return {str(p.relative_to(self.root)): p.read_bytes() for p in self.root.rglob('*') if p.is_file()}

    def approve(self):
        cli.render_selection(self.root, self.manifest, self.selection, approve=True)

    def test_cached_sync_needs_no_provider_or_request_budget(self):
        self.seed()
        with patch.object(cli.subprocess, 'run') as provider:
            self.assertEqual(cli.translate_missing(self.root, self.manifest, self.selection, 0, 0)['requests'], 0)
            provider.assert_not_called()

    def test_provider_receives_only_changed_segments_then_cache_is_reused(self):
        self.seed()
        (self.root / 'guide.html').write_text(self.source.replace('Další text', 'Nový text'), encoding='utf-8')
        requests = []
        def provider(*args, **kwargs):
            value = json.loads(kwargs['input'])
            requests.append(value)
            return SimpleNamespace(returncode=0, stdout=json.dumps({'translations': {s['id']: value['locale'] + ' ' + s['text'] for s in value['segments']}}))
        with patch.object(cli.shutil, 'which', return_value='node'), patch.object(cli.subprocess, 'run', side_effect=provider):
            result = cli.translate_missing(self.root, self.manifest, self.selection, 3, 1000)
        self.assertEqual(result['requests'], 3)
        self.assertTrue(all([s['text'] for s in request['segments']] == ['Nový text'] for request in requests))
        self.assertTrue(all(row['missing'] == 0 for row in cli.make_plan(self.root, self.manifest, self.selection)))

    def test_changed_price_from_provider_does_not_modify_any_cache(self):
        self.seed()
        (self.root / 'guide.html').write_text(self.source.replace('199', '299'), encoding='utf-8')
        before = self.snapshot()
        def provider(*args, **kwargs):
            value = json.loads(kwargs['input'])
            return SimpleNamespace(returncode=0, stdout=json.dumps({'translations': {s['id']: 'Cena je 199 Kč.' for s in value['segments']}}))
        with patch.object(cli.shutil, 'which', return_value='node'), patch.object(cli.subprocess, 'run', side_effect=provider):
            with self.assertRaises(ValueError):
                cli.translate_missing(self.root, self.manifest, self.selection, 3, 1000)
        self.assertEqual(before, self.snapshot())

    def test_exact_import_and_only_changed_cache_miss(self):
        manifest = cli.load_manifest(self.root)
        before = cli.make_plan(self.root, manifest, [(self.page, 'sk')])[0]
        self.assertGreater(before['missing'], 1)
        self.seed()
        self.assertEqual(cli.make_plan(self.root, manifest, self.selection)[0]['missing'], 0)
        old_keys = set(cli.read_cache(self.root, 'sk')['entries'])
        (self.root / 'guide.html').write_text(self.source.replace('Další text', 'Změněný text'), encoding='utf-8')
        after = cli.make_plan(self.root, manifest, self.selection)
        self.assertTrue(all(row['missing'] == 1 for row in after))
        self.assertNotEqual(before['sourceHash'], after[0]['sourceHash'])
        self.assertEqual(old_keys, set(cli.read_cache(self.root, 'sk')['entries']))

    def test_invalid_imports_never_write_cache(self):
        self.seed()
        mutations = [lambda x: x.update(sourceHash='stale'),
                     lambda x: x['translations'].pop(next(iter(x['translations']))),
                     lambda x: x['translations'].update(extra='Unexpected'),
                     lambda x: x['translations'].update({next(iter(x['translations'])): '<b>Unsafe</b>'}),
                     lambda x: x['translations'].update({next(k for k, v in x['translations'].items() if '199' in v): 'Cena 299 Kč.'})]
        for mutate in mutations:
            with self.subTest(mutation=mutate):
                filename = self.import_file(mutate=mutate)
                before = self.snapshot()
                with self.assertRaises(ValueError):
                    cli.import_translations(self.root, self.manifest, [(self.page, 'sk')], filename)
                self.assertEqual(before, self.snapshot())

    def test_default_cli_render_is_noindex_preview_and_source_untouched(self):
        self.seed()
        before = (self.root / 'guide.html').read_bytes()
        with contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(cli.main(['render', '--root', str(self.root)]), 0)
        self.assertEqual(before, (self.root / 'guide.html').read_bytes())
        for locale, target in self.page['targets'].items():
            self.assertFalse((self.root / target).exists())
            output = (self.root / '.tmp/localization-preview' / target).read_text(encoding='utf-8')
            self.assertIn('noindex, follow', output)
            self.assertIn('lang="' + locale + '"', output)
            self.assertTrue(output.startswith(cli.GENERATED))

    def test_approval_hashes_then_publish_all_variants(self):
        self.seed()
        self.approve()
        reviews = cli.read_json(self.root / 'data/localization/reviews.json')
        for page, locale in self.selection:
            _, segments, source_hash = cli.page_data(self.root, page)
            translations, _ = cli.translations_for(self.manifest, segments, cli.read_cache(self.root, locale))
            self.assertEqual(reviews['pages']['guide/' + locale], {'sourceHash': source_hash, 'translationHash': cli.digest(translations)})
            self.assertFalse((self.root / page['targets'][locale]).exists())
        cli.render_selection(self.root, self.manifest, self.selection, publish=True)
        all_paths = ['guide.html'] + list(self.page['targets'].values())
        for target in all_paths:
            output = (self.root / target).read_text(encoding='utf-8')
            self.assertNotIn('noindex', output)
            for locale, path in {'cs': 'guide.html', **self.page['targets']}.items():
                self.assertIn('hreflang="' + locale + '"', output)
                self.assertIn(self.manifest['origin'] + '/' + path, output)
        routes = self.root / 'data/localization/routes.json'
        self.assertTrue(routes.exists(), 'Publishing must record generated routes')
        route_data = cli.read_json(routes)
        for locale, target in self.page['targets'].items():
            self.assertEqual(route_data[locale]['/guide.html'], '/' + target)

    def test_publish_refuses_missing_stale_approval_and_partial_selection(self):
        self.seed()
        before = self.snapshot()
        with self.assertRaises(ValueError):
            cli.render_selection(self.root, self.manifest, self.selection, publish=True)
        self.assertEqual(before, self.snapshot())

        self.approve()
        before = self.snapshot()
        with self.assertRaises(ValueError):
            cli.render_selection(self.root, self.manifest, [(self.page, 'sk')], publish=True)
        self.assertEqual(before, self.snapshot())
        self.import_file('sk')
        cache_path = self.root / 'data/localization/cache/sk.json'
        cache = cli.read_json(cache_path)
        first = next(iter(cache['entries'].values()))
        first['translation'] += ' nově'
        cache_path.write_text(json.dumps(cache), encoding='utf-8')
        before = self.snapshot()
        with self.assertRaises(ValueError):
            cli.render_selection(self.root, self.manifest, self.selection, publish=True)
        self.assertEqual(before, self.snapshot())

    def test_publish_check_and_republish_are_byte_identical(self):
        self.seed()
        self.approve()
        original_segments = cli.page_data(self.root, self.page)[1:]
        with contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(cli.main(['render', '--root', str(self.root), '--publish']), 0)
        self.assertEqual(original_segments, cli.page_data(self.root, self.page)[1:])
        first_release = self.snapshot()
        with contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(cli.main(['check', '--root', str(self.root), '--publish']), 0)
            self.assertEqual(cli.main(['render', '--root', str(self.root), '--publish']), 0)
        self.assertEqual(first_release, self.snapshot())

    def test_publish_refuses_hand_maintained_target_without_partial_writes(self):
        self.seed()
        self.approve()
        target = self.root / 'en/guide.html'
        target.parent.mkdir()
        target.write_text('Hand-maintained English page', encoding='utf-8')
        before = self.snapshot()
        with self.assertRaises(ValueError):
            cli.render_selection(self.root, self.manifest, self.selection, publish=True)
        self.assertEqual(before, self.snapshot())

    def test_source_change_requires_fresh_approval_even_after_reimport(self):
        self.seed()
        self.approve()
        (self.root / 'guide.html').write_text(self.source.replace('Další text', 'Změněný text'), encoding='utf-8')
        self.seed()
        before = self.snapshot()
        with self.assertRaisesRegex(ValueError, 'review'):
            cli.render_selection(self.root, self.manifest, self.selection, publish=True)
        self.assertEqual(before, self.snapshot())

    def test_publication_write_failure_rolls_back_all_file_content(self):
        self.seed()
        self.approve()
        before = self.snapshot()
        replace = cli.os.replace
        calls = []

        def fail_second_write(source, target):
            calls.append(str(target))
            if len(calls) == 2:
                raise OSError('Simulated disk write failure')
            return replace(source, target)

        with patch.object(cli.os, 'replace', side_effect=fail_second_write):
            with self.assertRaises(OSError):
                cli.render_selection(self.root, self.manifest, self.selection, publish=True)
        self.assertGreaterEqual(len(calls), 2)
        self.assertEqual(before, self.snapshot(), 'A failed release must restore source/routes/outputs together')

    def test_preflight_limits_stop_before_subprocess_or_api_discovery(self):
        for requests, characters in ((0, 100000), (1, 0), (100, 1), (1, 100000)):
            with self.subTest(requests=requests, characters=characters), patch.object(cli.subprocess, 'run') as run, patch.object(cli.shutil, 'which') as which:
                before = self.snapshot()
                with self.assertRaisesRegex(ValueError, 'Preflight budget exceeded'):
                    cli.translate_missing(self.root, self.manifest, self.selection, requests, characters)
                run.assert_not_called()
                which.assert_not_called()
                self.assertEqual(before, self.snapshot())

    def test_manifest_path_escape_and_unsafe_origin_rejected(self):
        mutations = [lambda m: m.update(origin='https://evil.test'),
                     lambda m: m['pages'][0].update(source='../outside.html'),
                     lambda m: m['pages'][0]['targets'].update(sk='sk/../../outside.html'),
                     lambda m: m['pages'][0]['targets'].update(sk='https://evil.test/a.html'),
                     lambda m: m['pages'][0]['targets'].update(sk='pl/guide.html')]
        original = json.loads(json.dumps(self.manifest))
        for mutate in mutations:
            with self.subTest(mutation=mutate):
                self.manifest = json.loads(json.dumps(original))
                mutate(self.manifest)
                self.write_manifest()
                before = self.snapshot()
                with self.assertRaises(ValueError):
                    cli.load_manifest(self.root)
                self.assertEqual(before, self.snapshot())


if __name__ == '__main__':
    unittest.main()
