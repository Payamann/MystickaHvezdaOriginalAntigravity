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
            branches: 50,
            functions: 50,
            lines: 50,
            statements: 50
        }
    },
    testMatch: [
        '**/server/tests/**/*.test.js'
    ],
    setupFilesAfterEnv: ['./server/tests/setup.js'],
    transform: {}
};
