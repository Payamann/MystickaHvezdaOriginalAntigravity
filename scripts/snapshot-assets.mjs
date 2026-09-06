// Retain content-addressed public JS/CSS for open pages across deployments.
// This deterministic generated archive is committed with each release.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { assetBytes, assetHash } from '../server/utils/asset-versioning.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'server/config/asset-history.json');
const history = fs.existsSync(output) ? JSON.parse(fs.readFileSync(output, 'utf8')) : { assets: {} };
function collect(dir) {
    for (const item of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
        const file = path.join(dir, item.name);
        if (item.isDirectory()) collect(file);
        else if (item.isFile() && /\.(js|css)$/i.test(item.name)) {
            const bytes = assetBytes(fs.readFileSync(file));
            const name = '/' + path.relative(root, file).replace(/\\/g, '/');
            history.assets[`${name}#${assetHash(bytes)}`] = gzipSync(bytes, { level: 9 }).toString('base64');
        }
    }
}
for (const folder of ['js', 'css', 'fonts']) collect(path.join(root, folder));
history.assets = Object.fromEntries(Object.entries(history.assets).sort(([a], [b]) => a.localeCompare(b)));
fs.writeFileSync(output, JSON.stringify(history, null, 2) + '\n');
console.log(`[assets] Retained ${Object.keys(history.assets).length} public asset versions`);
