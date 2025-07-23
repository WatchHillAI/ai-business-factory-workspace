const baseConfig = require('../../jest.config.base');

module.exports = {
  ...baseConfig,
  displayName: 'ui-components',
  rootDir: '.',
  setupFilesAfterEnv: ['../../jest.setup.js'],
  
  // Transform configuration
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.spec.json',
    }],
  },
  
  // Coverage
  coverageDirectory: '../../coverage/packages/ui-components',
};