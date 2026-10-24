// Canonical cache keys for the TODO visual release. Keep page generators and
// the repository check/write script on this same version contract.
export const RELEASE_CSS_VERSION = '20261023-release-todo';

const VERSIONED_ASSETS = new Map([
    ['css/style.v2.min.css', RELEASE_CSS_VERSION],
    ['css/site.min.css', RELEASE_CSS_VERSION],
    ['css/home.min.css', RELEASE_CSS_VERSION],
    ['css/atlas-content.css', RELEASE_CSS_VERSION],
    ['css/atlas-web.css', RELEASE_CSS_VERSION],
    ['css/atlas-astro.css', RELEASE_CSS_VERSION],
    ['css/atlas-remaining.css', RELEASE_CSS_VERSION],
    ['css/atlas-art.css', RELEASE_CSS_VERSION],
    ['css/tarot-atlas.css', RELEASE_CSS_VERSION]
]);

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

export function refreshCssAssetReferences(content) {
    const pattern = /(css\/(?:style\.v2|site|home)\.min\.css|css\/atlas-content\.css|css\/atlas-(?:web|astro|remaining|art)\.css|css\/tarot-atlas\.css)(?:\?v=([^&"'\s]+))?/g;
    return content.replace(pattern, (match, assetPath, currentVersion) => {
        const expectedVersion = VERSIONED_ASSETS.get(assetPath);
        if (!expectedVersion || !isOlderVersion(currentVersion, expectedVersion)) return match;
        return `${assetPath}?v=${expectedVersion}`;
    });
}
