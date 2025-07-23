module.exports = {
  extends: ['../../.eslintrc.js'],
  ignorePatterns: ['!**/*', 'dist', 'lambda-deployment.zip', 'lambda-fixed.zip', 'lambda-package'],
  rules: {
    'no-unused-vars': 'warn',
  },
};