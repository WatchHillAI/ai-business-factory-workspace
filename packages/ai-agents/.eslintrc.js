module.exports = {
  extends: ['../../.eslintrc.js'],
  env: {
    node: true,
    browser: false,
  },
  rules: {
    // Node.js service specific rules
    'no-console': 'off', // Console is acceptable in backend services
    '@typescript-eslint/no-explicit-any': 'error', // Stricter for backend
  },
  ignorePatterns: ['!**/*', 'dist', 'lambda-deployment.zip', 'lambda-fixed.zip', 'lambda-package'],
};