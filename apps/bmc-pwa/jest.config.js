const baseConfig = require('../../jest.config.base');

module.exports = {
  ...baseConfig,
  displayName: 'bmc-pwa',
  rootDir: '.',
  setupFilesAfterEnv: ['../../jest.setup.js'],
  
  // Module name mapper with absolute imports
  moduleNameMapper: {
    ...baseConfig.moduleNameMapper,
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  
  // Transform configuration
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.spec.json',
    }],
  },
  
  // Coverage
  coverageDirectory: '../../coverage/apps/bmc-pwa',
};