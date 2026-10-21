import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const version = '20261018-release-candidate';
const atlasWebVersion = '20261020-03-horoscope-day-switcher-atlas';
const atlasAstroVersion = '20261020-01-western-zodiac-image-cards';
const atlasRemainingVersion = '20261020-01-remaining-surface-polish';
const atlasArtVersion = '20261020-01-mobile-image-set';
const tarotAtlasVersion = '20261020-01-tarot-daily-surfaces';
const homepageBundleVersion = '20261018-home-legacy-card-cleanup';
const homepageBundleAsset = ['css', 'home.min.css'].join('/');
const atlasContentVersion = '2';
const atlasContentAsset = ['css', 'atlas-content.css'].join('/');
const atlasWebAsset = ['css', 'atlas-web.css'].join('/');
const write = process.argv.includes('--write');
const skippedDirectories = new Set(['.git', '.codex-tmp', 'node_modules', 'docs', 'reports']);
const assetPattern = /(css\/(?:style\.v2|site|home)\.min\.css|css\/atlas-content\.css)(?:\?v=([^&"'\s]+))?/g;
const atlasWebPattern = /(css\/atlas-web\.css)(?:\?v=([^&"'\s]+))?/g;
const atlasAstroPattern = /(css\/atlas-astro\.css)(?:\?v=([^&"'\s]+))?/g;
const atlasRemainingPattern = /(css\/atlas-remaining\.css)(?:\?v=([^&"'\s]+))?/g;
const atlasArtPattern = /(css\/atlas-art\.css)(?:\?v=([^&"'\s]+))?/g;
const tarotAtlasPattern = /(css\/tarot-atlas\.css)(?:\?v=([^&"'\s]+))?/g;
const changedFiles = [];

function isOlderVersion(currentVersion, expectedVersion) {
    if (!currentVersion) return true;
    if (currentVersion === expectedVersion) return false;

    const currentMatch = currentVersion.match(/^(\d{8})(?:-(\d+))?(?:-|$)/);
    const expectedMatch = expectedVersion.match(/^(\d{8})(?:-(\d+))?(?:-|$)/);
    if (currentMatch && expectedMatch) {
        const currentDate = Number(currentMatch[1]);
        const expectedDate = Number(expectedMatch[1]);
        if (currentDate !== expectedDate) return currentDate < expectedDate;

        const currentSequence = Number(currentMatch[2] ?? 0);
        const expectedSequence = Number(expectedMatch[2] ?? 0);
        return currentSequence < expectedSequence;
    }

    if (/^\d+$/.test(currentVersion) && /^\d+$/.test(expectedVersion)) {
        return Number(currentVersion) < Number(expectedVersion);
    }

    return true;
}

function refreshReference(_match, assetPath, currentVersion, expectedVersion) {
    return isOlderVersion(currentVersion, expectedVersion)
        ? `${assetPath}?v=${expectedVersion}`
        : `${assetPath}?v=${currentVersion}`;
}

async function visit(directory) {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
        if (entry.isDirectory()) {
            if (skippedDirectories.has(entry.name)) continue;
            await visit(path.join(directory, entry.name));
            continue;
        }

        if (!entry.isFile() || !['.html', '.mjs'].includes(path.extname(entry.name).toLowerCase())) continue;

        const filePath = path.join(directory, entry.name);
        const original = await fs.readFile(filePath, 'utf8');
        let updated = original.replace(assetPattern, (_match, assetPath, currentVersion) => {
            const assetVersion = assetPath === atlasContentAsset
                ? atlasContentVersion
                : assetPath.endsWith(homepageBundleAsset)
                    ? homepageBundleVersion
                    : version;
            return refreshReference(_match, assetPath, currentVersion, assetVersion);
        });
        if (['.html', '.mjs'].includes(path.extname(filePath).toLowerCase())) {
            updated = updated.replace(
                atlasWebPattern,
                (_match, assetPath, currentVersion) => refreshReference(_match, assetPath, currentVersion, atlasWebVersion)
            );
            updated = updated.replace(
                atlasAstroPattern,
                (_match, assetPath, currentVersion) => refreshReference(_match, assetPath, currentVersion, atlasAstroVersion)
            );
            updated = updated.replace(
                atlasRemainingPattern,
                (_match, assetPath, currentVersion) => refreshReference(_match, assetPath, currentVersion, atlasRemainingVersion)
            );
            updated = updated.replace(
                atlasArtPattern,
                (_match, assetPath, currentVersion) => refreshReference(_match, assetPath, currentVersion, atlasArtVersion)
            );
            updated = updated.replace(
                tarotAtlasPattern,
                (_match, assetPath, currentVersion) => refreshReference(_match, assetPath, currentVersion, tarotAtlasVersion)
            );
        }
        if (updated === original) continue;

        if (write) await fs.writeFile(filePath, updated, 'utf8');
        changedFiles.push(path.relative(rootDir, filePath));
    }
}

await visit(rootDir);

if (write) {
    console.log(`[css-asset-versions] Updated ${changedFiles.length} HTML/generator files (shared CSS v=${version}; atlas-content.css v=${atlasContentVersion}; atlas-web.css v=${atlasWebVersion}; atlas-astro.css v=${atlasAstroVersion}; atlas-remaining.css v=${atlasRemainingVersion}; atlas-art.css v=${atlasArtVersion}; tarot-atlas.css v=${tarotAtlasVersion}).`);
} else {
    console.log(`[css-asset-versions] ${changedFiles.length} HTML/generator files contain stale CSS asset references (shared CSS v=${version}; atlas-content.css v=${atlasContentVersion}; atlas-web.css v=${atlasWebVersion}; atlas-astro.css v=${atlasAstroVersion}; atlas-remaining.css v=${atlasRemainingVersion}; atlas-art.css v=${atlasArtVersion}; tarot-atlas.css v=${tarotAtlasVersion}).`);
    for (const file of changedFiles.slice(0, 30)) console.log(`- ${file}`);
    if (changedFiles.length) process.exitCode = 1;
}
