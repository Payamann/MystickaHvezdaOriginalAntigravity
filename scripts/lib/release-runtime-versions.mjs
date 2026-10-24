export const RELEASE_RUNTIME_VERSIONS = new Map([
    ['core', '20261021-footer-support-locale'],
    ['components', '20261021-footer-support-locale'],
    ['auth-client', '20261020-02-register-password-policy'],
    ['templates', '20261021-celtic-footer-star-svg'],
    ['horoscope', '20261020-journal-context-consent']
]);

export function isOlderRuntimeVersion(currentVersion, expectedVersion) {
    if (!currentVersion) return true;
    if (currentVersion === expectedVersion) return false;
    const current = /^(\d{8})(?:-(\d+))?(?:-|$)/.exec(currentVersion);
    const expected = /^(\d{8})(?:-(\d+))?(?:-|$)/.exec(expectedVersion);
    if (current && expected) {
        const currentDate = Number(current[1]);
        const expectedDate = Number(expected[1]);
        if (currentDate !== expectedDate) return currentDate < expectedDate;
        return Number(current[2] ?? 0) < Number(expected[2] ?? 0);
    }
    if (/^\d+$/.test(currentVersion) && /^\d+$/.test(expectedVersion)) {
        return Number(currentVersion) < Number(expectedVersion);
    }
    return true;
}

export function refreshRuntimeAssetReferences(content) {
    return content.replace(/(js\/dist\/(core|components|auth-client|templates|horoscope)\.js)(?:\?v=([^&"'\s]+))?/g,
        (match, assetPath, assetName, currentVersion) => {
            const expectedVersion = RELEASE_RUNTIME_VERSIONS.get(assetName);
            return isOlderRuntimeVersion(currentVersion, expectedVersion)
                ? `${assetPath}?v=${expectedVersion}`
                : match;
        });
}
