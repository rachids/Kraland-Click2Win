import js from '@eslint/js';
import globals from 'globals';
import prettier from 'eslint-config-prettier';

export default [
  {
    ignores: ['dist/**', 'coverage/**', 'node_modules/**'],
  },
  js.configs.recommended,
  {
    // Browser-facing source: ES modules, DOM available.
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: globals.browser,
    },
    rules: {
      'no-var': 'error',
      'prefer-const': 'error',
      eqeqeq: ['error', 'always'],
      'no-implicit-globals': 'error',
      'no-undef': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    // Layer boundary: the game logic must never reach for the DOM.
    files: ['src/core/**/*.js', 'src/systems/**/*.js', 'src/data/**/*.js', 'src/config/**/*.js'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {},
    },
    rules: {
      'no-restricted-globals': [
        'error',
        { name: 'document', message: 'Logic layers must stay DOM-free. Move this to src/ui/.' },
        { name: 'window', message: 'Logic layers must stay DOM-free. Move this to src/ui/.' },
      ],
    },
  },
  {
    // Tests and tool configs run in Node.
    files: ['tests/**/*.js', '*.config.js', 'vite.config.js', 'vitest.config.js'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: globals.node,
    },
  },
  prettier,
];
