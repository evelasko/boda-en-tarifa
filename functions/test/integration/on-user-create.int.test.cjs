const functionsTest = require("firebase-functions-test")({
  projectId: process.env.FIREBASE_PROJECT_ID || "demo-boda-en-tarifa",
});

const {
  clearAdminApps,
  ensureAdminApp,
  ensureEmulatorEnvironment,
} = require("../helpers/emulator-env.cjs");
const {cleanupIntegrationData, TEST_PREFIX} = require("../helpers/cleanup.cjs");
const {
  deleteGuest,
  readGuest,
  upsertGuest,
} = require("../helpers/firestore-seed.cjs");

describe("onUserCreate integration", () => {
  let wrappedOnUserCreate;

  beforeAll(() => {
    ensureEmulatorEnvironment();
    ensureAdminApp();

    const {onUserCreate} = require("../../lib/auth/on-user-create.js");
    wrappedOnUserCreate = functionsTest.wrap(onUserCreate);
  });

  afterEach(async () => {
    await cleanupIntegrationData();
  });

  afterAll(async () => {
    await cleanupIntegrationData();
    functionsTest.cleanup();
    await clearAdminApps();
  });

  it("returns unauthorized claims for missing event data", async () => {
    const result = await wrappedOnUserCreate({data: undefined});
    expect(result).toEqual({customClaims: {authorized: false}});
  });

  it("returns unauthorized claims when guest doc is missing", async () => {
    const result = await wrappedOnUserCreate({
      data: {
        uid: `${TEST_PREFIX}auth_uid_001`,
      },
    });
    expect(result).toEqual({customClaims: {authorized: false}});
  });

  it("returns unauthorized claims when uid is not in allowlist", async () => {
    const result = await wrappedOnUserCreate({
      data: {
        uid: `${TEST_PREFIX}auth_uid_002`,
        email: "missing.guest@example.test",
      },
    });
    expect(result).toEqual({customClaims: {authorized: false}});
  });

  it("marks profile as claimed when guest doc id matches auth uid", async () => {
    const uid = `${TEST_PREFIX}auth_uid_003`;
    await upsertGuest(uid, {
      fullName: "Matched Claim",
      profileClaimed: false,
      isDirectoryVisible: true,
    });

    const result = await wrappedOnUserCreate({
      data: {uid},
    });

    expect(result).toEqual({customClaims: {authorized: true}});

    const updatedGuest = await readGuest(uid);
    expect(updatedGuest.exists).toBe(true);
    expect(updatedGuest.data().profileClaimed).toBe(true);
  });

  it("authorizes uid-matched guest even when auth email is absent", async () => {
    const uid = `${TEST_PREFIX}auth_uid_004`;
    await upsertGuest(uid, {
      fullName: "No Email Guest",
      profileClaimed: false,
      isDirectoryVisible: true,
    });

    const result = await wrappedOnUserCreate({
      data: {uid},
    });

    expect(result).toEqual({customClaims: {authorized: true}});

    const guest = await readGuest(uid);
    expect(guest.exists).toBe(true);
    expect(guest.data().profileClaimed).toBe(true);
  });

  it("is idempotent when profile is already claimed", async () => {
    const uid = `${TEST_PREFIX}auth_uid_006`;
    await upsertGuest(uid, {
      fullName: "Already Claimed",
      profileClaimed: true,
      isDirectoryVisible: true,
    });

    const result = await wrappedOnUserCreate({
      data: {uid, email: "any@example.test"},
    });

    expect(result).toEqual({customClaims: {authorized: true}});

    const guest = await readGuest(uid);
    expect(guest.exists).toBe(true);
    expect(guest.data().profileClaimed).toBe(true);
  });

  it("returns admin claim when guest is flagged as admin", async () => {
    const uid = `${TEST_PREFIX}auth_uid_005`;
    await upsertGuest(uid, {
      fullName: "Admin Claim",
      profileClaimed: true,
      isDirectoryVisible: true,
      isAdmin: true,
    });

    const result = await wrappedOnUserCreate({
      data: {uid},
    });

    expect(result).toEqual({customClaims: {authorized: true, admin: true}});

    await deleteGuest(uid);
  });
});
