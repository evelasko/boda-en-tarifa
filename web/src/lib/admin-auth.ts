import 'server-only';

import { adminAuth, adminFirestore } from './firebase-admin';

interface AdminUser {
  uid: string;
  email: string;
  isAdmin: boolean;
}

/**
 * Verify a Firebase ID token and check if the user is an admin.
 * Admin status is determined by the `config/admins` Firestore document
 * which contains an `emails` array of authorized admin email addresses.
 */
export async function verifyAdmin(idToken: string): Promise<AdminUser> {
  const decoded = await adminAuth.verifyIdToken(idToken);
  const email = decoded.email;

  if (!email) {
    return { uid: decoded.uid, email: '', isAdmin: false };
  }

  const adminsDoc = await adminFirestore.doc('config/admins').get();
  const adminEmails: string[] = adminsDoc.exists
    ? (adminsDoc.data()?.emails ?? [])
    : [];

  return {
    uid: decoded.uid,
    email,
    isAdmin: adminEmails.includes(email),
  };
}
