const {
  clearAdminApps,
  ensureAdminApp,
  ensureEmulatorEnvironment,
} = require("../helpers/emulator-env.cjs");
const {cleanupIntegrationData, TEST_PREFIX} = require("../helpers/cleanup.cjs");
const {upsertGuest} = require("../helpers/firestore-seed.cjs");
const {getAuth} = require("firebase-admin/auth");
const {getFirestore} = require("firebase-admin/firestore");

describe("generateMagicLink integration", () => {
  const projectId = process.env.FIREBASE_PROJECT_ID || "demo-boda-en-tarifa";
  const baseUrl = `http://127.0.0.1:5001/${projectId}/europe-west1/generateMagicLink`;
  const adminPassword = "Test1234!";
  const webApiKey = "demo-api-key";

  beforeAll(() => {
    ensureEmulatorEnvironment();
    ensureAdminApp();
  });

  afterEach(async () => {
    await cleanupIntegrationData();
  });

  afterAll(async () => {
    await cleanupIntegrationData();
    await clearAdminApps();
  });

  async function callGenerateMagicLink(data, idToken) {
    const headers = {"content-type": "application/json"};
    if (idToken) {
      headers.authorization = `Bearer ${idToken}`;
    }

    const response = await fetch(baseUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({data}),
    });
    const body = await response.json();
    return {status: response.status, body};
  }

  async function getAuthIdToken(email, password) {
    const response = await fetch(
      `http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${webApiKey}`,
      {
        method: "POST",
        headers: {"content-type": "application/json"},
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true,
        }),
      }
    );
    const body = await response.json();
    if (!response.ok) {
      throw new Error(`Failed to get auth token: ${JSON.stringify(body)}`);
    }
    return body.idToken;
  }

  async function createAdminCaller() {
    const uid = `${TEST_PREFIX}admin_001`;
    const email = `${uid}@example.test`;
    await getAuth().createUser({
      uid,
      email,
      password: adminPassword,
      emailVerified: true,
    });
    await getAuth().setCustomUserClaims(uid, {admin: true, authorized: true});
    return getAuthIdToken(email, adminPassword);
  }

  async function createNonAdminCaller() {
    const uid = `${TEST_PREFIX}caller_001`;
    const email = `${uid}@example.test`;
    await getAuth().createUser({
      uid,
      email,
      password: adminPassword,
      emailVerified: true,
    });
    await getAuth().setCustomUserClaims(uid, {admin: false, authorized: true});
    return getAuthIdToken(email, adminPassword);
  }

  it("rejects unauthenticated callers", async () => {
    const result = await callGenerateMagicLink({guestUid: `${TEST_PREFIX}guest_001`});
    expect(result.status).toBe(401);
    expect(result.body.error.status).toBe("UNAUTHENTICATED");
  });

  it("rejects callers without admin claim", async () => {
    const nonAdminToken = await createNonAdminCaller();
    const result = await callGenerateMagicLink(
      {guestUid: `${TEST_PREFIX}guest_001`},
      nonAdminToken
    );
    expect(result.status).toBe(403);
    expect(result.body.error.status).toBe("PERMISSION_DENIED");
  });

  it("rejects invalid payload", async () => {
    const adminToken = await createAdminCaller();
    const result = await callGenerateMagicLink({guestUid: 123}, adminToken);
    expect(result.status).toBe(400);
    expect(result.body.error.status).toBe("INVALID_ARGUMENT");
  });

  it("rejects unknown guest uid", async () => {
    const adminToken = await createAdminCaller();
    const result = await callGenerateMagicLink(
      {guestUid: `${TEST_PREFIX}missing_guest_001`},
      adminToken
    );
    expect(result.status).toBe(404);
    expect(result.body.error.status).toBe("NOT_FOUND");
  });

  it("returns deep link and expiry for known guest", async () => {
    const guestUid = `${TEST_PREFIX}guest_success_001`;
    const adminToken = await createAdminCaller();
    await upsertGuest(guestUid, {
      email: "guest.success@example.test",
      fullName: "Guest Success",
      profileClaimed: false,
      isDirectoryVisible: true,
    });

    const result = await callGenerateMagicLink({guestUid}, adminToken);

    expect(result.status).toBe(200);
    expect(typeof result.body.result.deepLinkUrl).toBe("string");
    expect(result.body.result.deepLinkUrl).toContain("https://");
    expect(result.body.result.deepLinkUrl).toContain("token=");
    expect(result.body.result.deepLinkUrl).toContain("name=Guest+Success");
    expect(typeof result.body.result.expiresAt).toBe("string");
    expect(typeof result.body.result.issuedAt).toBe("string");
    expect(typeof result.body.result.linkId).toBe("string");
    expect(Number.isNaN(Date.parse(result.body.result.expiresAt))).toBe(false);

    const issueSnap = await getFirestore()
      .collection("magic_link_issues")
      .doc(result.body.result.linkId)
      .get();
    expect(issueSnap.exists).toBe(true);
    expect(issueSnap.data().guestUid).toBe(guestUid);
  });
});
