/**
 * Shared admin-check helper for the bot's Callable Cloud Functions.
 *
 * The existing web admin (`web/src/lib/admin-auth.ts`) authorizes via the
 * `config/admins.emails` array — not the `admins/{uid}` collection in the
 * Firestore rules examples. We match that convention so a single admin
 * roster powers both the dashboard and the bot callables.
 *
 * Throws `HttpsError("permission-denied")` on any auth miss.
 */

import {HttpsError, type CallableRequest} from "firebase-functions/v2/https";
import {getFirestore} from "firebase-admin/firestore";

export interface AdminContext {
  uid: string;
  email: string;
}

export async function assertAdmin(
  request: CallableRequest<unknown>
): Promise<AdminContext> {
  const auth = request.auth;
  if (!auth || !auth.uid) {
    throw new HttpsError(
      "unauthenticated",
      "Sign in required."
    );
  }
  const email = auth.token.email as string | undefined;
  if (!email) {
    throw new HttpsError(
      "permission-denied",
      "Account has no verified email."
    );
  }
  const snap = await getFirestore().doc("config/admins").get();
  const emails = ((snap.data()?.emails as string[] | undefined) ?? [])
    .map((e) => e.toLowerCase());
  if (!emails.includes(email.toLowerCase())) {
    throw new HttpsError(
      "permission-denied",
      "Not an admin."
    );
  }
  return {uid: auth.uid, email};
}
