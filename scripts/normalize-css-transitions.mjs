import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const shouldCheck = process.argv.includes('--check');
const targets = [path.join(rootDir, 'css'), path.join(rootDir, 'templates')];
const sourceExtensions = new Set(['.css', '.html']);
const allTransitionPattern = /transition\s*:\s*all\s+([^;]+);/gi;
let changed = 0;
let remaining = 0;

function walk(dir, output = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(fullPath, output);
        if (
            entry.isFile()
            && sourceExtensions.has(path.extname(entry.name))
            && !entry.name.endsWith('.min.css')
        ) output.push(fullPath);
    }
    return output;
}

for (const file of targets.flatMap((target) => walk(target))) {
    const source = fs.readFileSync(file, 'utf8');
    const matches = source.match(allTransitionPattern) || [];
    remaining += matches.length;
    if (matches.length === 0 || shouldCheck) continue;

    const normalized = source.replace(allTransitionPattern, (_match, timing) => {
        const value = timing.trim();
        return `transition: color ${value}, background-color ${value}, border-color ${value}, transform ${value}, opacity ${value}, box-shadow ${value};`;
    });
    fs.writeFileSync(file, normalized, 'utf8');
    changed += 1;
}

if (shouldCheck && remaining > 0) {
    console.error(`[css-transitions] Found ${remaining} transition: all declaration(s). Run npm run normalize:css-transitions.`);
    process.exit(1);
}

console.log(shouldCheck
    ? '[css-transitions] OK: no transition: all declarations remain in source CSS/templates.'
    : `[css-transitions] Normalized ${remaining} declaration(s) in ${changed} file(s).`);
