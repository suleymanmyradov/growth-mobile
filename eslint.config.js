const expoConfig = require('eslint-config-expo/flat');

module.exports = [
  ...expoConfig,
  {
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
      // axios.create is the correct API — the caution is a false positive.
      'import/no-named-as-default-member': 'off',
    },
  },
  {
    // Test files: allow jest globals
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
  },
  {
    ignores: ['node_modules/**', 'dist/**', '.expo/**', 'src/core/api/generated/**'],
  },
];
