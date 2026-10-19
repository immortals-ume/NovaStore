import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['frontend/**', 'node_modules/**', 'template/**', 'uploads/**'] },
  js.configs.recommended,
  {
    files: ['backend/**/*.js', '*.js'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: globals.node },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'prefer-const': 'error',
      eqeqeq: ['error', 'smart'],
    },
  },
];
