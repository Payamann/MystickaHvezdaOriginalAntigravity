import { createAssetVersioning, assetHash } from '../utils/asset-versioning.js';
import fs from 'node:fs';
import path from 'node:path';
import request from 'supertest';
import app from '../index.js';
import os from 'node:os';
import { gzipSync } from 'node:zlib';
import express from 'express';

const root = process.cwd();
const versioning = createAssetVersioning(root);
const expected = assetHash(fs.readFileSync(path.join(root, 'js/dist/core.js')));

describe('Content-addressed application assets', () => {
    test('content changes change the version', () => {
        expect(assetHash('old')).not.toBe(assetHash('new'));
        expect(assetHash('same')).toBe(assetHash('same'));
        expect(assetHash('same\r\ntext')).toBe(assetHash('same\ntext'));
    });
    test('a retained release remains available after replacement or removal of the current file', async () => {
        const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'mh-asset-test-'));
        try {
            fs.mkdirSync(path.join(temp, 'server/config'), { recursive: true });
            fs.mkdirSync(path.join(temp, 'js'));
            const bytes = Buffer.from('window.retained = true;\n');
            const hash = assetHash(bytes);
            fs.writeFileSync(path.join(temp, 'server/config/asset-history.json'), JSON.stringify({
                assets: { [`/js/example.js#${hash}`]: gzipSync(bytes).toString('base64') }
            }));
            fs.writeFileSync(path.join(temp, 'js/example.js'), 'window.retained = false;');
            const server = express().use(createAssetVersioning(temp).asset);
            expect((await request(server).get(`/js/example.mh-${hash}.js`).expect(200)).text).toBe(bytes.toString());
            fs.unlinkSync(path.join(temp, 'js/example.js'));
            expect((await request(server).get(`/js/example.mh-${hash}.js`).expect(200)).text).toBe(bytes.toString());
        } finally {
            fs.rmSync(temp, { recursive: true, force: true });
        }
    });
    test('rewrites local relative assets, removes manual versions, preserves external assets', () => {
        const source = '<script src="../js/dist/core.js?v=old"></script><script src="https://example.com/x.js"></script>';
        expect(versioning.html(source, '/blog/article.html')).toBe(
            `<script src="/js/dist/core.mh-${expected}.js"></script><script src="https://example.com/x.js"></script>`
        );
        expect(versioning.localFile('/../secret')).toBeNull();
    });
    test('actual HTML references immutable assets whose bytes match the release', async () => {
        const page = await request(app).get('/cenik.html').expect(200);
        const url = page.text.match(/src="([^" ]+\.mh-[a-f0-9]{16}\.js[^" ]*)"/)[1];
        const asset = await request(app).get(url).expect(200);
        const hash = url.match(/\.mh-([a-f0-9]{16})\.js/)[1];
        expect(assetHash(Buffer.from(asset.text))).toBe(hash);
        expect(asset.headers['cache-control']).toContain('immutable');
    });
    test('wrong hashes fail closed rather than returning another release', async () => {
        const result = await request(app).get('/js/dist/core.mh-0000000000000000.js').expect(404);
        expect(result.headers['cache-control']).toBe('no-store');
    });
    test('legacy asset URLs revalidate instead of being immutable', async () => {
        const result = await request(app).get('/js/dist/core.js?v=old').expect(200);
        expect(result.headers['cache-control']).toBe('public, max-age=0, must-revalidate');
    });
});
