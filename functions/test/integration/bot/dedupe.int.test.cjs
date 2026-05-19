const {
  clearAdminApps,
  ensureAdminApp,
  ensureEmulatorEnvironment,
} = require("../../helpers/emulator-env.cjs");
const {FieldPath, getFirestore} = require("firebase-admin/firestore");
const {
  claimMessageId,
  markProcessed,
} = require("../../../lib/bot/webhook/dedupe.js");

const TEST_PREFIX = "int_dedupe_";
const TEST_PREFIX_END = TEST_PREFIX + "";

async function deleteDedupeDocs() {
  const db = getFirestore();
  while (true) {
    const snap = await db
      .collection("bot_dedupe")
      .where(FieldPath.documentId(), ">=", TEST_PREFIX)
      .where(FieldPath.documentId(), "<", TEST_PREFIX_END)
      .limit(400)
      .get();
    if (snap.empty) break;
    const batch = db.batch();
    for (const doc of snap.docs) batch.delete(doc.ref);
    await batch.commit();
  }
}

describe("bot_dedupe integration", () => {
  beforeAll(() => {
    ensureEmulatorEnvironment();
    ensureAdminApp();
  });

  afterEach(deleteDedupeDocs);
  afterAll(async () => {
    await deleteDedupeDocs();
    await clearAdminApps();
  });

  test("first claim succeeds, second claim returns false", async () => {
    const id = TEST_PREFIX + "wamid." + Date.now() + "_a";
    expect(await claimMessageId(id)).toBe(true);
    expect(await claimMessageId(id)).toBe(false);
  });

  test("claim writes ttlExpiresAt in the future and processedSuccessfully=false", async () => {
    const id = TEST_PREFIX + "wamid." + Date.now() + "_b";
    await claimMessageId(id);
    const snap = await getFirestore().collection("bot_dedupe").doc(id).get();
    const data = snap.data();
    expect(data.messageId).toBe(id);
    expect(data.processedSuccessfully).toBe(false);
    const ttlMs = data.ttlExpiresAt.toMillis();
    expect(ttlMs).toBeGreaterThan(Date.now());
  });

  test("markProcessed flips the flag for a claimed id", async () => {
    const id = TEST_PREFIX + "wamid." + Date.now() + "_c";
    await claimMessageId(id);
    await markProcessed(id);
    const snap = await getFirestore().collection("bot_dedupe").doc(id).get();
    expect(snap.data().processedSuccessfully).toBe(true);
  });

  test("concurrent claims of the same id yield exactly one winner", async () => {
    const id = TEST_PREFIX + "wamid." + Date.now() + "_d";
    const results = await Promise.all(
      Array.from({length: 5}, () => claimMessageId(id))
    );
    expect(results.filter(Boolean)).toHaveLength(1);
  });

  test("claimMessageId throws on empty id", async () => {
    await expect(claimMessageId("")).rejects.toThrow(/empty/);
  });
});
