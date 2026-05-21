import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FEATURE_CATALOG } from '../server/config/growth-loop.js';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ignoredDirs = new Set(['.git', '.claude', 'node_modules', 'dist']);
const scannedExtensions = new Set(['.html', '.js']);
const scanRoots = [
    rootDir,
    path.join(rootDir, 'components'),
    path.join(rootDir, 'js')
];

function collectFiles(dir, files = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) {
            if (ignoredDirs.has(entry.name)) continue;
            collectFiles(path.join(dir, entry.name), files);
            continue;
        }

        if (scannedExtensions.has(path.extname(entry.name))) {
            files.push(path.join(dir, entry.name));
        }
    }

    return files;
}

function extractBlock(source, declarationName) {
    const declarationMatch = new RegExp(`const\\s+${declarationName}\\s*=`).exec(source);
    if (!declarationMatch) return '';
    const declarationStart = declarationMatch.index;

    const objectStart = source.indexOf('{', declarationStart);
    if (objectStart === -1) return '';

    let depth = 0;
    for (let index = objectStart; index < source.length; index += 1) {
        const char = source[index];
        if (char === '{') depth += 1;
        if (char === '}') depth -= 1;
        if (depth === 0) {
            return source.slice(objectStart + 1, index);
        }
    }

    return '';
}

function extractObjectKeys(block) {
    const keys = new Set();
    let depth = 0;
    let quote = null;
    let escaped = false;

    for (const line of block.split(/\r?\n/)) {
        const match = depth === 0
            ? line.trim().match(/^'?([a-z0-9_-]+)'?\s*:/)
            : null;

        if (match) keys.add(match[1]);
        if (!match && depth === 0) {
            const shorthandMatch = line.trim().match(/^([a-zA-Z_$][\w$]*)\s*,?\s*(?:\/\/.*)?$/);
            if (shorthandMatch) keys.add(shorthandMatch[1]);
        }

        for (const char of line) {
            if (escaped) {
                escaped = false;
                continue;
            }

            if (quote) {
                if (char === '\\') {
                    escaped = true;
                } else if (char === quote) {
                    quote = null;
                }
                continue;
            }

            if (char === '"' || char === "'" || char === '`') {
                quote = char;
            } else if (char === '{') {
                depth += 1;
            } else if (char === '}') {
                depth = Math.max(0, depth - 1);
            }
        }
    }

    return keys;
}

function extractObjectPaths(block, groupName) {
    const paths = [];
    let depth = 0;
    let quote = null;
    let escaped = false;
    let currentKey = null;

    for (const line of block.split(/\r?\n/)) {
        const keyMatch = depth === 0
            ? line.trim().match(/^'?([a-z0-9_-]+)'?\s*:/)
            : null;
        if (keyMatch) currentKey = keyMatch[1];

        const pathMatch = currentKey
            ? line.match(/path\s*:\s*['"]([^'"]+)['"]/)
            : null;
        if (pathMatch) {
            paths.push({ group: groupName, key: currentKey, routePath: pathMatch[1] });
        }

        for (const char of line) {
            if (escaped) {
                escaped = false;
                continue;
            }

            if (quote) {
                if (char === '\\') {
                    escaped = true;
                } else if (char === quote) {
                    quote = null;
                }
                continue;
            }

            if (char === '"' || char === "'" || char === '`') {
                quote = char;
            } else if (char === '{') {
                depth += 1;
            } else if (char === '}') {
                depth = Math.max(0, depth - 1);
            }
        }

        if (depth === 0) currentKey = null;
    }

    return paths;
}

function extractAssignedObjectKeys(source, objectName) {
    const keys = new Set();
    const assignPattern = new RegExp(`Object\\.assign\\(${objectName},\\s*\\{([\\s\\S]*?)\\}\\);`, 'g');

    for (const match of source.matchAll(assignPattern)) {
        for (const key of extractObjectKeys(match[1])) {
            keys.add(key);
        }
    }

    return keys;
}

function extractAssignedObjectPaths(source, objectName, groupName) {
    const paths = [];
    const assignPattern = new RegExp(`Object\\.assign\\(${objectName},\\s*\\{([\\s\\S]*?)\\}\\);`, 'g');

    for (const match of source.matchAll(assignPattern)) {
        paths.push(...extractObjectPaths(match[1], groupName));
    }

    return paths;
}

