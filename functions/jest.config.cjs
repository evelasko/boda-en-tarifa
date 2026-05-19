module.exports = {
  testEnvironment: "node",
  testMatch: ["**/test/**/*.test.cjs", "**/test/**/*.test.js"],
  testPathIgnorePatterns: [
    "/node_modules/",
    "/test/integration/",
    "\\.int\\.test\\.",
  ],
  clearMocks: true,
};
