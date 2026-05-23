module.exports = {
  testEnvironment: "node",
  testMatch: ["**/test/integration/**/*.int.test.cjs"],
  setupFiles: ["<rootDir>/test/helpers/setup-emulator-env.cjs"],
  clearMocks: true,
  testTimeout: 30000,
  maxWorkers: 1,
};
