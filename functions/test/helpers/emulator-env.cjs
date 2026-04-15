const {deleteApp, getApps, initializeApp} = require("firebase-admin/app");

const DEFAULT_PROJECT_ID = "demo-boda-en-tarifa";

function requireEnv(name) {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function ensureEmulatorEnvironment() {
  requireEnv("FIRESTORE_EMULATOR_HOST");
  requireEnv("FIREBASE_AUTH_EMULATOR_HOST");
}

function ensureAdminApp() {
  if (getApps().length > 0) {
    return getApps()[0];
  }
  return initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || DEFAULT_PROJECT_ID,
  });
}

module.exports = {
  async clearAdminApps() {
    await Promise.all(getApps().map((app) => deleteApp(app)));
  },
  ensureAdminApp,
  ensureEmulatorEnvironment,
  requireEnv,
};
