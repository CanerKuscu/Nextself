module.exports = {
  testEnvironment: 'detox/runners/jest/testEnvironment',
  setupFilesAfterEnv: ['<rootDir>/setup.js'],
  testRunner: 'jest-circus/runner',
  testTimeout: 120000,
  reporters: ['detox/runners/jest/reporter'],
  verbose: true
};
