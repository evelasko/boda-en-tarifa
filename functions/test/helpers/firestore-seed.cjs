const {FieldValue, getFirestore} = require("firebase-admin/firestore");

async function upsertGuest(id, guest) {
  await getFirestore().collection("guests").doc(id).set(
    {
      ...guest,
      updatedAt: FieldValue.serverTimestamp(),
    },
    {merge: true}
  );
}

async function readGuest(id) {
  return getFirestore().collection("guests").doc(id).get();
}

async function deleteGuest(id) {
  await getFirestore().collection("guests").doc(id).delete();
}

module.exports = {
  deleteGuest,
  readGuest,
  upsertGuest,
};
