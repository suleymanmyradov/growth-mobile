const expoConfig = require('eslint-config-expo/flat');
const i18nextPlugin = require('eslint-plugin-i18next');

module.exports = [
  ...expoConfig,
  {
    plugins: {
      i18next: i18nextPlugin,
    },
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['src/features/*'],
              message:
                'Features must not import other features directly. Use core APIs or a public index.ts barrel.',
            },
          ],
        },
      ],
      // Flag hardcoded user-facing strings in JSX text so i18n regressions are
      // caught at lint time. Uses jsx-text-only mode (least noisy): only plain
      // text between JSX tags is checked, not string attributes or non-JSX
      // strings. String attributes like accessibilityLabel must be reviewed
      // manually. See https://github.com/edvardchen/eslint-plugin-i18next.
      'i18next/no-literal-string': [
        'error',
        {
          mode: 'jsx-text-only',
          framework: 'react',
          'should-validate-template': false,
        },
      ],
      // axios.create is the correct API — the caution is a false positive.
      'import/no-named-as-default-member': 'off',
    },
  },
  {
    // core must not import features or app routes (dependency direction rule).
    // App layer owns the wiring between core and features (e.g. passing
    // feature-owned API functions as callbacks into core hooks).
    files: ['src/core/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/*', 'src/features/*', '@/app/*', 'app/*'],
              message:
                'core must not import features or app. Invert the dependency: pass callbacks from the app layer, move the API function into core, or use events.',
            },
          ],
        },
      ],
    },
  },
  {
    // features must not import app routes or reach into other features'
    // internals via relative paths. Public barrel imports (@/features/<name>)
    // are allowed only when a public surface is genuinely needed.
    files: ['src/features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/app/*', 'app/*', 'src/features/*'],
              message:
                'Features must not import app routes or reach into other features internals. Use core APIs or a public @/features/<name> barrel.',
            },
          ],
        },
      ],
    },
  },
  {
    // Test files: allow jest globals and disable the i18n literal-string rule
    // (test fixtures are not user-facing strings).
    files: ['**/__tests__/**', '**/*.test.ts', '**/*.test.tsx', 'jest.setup.js', 'jest.config.js'],
    languageOptions: {
      globals: {
        jest: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
    },
    rules: {
      'i18next/no-literal-string': 'off',
    },
  },
  {
    ignores: ['node_modules/**', 'dist/**', '.expo/**', 'src/core/api/generated/**'],
  },
];
