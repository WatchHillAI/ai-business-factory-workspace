module.exports = {
  extends: ['../../.eslintrc.js'],
  rules: {
    // Component library specific rules
    '@typescript-eslint/explicit-module-boundary-types': 'warn', // Enforce for library exports
  },
  ignorePatterns: ['!**/*', 'dist', 'node_modules'],
};