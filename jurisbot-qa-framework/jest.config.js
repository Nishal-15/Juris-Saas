module.exports = {
  testEnvironment: 'node',
  verbose: true,
  collectCoverage: true,
  coverageDirectory: 'reports/coverage/backend',
  coverageReporters: ['text', 'json', 'html'],
  testMatch: [
    '**/tests/unit/backend/**/*.test.js',
    '**/tests/integration/**/*.test.js'
  ],
  setupFilesAfterEnv: ['./tests/unit/backend/setup.js'],
};
