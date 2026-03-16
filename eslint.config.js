export default [
  {
    ignores: ['node_modules/', 'js/dist/', '.claude/', 'css/', 'img/', '*.html']
  },
  {
    files: ['server/**/*.js', 'js/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        DOMPurify: 'readonly',
        // Node globals
        global: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly'
      }
    },
    rules: {
      // Security rules (errors)
      'no-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',
      'no-with': 'error',

      // Code quality rules (warnings)
      'no-unused-vars': ['warn', { args: 'after-used' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'eqeqeq': ['warn', 'always'],

      // Style rules (off)
      'indent': 'off',
      'quotes': 'off',
      'semi': 'off',
      'comma-dangle': 'off',
      'keyword-spacing': 'off',
      'space-before-blocks': 'off',
      'object-curly-spacing': 'off',
      'array-bracket-spacing': 'off',
      'key-spacing': 'off',
      'arrow-spacing': 'off',
      'space-infix-ops': 'off',
      'prefer-const': 'off',
      'no-var': 'off'
    }
  }
];
