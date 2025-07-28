const { workspaceRoot } = require('@nx/devkit');

module.exports = {
  testMatch: ['**/+(*.)+(spec|test).+(ts|js)?(x)'],
  resolver: '@nx/jest/plugins/resolver',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  testEnvironment: 'jsdom',
  collectCoverageFrom: [
    '**/*.{ts,tsx,js,jsx}',
    '!**/*.d.ts', 
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/dist/**',
    '!**/*.config.{ts,js}',
  ],
  coverageReporters: ['html'],
  passWithNoTests: true,
  // Global test setup
  setupFilesAfterEnv: [`${workspaceRoot}/jest.setup.js`],
};