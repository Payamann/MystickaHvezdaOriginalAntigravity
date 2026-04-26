/**
 * Jest Configuration for Mystická Hvězda Security Tests
 */

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
        '<rootDir>/server/tests/**/*.test.js'
    ],
    modulePathIgnorePatterns: [
        '<rootDir>/.claude/worktrees/'
    ],
    setupFilesAfterEnv: ['./server/tests/setup.mjs'],
    transform: {}
};
