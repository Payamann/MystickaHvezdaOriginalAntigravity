import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';

export function assetBytes(bytes) {
    return Buffer.from(bytes.toString('utf8').replace(/\r\n?/g, '\n'));
}

export function assetHash(bytes) {
    return createHash('sha256').update(assetBytes(bytes)).digest('hex').slice(0, 16);
}

export function createAssetVersioning(root) {
    const base = path.resolve(root);
    const historyPath = path.join(base, 'server/config/asset-history.json');
    const history = fs.existsSync(historyPath) ? JSON.parse(fs.readFileSync(historyPath, 'utf8')) : { assets: {} };
    function localFile(pathname) {
        const target = path.resolve(base, `.${pathname}`);
        return target.startsWith(base + path.sep) ? target : null;
    }
    function versionUrl(value, pagePath) {
        if (/^(?:[a-z]+:|\/\/|#)/i.test(value)) return value;
        const url = new URL(value.replace(/&amp;/g, '&'), `https://local.invalid${pagePath}`);
        if (!/\.(?:js|css)$/i.test(url.pathname)) return value;
        const file = localFile(decodeURIComponent(url.pathname));
        if (!file || !fs.existsSync(file) || !fs.statSync(file).isFile()) return value;
        const hash = assetHash(fs.readFileSync(file));
        url.pathname = url.pathname.replace(/\.(js|css)$/i, `.mh-${hash}.$1`);
        url.searchParams.delete('v');
        return `${url.pathname}${url.search}${url.hash}`.replace(/&/g, '&amp;');
    }
    function html(source, pagePath) {
        return source.replace(/<(?:script|link)\b[^>]*>/gi, tag => tag.replace(
            /\b(src|href)\s*=\s*(["'])([^"']+)\2/gi,
            (_, attr, quote, value) => `${attr}=${quote}${versionUrl(value, pagePath)}${quote}`
        ));
    }
    function asset(req, res, next) {
        const match = req.path.match(/^(.*)\.mh-([a-f0-9]{16})\.(js|css)$/i);
        if (!match || !['GET', 'HEAD'].includes(req.method)) return next();
        const file = localFile(decodeURIComponent(`${match[1]}.${match[3]}`));
        if (!file) {
            return res.status(404).set('Cache-Control', 'no-store').end();
        }
        let bytes = fs.existsSync(file) && fs.statSync(file).isFile() ? assetBytes(fs.readFileSync(file)) : null;
        // Never serve a different release under an immutable URL.
        if (!bytes || assetHash(bytes) !== match[2]) {
            const key = `${match[1]}.${match[3]}#${match[2]}`;
            const retained = history.assets[key];
            if (!retained) return res.status(404).set('Cache-Control', 'no-store').end();
            bytes = gunzipSync(Buffer.from(retained, 'base64'));
            if (assetHash(bytes) !== match[2]) return res.status(404).set('Cache-Control', 'no-store').end();
        }
        res.type(match[3]).set('Cache-Control', 'public, max-age=31536000, immutable').send(bytes);
    }
    return { html, asset, localFile };
}
