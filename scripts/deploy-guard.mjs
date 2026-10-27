import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const DEFAULT_REPO = 'Payamann/MystickaHvezdaOriginalAntigravity';
const DEFAULT_BASE_URL = 'https://www.mystickahvezda.cz';
const DEFAULT_TIMEOUT_MS = 12 * 60 * 1000;
const DEFAULT_POLL_MS = 15 * 1000;

function parseArgs(argv) {
    const args = {
        branch: 'main',
        remote: 'origin',
        repo: process.env.GITHUB_REPOSITORY || DEFAULT_REPO,
        baseUrl: process.env.VERIFY_BASE_URL || DEFAULT_BASE_URL,
        timeoutMs: Number(process.env.DEPLOY_GUARD_TIMEOUT_MS || DEFAULT_TIMEOUT_MS),
        pollMs: Number(process.env.DEPLOY_GUARD_POLL_MS || DEFAULT_POLL_MS),
        skipRemote: false,
        skipRailway: false,
        skipSmoke: false,
        allowDirty: false
    };

    for (const arg of argv) {
        if (arg.startsWith('--sha=')) args.sha = arg.slice('--sha='.length);
        else if (arg.startsWith('--branch=')) args.branch = arg.slice('--branch='.length);
        else if (arg.startsWith('--remote=')) args.remote = arg.slice('--remote='.length);
        else if (arg.startsWith('--repo=')) args.repo = arg.slice('--repo='.length);
        else if (arg.startsWith('--base-url=')) args.baseUrl = arg.slice('--base-url='.length).replace(/\/$/, '');
        else if (arg.startsWith('--timeout-ms=')) args.timeoutMs = Number(arg.slice('--timeout-ms='.length));
        else if (arg.startsWith('--poll-ms=')) args.pollMs = Number(arg.slice('--poll-ms='.length));
        else if (arg === '--skip-remote') args.skipRemote = true;
        else if (arg === '--skip-railway') args.skipRailway = true;
        else if (arg === '--skip-smoke') args.skipSmoke = true;
        else if (arg === '--allow-dirty') args.allowDirty = true;
    }

    return args;
}

