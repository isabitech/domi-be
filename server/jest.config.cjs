module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src/tests'],
  moduleFileExtensions: ['js', 'json'],
  testTimeout: 60000,
  verbose: true,
  maxWorkers: 1,
  testMatch: ['**/formulas.test.js']
};