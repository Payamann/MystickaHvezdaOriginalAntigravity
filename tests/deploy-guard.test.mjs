import test from 'node:test';
import assert from 'node:assert/strict';
import { selectPushRun, evaluatePushRun, fetchAllPages } from '../scripts/deploy-guard.mjs';

const run = { id: 10, run_number: 10, run_attempt: 1, head_sha: 'abc', head_branch: 'main', event: 'push', path: '.github/workflows/ci.yml', status: 'completed', conclusion: 'success' };
const jobs = ['Lint Code', 'Run Tests', 'Build Assets'].map((name) => ({ name, status: 'completed', conclusion: 'success' }));

test('selects exact workflow, SHA, branch and push event despite newer nightly failure', () => {
    const unrelated = [
        { event: 'schedule', conclusion: 'failure' }, { event: 'workflow_dispatch' },
        { head_sha: 'other' }, { head_branch: 'other' }, { path: '.github/workflows/other.yml' },
    ].map((change) => ({ ...run, run_number: 99, ...change }));
    assert.equal(selectPushRun([...unrelated, run], 'abc', 'main'), run);
    assert.equal(selectPushRun(unrelated, 'abc', 'main'), null);
});

test('newest push run and newest attempt win even when unsuccessful', () => {
    const newer = { ...run, id: 11, run_number: 11, conclusion: 'failure' };
    const attempt = { ...newer, run_attempt: 2, status: 'in_progress', conclusion: null };
    assert.equal(selectPushRun([run, newer, attempt], 'abc', 'main'), attempt);
    assert.equal(evaluatePushRun(attempt, jobs), 'pending');
    assert.throws(() => evaluatePushRun(newer, jobs), /concluded failure/);
});

test('only completed successful required jobs pass; intended push skips remain valid', () => {
    assert.equal(evaluatePushRun(run, [...jobs, { name: 'E2E (chromium / core)', status: 'completed', conclusion: 'skipped' }, { name: 'Production Smoke Test', status: 'completed', conclusion: 'skipped' }]), 'success');
    assert.equal(evaluatePushRun(null, []), 'pending');
    assert.throws(() => evaluatePushRun(run, jobs.slice(1)), /Required push CI job/);
    assert.throws(() => evaluatePushRun(run, [...jobs, jobs[0]]), /duplicated/);
    for (const conclusion of ['skipped', 'failure', 'cancelled', 'timed_out', 'action_required', 'neutral', null]) {
        assert.throws(() => evaluatePushRun(run, [{ ...jobs[0], conclusion }, ...jobs.slice(1)]), /Required push CI job/);
        assert.throws(() => evaluatePushRun({ ...run, conclusion }, jobs), /concluded/);
    }
    assert.throws(() => evaluatePushRun(run, [{ ...jobs[0], status: 'in_progress' }, ...jobs.slice(1)]), /incomplete/);
});

test('no failed push job is hidden by scheduled-job naming or unrelated names', () => {
    for (const name of ['E2E (chromium / core)', 'Production Smoke Test', 'Security scan']) {
        assert.throws(() => evaluatePushRun(run, [...jobs, { name, status: 'completed', conclusion: 'failure' }]), /jobs are incomplete or failed/);
    }
    assert.throws(() => evaluatePushRun(run, [...jobs, { name: 'Security scan', status: 'completed', conclusion: 'skipped' }]), /jobs are incomplete or failed/);
});

test('pagination reads all pages and refuses malformed or unbounded responses', async () => {
    const urls = [];
    const result = await fetchAllPages('https://example.test/jobs?filter=all', 'jobs', async (url) => {
        urls.push(url);
        return { jobs: urls.length === 1 ? Array(100).fill({ id: 1 }) : [{ id: 2 }] };
    });
    assert.equal(result.length, 101);
    assert.match(urls[1], /&per_page=100&page=2$/);
    await assert.rejects(fetchAllPages('https://example.test', 'jobs', async () => ({})), /Missing GitHub/);
    let count = 0;
    await assert.rejects(fetchAllPages('https://example.test', 'jobs', async () => {
        count++;
        return { jobs: Array(100).fill({}) };
    }), /safe limit/);
    assert.equal(count, 100);
});
