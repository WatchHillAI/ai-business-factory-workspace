module.exports = {
  extends: ['../../.eslintrc.js'],
  ignorePatterns: ['!**/*', 'dist', 'lambda-deployment.zip', 'lambda-fixed.zip', 'lambda-package'],
  overrides: [
    {
      files: ['*.ts', '*.tsx', '*.js', '*.jsx'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-unused-vars': 'warn',
      },
    },
  ],
};