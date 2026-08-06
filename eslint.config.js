import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import prettierPlugin from 'eslint-plugin-prettier'
import prettierConfig from 'eslint-config-prettier'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores([
    'dist',
    // Generated: Playwright's HTML report bundles minified vendor code, and
    // the Supabase CLI writes Deno sources into supabase/.temp.
    'playwright-report',
    'test-results',
    'blob-report',
    'supabase/.temp',
  ]),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      'prettier/prettier': 'error',
    },
  },
  {
    // Tests and their helpers are never part of the component graph, so Fast
    // Refresh has no opinion worth enforcing here. Underscore-prefixed
    // parameters are the usual "present for the signature, unused" marker,
    // which mock implementations need constantly.
    files: [
      '**/*.{test,spec}.{ts,tsx}',
      'src/test/**/*.{ts,tsx}',
      'tests/**/*.{ts,tsx}',
    ],
    rules: {
      'react-refresh/only-export-components': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  prettierConfig,
])
