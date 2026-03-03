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

  // Support base64-encoded JSON, plain JSON, or a file path
  let credential;
  try {
    // Try parsing as JSON first (plain or base64-encoded)
    let json: string;
    try {
      json = serviceAccountKey;
      JSON.parse(json);
    } catch {
      // Not valid JSON — try base64 decoding
      json = Buffer.from(serviceAccountKey, 'base64').toString('utf-8');
      JSON.parse(json); // will throw if still not valid JSON
    }
    credential = cert(JSON.parse(json));
  } catch {
    // Last resort — treat as a file path
    credential = cert(serviceAccountKey);
  }

  return initializeApp({ credential });
}

const app = getAdminApp();

export const adminAuth: Auth = getAuth(app);
export const adminFirestore: Firestore = getFirestore(app);
export const adminMessaging: Messaging = getMessaging(app);
