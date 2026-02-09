export default [
    {
        files: ['server/**/*.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                console: 'readonly',
                process: 'readonly',
                setTimeout: 'readonly',
                clearTimeout: 'readonly',
                URL: 'readonly',
            }
        },
        rules: {
            'no-eval': 'error',
            'no-implied-eval': 'error',
            'no-new-func': 'error',
            'no-var': 'warn',
            'prefer-const': 'warn',
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            'eqeqeq': ['warn', 'always'],
        }
    },
    {
        files: ['js/**/*.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'script',
            globals: {
                window: 'readonly',
                document: 'readonly',
                localStorage: 'readonly',
                sessionStorage: 'readonly',
                navigator: 'readonly',
                fetch: 'readonly',
                console: 'readonly',
                setTimeout: 'readonly',
                clearTimeout: 'readonly',
                setInterval: 'readonly',
                clearInterval: 'readonly',
                requestAnimationFrame: 'readonly',
                performance: 'readonly',
                AbortController: 'readonly',
                location: 'readonly',
                confirm: 'readonly',
                alert: 'readonly',
                Chart: 'readonly',
                API_CONFIG: 'readonly',
            }
        },
        rules: {
            'no-eval': 'error',
            'no-implied-eval': 'error',
            'no-new-func': 'error',
            'no-var': 'warn',
            'prefer-const': 'warn',
            'eqeqeq': ['warn', 'always'],
        }
    },
    {
        ignores: ['node_modules/', 'tests/', '*.min.js']
    }
];