function unionSets(...sets) {
    return new Set(sets.flatMap((set) => [...set]));
}

function routeExists(routePath) {
    if (!routePath?.startsWith('/')) return true;
    const cleanPath = routePath.split('?')[0].split('#')[0];
    return fs.existsSync(path.join(rootDir, cleanPath.slice(1)));
}

function lineForIndex(source, index) {
    return source.slice(0, index).split(/\r?\n/).length;
}

function findClosingToken(source, openIndex, openChar, closeChar) {
    let depth = 0;
    let quote = null;
    let escaped = false;

    for (let index = openIndex; index < source.length; index += 1) {
        const char = source[index];
        if (escaped) {
            escaped = false;
            continue;
        }

        if (quote) {
            if (char === '\\') {
                escaped = true;
            } else if (char === quote) {
                quote = null;
            }
            continue;
        }

        if (char === '"' || char === "'" || char === '`') {
            quote = char;
        } else if (char === openChar) {
            depth += 1;
        } else if (char === closeChar) {
            depth -= 1;
            if (depth === 0) return index;
        }
    }

    return -1;
}

function splitTopLevelArgs(source) {
    const args = [];
    let start = 0;
    let roundDepth = 0;
    let squareDepth = 0;
    let curlyDepth = 0;
    let quote = null;
    let escaped = false;

    for (let index = 0; index < source.length; index += 1) {
        const char = source[index];
        if (escaped) {
            escaped = false;
            continue;
        }

        if (quote) {
            if (char === '\\') {
                escaped = true;
            } else if (char === quote) {
                quote = null;
            }
            continue;
        }

        if (char === '"' || char === "'" || char === '`') {
            quote = char;
        } else if (char === '(') {
            roundDepth += 1;
        } else if (char === ')') {
            roundDepth = Math.max(0, roundDepth - 1);
        } else if (char === '[') {
            squareDepth += 1;
        } else if (char === ']') {
            squareDepth = Math.max(0, squareDepth - 1);
        } else if (char === '{') {
            curlyDepth += 1;
        } else if (char === '}') {
            curlyDepth = Math.max(0, curlyDepth - 1);
        } else if (char === ',' && roundDepth === 0 && squareDepth === 0 && curlyDepth === 0) {
            args.push(source.slice(start, index).trim());
            start = index + 1;
        }
    }

    const tail = source.slice(start).trim();
    if (tail) args.push(tail);
    return args;
}