function git(args) {
    return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

function currentSha() {
    return git(['rev-parse', 'HEAD']);
}

function isWorkingTreeClean() {
    return git(['status', '--porcelain']) === '';
}

function remoteBranchSha(remote, branch) {
    const output = git(['ls-remote', remote, `refs/heads/${branch}`]);
    return output.split(/\s+/)[0] || null;
}

async function fetchJson(url) {
    const headers = {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'mysticka-hvezda-deploy-guard'
    };
    if (process.env.GITHUB_TOKEN) {
        headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const response = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) {
        throw new Error(`${url} returned ${response.status}`);
    }

    return response.json();
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function checkRunSummary(checkRuns) {
    return checkRuns
        .map((run) => `${run.name}:${run.status}/${run.conclusion || 'pending'}`)
        .join(' | ');
}

function isAllowedSkippedCheckRun(run) {
    return [
        /^E2E \(/,
        /^Production Smoke Test$/,
    ].some((pattern) => pattern.test(run.name || ''));
}

function hasFailingCheckRun(checkRuns) {
    return checkRuns.some((run) => {
        if (run.conclusion === 'skipped') return !isAllowedSkippedCheckRun(run);
        return ['failure', 'cancelled', 'timed_out', 'action_required'].includes(run.conclusion);
    });
}

const CI_WORKFLOW = '.github/workflows/ci.yml';
const REQUIRED_JOBS = ['Lint Code', 'Run Tests', 'Build Assets'];

export function selectPushRun(runs, sha, branch) {
    return runs.filter((run) => run.head_sha === sha && run.head_branch === branch &&
        run.event === 'push' && run.path === CI_WORKFLOW)
        .sort((a, b) => b.run_number - a.run_number || b.run_attempt - a.run_attempt)[0] || null;
}

export function evaluatePushRun(run, jobs) {
    if (!run || run.status !== 'completed') return 'pending';
    if (run.conclusion !== 'success') throw new Error(`Push CI run ${run.id} concluded ${run.conclusion}`);
    for (const name of REQUIRED_JOBS) {
        const matches = jobs.filter((job) => job.name === name);
        if (matches.length !== 1 || matches[0].status !== 'completed' || matches[0].conclusion !== 'success') {
            throw new Error(`Required push CI job ${name} is missing, duplicated, incomplete, or unsuccessful`);
        }
    }
    if (jobs.some((job) => job.status !== 'completed') || hasFailingCheckRun(jobs)) {
        throw new Error(`Push CI jobs are incomplete or failed: ${checkRunSummary(jobs)}`);
    }
    return 'success';
}

export async function fetchAllPages(url, key, getJson = fetchJson) {
    const items = [];
    for (let page = 1; page <= 100; page++) {
        const data = await getJson(`${url}${url.includes('?') ? '&' : '?'}per_page=100&page=${page}`);
        if (!Array.isArray(data[key])) throw new Error(`Missing GitHub ${key} response`);
        items.push(...data[key]);
        if (data[key].length < 100) return items;
    }
    throw new Error(`GitHub ${key} pagination exceeded safe limit`);
}

async function waitForChecks({ repo, sha, branch, timeoutMs, pollMs }) {
    const deadline = Date.now() + timeoutMs;
    let lastSummary = 'no matching push CI run';
    const reported = new Set();

    while (Date.now() < deadline) {
        const runs = await fetchAllPages(`https://api.github.com/repos/${repo}/actions/workflows/ci.yml/runs?head_sha=${encodeURIComponent(sha)}`, 'workflow_runs');
        for (const diagnostic of runs.filter((run) => run.head_sha === sha && run.event !== 'push')) {
            const summary = `${diagnostic.event} run ${diagnostic.id} attempt ${diagnostic.run_attempt}: ${diagnostic.status}/${diagnostic.conclusion || 'pending'} ${diagnostic.html_url}`;
            if (!reported.has(summary)) {
                console.log(`[checks:separate-diagnostic] ${summary}`);
                reported.add(summary);
            }
        }
        const run = selectPushRun(runs, sha, branch);
        lastSummary = run ? `push run ${run.id} attempt ${run.run_attempt}: ${run.status}/${run.conclusion || 'pending'}` : 'no matching push CI run';
        console.log(`[checks] ${lastSummary}`);
        if (run?.status === 'completed') {
            // Pin jobs to this attempt; never mix scheduled runs or earlier reruns.
            const jobs = await fetchAllPages(`https://api.github.com/repos/${repo}/actions/runs/${run.id}/attempts/${run.run_attempt}/jobs`, 'jobs');
            evaluatePushRun(run, jobs);
            console.log(`[checks] ${checkRunSummary(jobs)}`);
            return jobs;
        }
        await sleep(pollMs);
    }

    throw new Error(`Timed out waiting for GitHub checks: ${lastSummary}`);
}

async function waitForRailwayStatus({ repo, sha, timeoutMs, pollMs }) {
    const deadline = Date.now() + timeoutMs;
    let latest = null;

    while (Date.now() < deadline) {
        const data = await fetchJson(`https://api.github.com/repos/${repo}/commits/${sha}/status`);
        latest = data.statuses?.[0] || null;
        const description = latest?.description || 'no deployment status yet';
        console.log(`[railway] state=${data.state} desc="${description}"`);

        if (data.state === 'success') return data;
        if (data.state === 'failure' || data.state === 'error') {
            throw new Error(`Railway deployment status failed: ${description}`);
        }

        await sleep(pollMs);
    }

    throw new Error(`Timed out waiting for Railway status: ${latest?.description || 'no status'}`);
}

async function assertHttpOk(url, options = {}) {
    const response = await fetch(url, {
        redirect: 'follow',
        headers: {
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
            ...(options.headers || {})
        }
    });
    const text = await response.text();
    if (!response.ok) {
        throw new Error(`${url} returned HTTP ${response.status}`);
    }
    return { response, text };
}

async function fetchLiveDeploymentCommit(baseUrl) {
    const normalizedBase = baseUrl.replace(/\/$/, '');
    try {
        const health = await assertHttpOk(`${normalizedBase}/api/health`, {
            headers: { Accept: 'application/json' }
        });
        const healthBody = JSON.parse(health.text);
        return healthBody.deployment?.commit || null;
    } catch (error) {
        return `unavailable: ${error.message}`;
    }
}

async function runSmokeChecks(baseUrl, expectedSha = null) {
    const normalizedBase = baseUrl.replace(/\/$/, '');
    const health = await assertHttpOk(`${normalizedBase}/api/health`, {
        headers: { Accept: 'application/json' }
    });
    const healthBody = JSON.parse(health.text);
    if (healthBody.status !== 'ok') {
        throw new Error(`Health is not ok: ${health.text.slice(0, 240)}`);
    }
    const liveCommit = healthBody.deployment?.commit || null;
    if (expectedSha) {
        if (!liveCommit) {
            throw new Error(`Health deployment metadata missing. Expected ${expectedSha}, got none.`);
        }
        if (!liveCommit.startsWith(expectedSha) && !expectedSha.startsWith(liveCommit)) {
            throw new Error(`Health deployment commit mismatch. Expected ${expectedSha}, got ${liveCommit}.`);
        }
        console.log(`[smoke] deployment commit ok: ${liveCommit}`);
    }
    console.log(`[smoke] health ok: ${healthBody.timestamp || 'no timestamp'}`);

    const homepage = await assertHttpOk(`${normalizedBase}/`, {
        headers: { Accept: 'text/html' }
    });
    if (
        !homepage.text.includes('<html') ||
        !homepage.text.includes('lang="cs"') ||
        !homepage.text.includes('Mystick')
    ) {
        throw new Error('Homepage did not return expected HTML.');
    }
    console.log('[smoke] homepage ok');

    execFileSync(process.execPath, [
        'scripts/production-critical-assets-smoke.mjs',
        '--base-url',
        normalizedBase
    ], {
        stdio: 'inherit'
    });
}

async function main() {
    const args = parseArgs(process.argv.slice(2));
    const sha = args.sha || currentSha();

    console.log(`[deploy-guard] repo=${args.repo} remote=${args.remote}/${args.branch} sha=${sha}`);

    if (!args.skipRemote && !args.allowDirty && !isWorkingTreeClean()) {
        throw new Error('Working tree has uncommitted changes. Commit/push them or rerun with --allow-dirty if this is an intentional read-only check.');
    }

    if (!args.skipRemote) {
        const remoteSha = remoteBranchSha(args.remote, args.branch);
        if (remoteSha !== sha) {
            throw new Error(`${args.remote}/${args.branch} points to ${remoteSha}, expected ${sha}. Push HEAD to the deploy branch first.`);
        }
    }

    if (!args.skipRemote) await waitForChecks({ ...args, sha });
    if (!args.skipRailway) {
        try {
            await waitForRailwayStatus({ ...args, sha });
        } catch (error) {
            if (error.message.includes('Timed out waiting for Railway status')) {
                const liveCommit = await fetchLiveDeploymentCommit(args.baseUrl);
                throw new Error(`${error.message}. Production health currently reports deployment commit ${liveCommit || 'none'}; target is ${sha}. Check Railway GitHub integration/status for ${args.repo}@${sha}.`);
            }
            throw error;
        }
    }
    const smokeExpectedSha = args.skipRemote && args.skipRailway ? null : sha;
    if (!args.skipSmoke) await runSmokeChecks(args.baseUrl, smokeExpectedSha);

    console.log('[deploy-guard] DEPLOY OK');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch((error) => {
    console.error(`[deploy-guard] ${error.message}`);
    process.exit(1);
});
