module.exports = {
  extends: ['../../.eslintrc.js'],
  rules: {
    // PWA specific rules
    'react-refresh/only-export-components': 'off', // Temporary, can enable later
  },
  ignorePatterns: ['!**/*', 'dist', 'node_modules', 'vite.config.ts'],
};