function collectDirectCheckoutContextIssues(source, file) {
    const issues = [];
    const callPattern = /window\.Auth\.startPlanCheckout\s*\(/g;
    const requiredKeys = ['source', 'feature', 'redirect', 'metadata'];

    for (const match of source.matchAll(callPattern)) {
        const openIndex = source.indexOf('(', match.index);
        const closeIndex = findClosingToken(source, openIndex, '(', ')');
        if (openIndex === -1 || closeIndex === -1) {
            issues.push(`${path.relative(rootDir, file)}:${lineForIndex(source, match.index || 0)} could not parse startPlanCheckout call`);
            continue;
        }

        const args = splitTopLevelArgs(source.slice(openIndex + 1, closeIndex));
        const contextArg = (args[1] || '').trim();
        if (!contextArg) {
            issues.push(`${path.relative(rootDir, file)}:${lineForIndex(source, match.index || 0)} missing checkout context object`);
            continue;
        }

        if (!contextArg.startsWith('{')) continue;

        const objectEnd = findClosingToken(contextArg, 0, '{', '}');
        if (objectEnd === -1) {
            issues.push(`${path.relative(rootDir, file)}:${lineForIndex(source, match.index || 0)} could not parse checkout context object`);
            continue;
        }

        const objectSource = contextArg.slice(1, objectEnd);
        const keys = extractObjectKeys(objectSource);
        const missingKeys = requiredKeys.filter((key) => !keys.has(key));
        if (missingKeys.length) {
            issues.push(`${path.relative(rootDir, file)}:${lineForIndex(source, match.index || 0)} missing ${missingKeys.join(', ')}`);
        }
    }

    return issues;
}

const scannedFiles = [
    ...fs.readdirSync(rootDir, { withFileTypes: true })
        .filter((entry) => entry.isFile() && entry.name.endsWith('.html'))
        .map((entry) => path.join(rootDir, entry.name)),
    ...scanRoots
        .filter((dir) => dir !== rootDir && fs.existsSync(dir))
        .flatMap((dir) => collectFiles(dir))
];

const allowedAuthTokenReferenceFiles = new Set([
    path.join(rootDir, 'js', 'profile', 'shared.js')
]);

const usedFeatures = new Set();
const authTokenReferences = [];
const checkoutContextIssues = [];
for (const file of scannedFiles) {
    if (file.includes(`${path.sep}js${path.sep}dist${path.sep}`)) continue;
    const source = fs.readFileSync(file, 'utf8');
    checkoutContextIssues.push(...collectDirectCheckoutContextIssues(source, file));

    if (!allowedAuthTokenReferenceFiles.has(file)) {
        const lines = source.split(/\r?\n/);
        lines.forEach((line, index) => {
            if (/\bAuth\??\.token\b/.test(line)) {
                authTokenReferences.push(`${path.relative(rootDir, file)}:${index + 1}`);
            }
        });
    }

    for (const match of source.matchAll(/[?&]feature=([a-z0-9_-]+)/g)) {
        usedFeatures.add(match[1]);
    }

    for (const match of source.matchAll(/(?:^|[^a-zA-Z0-9_])feature\s*[:=]\s*['"]([a-z0-9_-]+)['"]/g)) {
        usedFeatures.add(match[1]);
    }

    for (const match of source.matchAll(/searchParams\.set\(['"]feature['"],\s*['"]([a-z0-9_-]+)['"]\)/g)) {
        usedFeatures.add(match[1]);
    }

    if (source.includes('const FEATURE_MAP')) {
        for (const match of source.matchAll(/['"][a-z0-9_-]+['"]\s*:\s*['"]([a-z0-9_-]+)['"]/g)) {
            usedFeatures.add(match[1]);
        }
    }
}

const loginSource = fs.readFileSync(path.join(rootDir, 'js', 'prihlaseni.js'), 'utf8');
const authClientSource = fs.readFileSync(path.join(rootDir, 'js', 'auth-client.js'), 'utf8');
const growthClientSource = fs.readFileSync(path.join(rootDir, 'js', 'growth-loop-client.js'), 'utf8');
const onboardingSource = fs.readFileSync(path.join(rootDir, 'js', 'onboarding.js'), 'utf8');
const pricingSource = fs.readFileSync(path.join(rootDir, 'js', 'cenik.js'), 'utf8');
const premiumGatesSource = fs.readFileSync(path.join(rootDir, 'js', 'premium-gates.js'), 'utf8');
for (const feature of extractObjectKeys(extractBlock(pricingSource, 'FALLBACK_FEATURE_PLAN_MAP'))) {
    usedFeatures.add(feature);
}
for (const feature of extractObjectKeys(extractBlock(premiumGatesSource, 'featurePaywalls'))) {
    usedFeatures.add(feature);
}
const featureLabels = unionSets(
    extractObjectKeys(extractBlock(loginSource, 'FEATURE_LABELS')),
    extractAssignedObjectKeys(loginSource, 'FEATURE_LABELS')
);
const signupContexts = unionSets(
    extractObjectKeys(extractBlock(loginSource, 'SIGNUP_CONTEXT_BY_FEATURE')),
    extractAssignedObjectKeys(loginSource, 'SIGNUP_CONTEXT_BY_FEATURE')
);
const signupSources = extractObjectKeys(extractBlock(loginSource, 'SIGNUP_CONTEXT_BY_SOURCE'));
const activationFeatureBlock = extractBlock(authClientSource, 'featureMap');
const activationSourceBlock = extractBlock(authClientSource, 'sourceMap');
const activationFeatures = unionSets(
    extractObjectKeys(activationFeatureBlock),
    extractAssignedObjectKeys(authClientSource, 'featureMap')
);
const activationSources = extractObjectKeys(activationSourceBlock);
const activationOptionalFeatures = new Set(['account']);

const missingLabels = [...usedFeatures].filter((feature) => !featureLabels.has(feature)).sort();
const missingContexts = [...usedFeatures].filter((feature) => !signupContexts.has(feature)).sort();
const missingActivationFeatures = [...signupContexts]
    .filter((feature) => !activationOptionalFeatures.has(feature))
    .filter((feature) => !activationFeatures.has(feature))
    .sort();
const missingActivationSources = [...signupSources]
    .filter((source) => !activationSources.has(source))
    .sort();
const missingActivationPaths = [
    ...extractObjectPaths(activationFeatureBlock, 'featureMap'),
    ...extractAssignedObjectPaths(authClientSource, 'featureMap', 'featureMap'),
    ...extractObjectPaths(activationSourceBlock, 'sourceMap')
]
    .filter(({ routePath }) => routePath.startsWith('/'))
    .filter(({ routePath }) => !fs.existsSync(path.join(rootDir, routePath.slice(1))))
    .map(({ group, key, routePath }) => `${group}.${key}: ${routePath}`)
    .sort();
const missingOnboardingPaths = [
    ...onboardingSource.matchAll(/(?:withSource|new URL)\(\s*['"]([^'"]+\.html)['"]/g)
]
    .map((match) => match[1])
    .filter((routePath) => routePath.startsWith('/'))
    .filter((routePath, index, all) => all.indexOf(routePath) === index)
    .filter((routePath) => !fs.existsSync(path.join(rootDir, routePath.slice(1))))
    .sort();
const growthClientFallbackFeatures = extractObjectKeys(extractBlock(growthClientSource, 'FALLBACK_FEATURES'));
const growthLoopActivationFeatures = Object.values(FEATURE_CATALOG)
    .filter((feature) => feature.activationStep === 'first_value');
const missingGrowthClientFallbackFeatures = growthLoopActivationFeatures
    .filter((feature) => !growthClientFallbackFeatures.has(feature.id))
    .map((feature) => feature.id)
    .sort();
const missingGrowthLoopManifestPaths = growthLoopActivationFeatures
    .filter((feature) => !routeExists(feature.primaryPath))
    .map((feature) => `${feature.id}: ${feature.primaryPath}`)
    .sort();

if (
    missingLabels.length ||
    missingContexts.length ||
    missingActivationFeatures.length ||
    missingActivationSources.length ||
    missingActivationPaths.length ||
    missingOnboardingPaths.length ||
    missingGrowthClientFallbackFeatures.length ||
    missingGrowthLoopManifestPaths.length ||
    authTokenReferences.length ||
    checkoutContextIssues.length
) {
    console.error('[auth-feature-contexts] Missing auth feature coverage.');
    if (missingLabels.length) console.error(`Missing FEATURE_LABELS: ${missingLabels.join(', ')}`);
    if (missingContexts.length) console.error(`Missing SIGNUP_CONTEXT_BY_FEATURE: ${missingContexts.join(', ')}`);
    if (missingActivationFeatures.length) console.error(`Missing post-auth activation features: ${missingActivationFeatures.join(', ')}`);
    if (missingActivationSources.length) console.error(`Missing post-auth activation sources: ${missingActivationSources.join(', ')}`);
    if (missingActivationPaths.length) console.error(`Missing post-auth activation target pages: ${missingActivationPaths.join(', ')}`);
    if (missingOnboardingPaths.length) console.error(`Missing onboarding target pages: ${missingOnboardingPaths.join(', ')}`);
    if (missingGrowthClientFallbackFeatures.length) console.error(`Missing growth-loop client fallback features: ${missingGrowthClientFallbackFeatures.join(', ')}`);
    if (missingGrowthLoopManifestPaths.length) console.error(`Missing growth-loop manifest target pages: ${missingGrowthLoopManifestPaths.join(', ')}`);
    if (authTokenReferences.length) console.error(`Disallowed Auth.token references: ${authTokenReferences.join(', ')}`);
    if (checkoutContextIssues.length) console.error(`Incomplete direct startPlanCheckout context: ${checkoutContextIssues.join('; ')}`);
    process.exitCode = 1;
} else {
    console.log(`[auth-feature-contexts] OK: ${usedFeatures.size} feature context(s) covered and activation/onboarding targets exist.`);
}
