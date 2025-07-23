module.exports = {
  root: true,
  env: {
    node: true,
    es2021: true,
    browser: true,
  },
  extends: [
    'eslint:recommended',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'no-console': 'off',
    'no-unused-vars': 'off',
  },
  ignorePatterns: [
    'dist',
    'node_modules',
    '**/*.js',
    '**/*.d.ts',
    '**/*.ts',
    '**/*.tsx',
  ],
};