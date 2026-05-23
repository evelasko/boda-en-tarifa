const {deleteApp, getApps, initializeApp} = require("firebase-admin/app");

const DEFAULT_PROJECT_ID = "demo-boda-en-tarifa";

/** Keep in sync with `firebase.json` emulator ports. */
const DEFAULT_EMULATOR_ENV = {
  FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080",
  FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099",
  FIREBASE_PROJECT_ID: DEFAULT_PROJECT_ID,
};

function applyDefaultEmulatorEnvIfUnset() {
  for (const [key, value] of Object.entries(DEFAULT_EMULATOR_ENV)) {
    if (!process.env[key] || process.env[key].trim() === "") {
      process.env[key] = value;
    }
  }
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function ensureEmulatorEnvironment() {
  applyDefaultEmulatorEnvIfUnset();
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
  applyDefaultEmulatorEnvIfUnset,
  async clearAdminApps() {
    await Promise.all(getApps().map((app) => deleteApp(app)));
  },
  ensureAdminApp,
  ensureEmulatorEnvironment,
  requireEnv,
};
