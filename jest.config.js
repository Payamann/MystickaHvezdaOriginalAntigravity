/**
 * Jest Configuration for Mystická Hvězda Security Tests
 */

import { fileURLToPath } from 'node:url';

const projectRootPattern = fileURLToPath(new URL('.', import.meta.url)).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const ignoredCopies = ['production-release-v2', '.tmp', '.claude/worktrees', '.codex-tmp', '.codex-worktrees']
    .map(folder => projectRootPattern + folder.replaceAll('/', '[/\\\\]') + '[/\\\\]');

export default {
    testEnvironment: 'node',
    testTimeout: 30000,
    collectCoverageFrom: [
        'server/**/*.js',
        '!server/tests/**',
        '!server/node_modules/**'
    ],
    coverageThreshold: {
        global: {
            branches: 0,
            functions: 0,
            lines: 0,
            statements: 0
        }
    },
    testMatch: [
        '**/server/tests/**/*.test.js'
    ],
    testPathIgnorePatterns: ignoredCopies,
    modulePathIgnorePatterns: ignoredCopies,
    setupFilesAfterEnv: ['./server/tests/setup.mjs'],
    transform: {}
};
