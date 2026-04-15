const {getAuth} = require("firebase-admin/auth");
const {FieldPath, getFirestore} = require("firebase-admin/firestore");

const TEST_PREFIX = "int_";

async function deleteUsersWithPrefix(prefix = TEST_PREFIX) {
  const auth = getAuth();
  let pageToken;
  const uids = [];

  do {
    const page = await auth.listUsers(1000, pageToken);
    for (const user of page.users) {
      if (user.uid.startsWith(prefix)) {
        uids.push(user.uid);
      }
    }
    pageToken = page.pageToken;
  } while (pageToken);

  if (uids.length > 0) {
    await auth.deleteUsers(uids);
  }
}

async function deleteGuestDocsWithPrefix(prefix = TEST_PREFIX) {
  const db = getFirestore();
  while (true) {
    const snap = await db
      .collection("guests")
      .where(FieldPath.documentId(), ">=", prefix)
      .where(FieldPath.documentId(), "<", `${prefix}\uf8ff`)
      .limit(400)
      .get();

    if (snap.empty) {
      break;
    }

    const batch = db.batch();
    for (const doc of snap.docs) {
      batch.delete(doc.ref);
    }
    await batch.commit();
  }
}

async function deleteMagicLinkIssuesWithPrefix(prefix = TEST_PREFIX) {
  const db = getFirestore();
  while (true) {
    const snap = await db
      .collection("magic_link_issues")
      .where("guestUid", ">=", prefix)
      .where("guestUid", "<", `${prefix}\uf8ff`)
      .limit(400)
      .get();

    if (snap.empty) break;

    const batch = db.batch();
    for (const doc of snap.docs) {
      batch.delete(doc.ref);
    }
    await batch.commit();
  }
}

async function cleanupIntegrationData() {
  await deleteMagicLinkIssuesWithPrefix();
  await deleteUsersWithPrefix();
  await deleteGuestDocsWithPrefix();
}

module.exports = {
  TEST_PREFIX,
  cleanupIntegrationData,
};
