import 'server-only';

import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getMessaging, type Messaging } from 'firebase-admin/messaging';

function getAdminApp(): App {
  const existing = getApps();
  if (existing.length > 0) {
    return existing[0];
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set. ' +
      'Set it to the path of your service account JSON file or the JSON content itself.'
    );
  }

  // Support both a file path and inline JSON
  let credential;
  try {
    const parsed = JSON.parse(serviceAccountKey);
    credential = cert(parsed);
  } catch {
    // Not JSON — treat as a file path
    credential = cert(serviceAccountKey);
  }

  return initializeApp({ credential });
}

const app = getAdminApp();

export const adminAuth: Auth = getAuth(app);
export const adminFirestore: Firestore = getFirestore(app);
export const adminMessaging: Messaging = getMessaging(app);
