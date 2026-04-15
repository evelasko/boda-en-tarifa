module.exports = {
  testEnvironment: "node",
  testMatch: ["**/test/integration/**/*.int.test.cjs"],
  clearMocks: true,
  testTimeout: 30000,
  maxWorkers: 1,
};
