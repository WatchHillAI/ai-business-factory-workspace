module.exports = {
  extends: ['../../.eslintrc.js'],
  ignorePatterns: ['!**/*', 'dist', 'node_modules', 'vite.config.ts'],
  env: {
    browser: true,
    es2021: true,
  },
  rules: {
    'no-unused-vars': 'warn',
  },
};