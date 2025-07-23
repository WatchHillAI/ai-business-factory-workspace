const baseConfig = require('../../jest.config.base');

module.exports = {
  ...baseConfig,
  displayName: 'ai-agents',
  rootDir: '.',
  testEnvironment: 'node',
  setupFilesAfterEnv: [],
  
  // Transform configuration
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.spec.json',
    }],
  },
  
  // Coverage
  coverageDirectory: '../../coverage/packages/ai-agents',
};