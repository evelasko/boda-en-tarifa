import 'server-only';

import { createPrivateKey } from 'node:crypto';
import { JWT } from 'google-auth-library';
import { google } from 'googleapis';

const SHEETS_READONLY_SCOPE = 'https://www.googleapis.com/auth/spreadsheets.readonly';

const SA_EMAIL_SUFFIX = '.iam.gserviceaccount.com';

export class WorkspaceServiceAccountIntegrityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WorkspaceServiceAccountIntegrityError';
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Validates base64 → JSON → Google service account shape and PEM private key **before**
 * any JWT or Google token request. Call this early to surface misconfiguration clearly.
 */
export function assertWorkspaceServiceAccountKeyIntegrity(): {
  clientEmail: string;
  privateKey: string;
} {
  const b64 = process.env.GOOGLE_WORKSPACE_SERVICE_ACCOUNT_KEY?.trim();
  if (!b64) {
    throw new WorkspaceServiceAccountIntegrityError(
      'GOOGLE_WORKSPACE_SERVICE_ACCOUNT_KEY is not set. Provide the base64-encoded service account JSON.'
    );
  }

  let utf8: string;
  try {
    utf8 = Buffer.from(b64, 'base64').toString('utf-8');
  } catch {
    throw new WorkspaceServiceAccountIntegrityError(
      'GOOGLE_WORKSPACE_SERVICE_ACCOUNT_KEY is not valid base64.'
    );
  }

  if (!utf8.trim()) {
    throw new WorkspaceServiceAccountIntegrityError(
      'Decoded GOOGLE_WORKSPACE_SERVICE_ACCOUNT_KEY is empty after base64 decode.'
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(utf8);
  } catch {
    throw new WorkspaceServiceAccountIntegrityError(
      'Decoded GOOGLE_WORKSPACE_SERVICE_ACCOUNT_KEY is not valid JSON.'
    );
  }

  if (!isPlainObject(parsed)) {
    throw new WorkspaceServiceAccountIntegrityError(
      'Service account JSON must be a single object, not an array or primitive.'
    );
  }

  const type = parsed.type;
  if (type !== undefined && type !== 'service_account') {
    throw new WorkspaceServiceAccountIntegrityError(
      `Service account JSON "type" must be "service_account" (got ${String(type)}).`
    );
  }

  const clientEmail = parsed.client_email;
  if (typeof clientEmail !== 'string' || !clientEmail.trim()) {
    throw new WorkspaceServiceAccountIntegrityError(
      'Service account JSON must include a non-empty string "client_email".'
    );
  }

  const email = clientEmail.trim();
  if (!email.endsWith(SA_EMAIL_SUFFIX)) {
    throw new WorkspaceServiceAccountIntegrityError(
      `client_email must be a Google service account address ending in "${SA_EMAIL_SUFFIX}".`
    );
  }

  const privateKey = parsed.private_key;
  if (typeof privateKey !== 'string' || !privateKey.trim()) {
    throw new WorkspaceServiceAccountIntegrityError(
      'Service account JSON must include a non-empty string "private_key".'
    );
  }

  const pem = privateKey.trim();
  if (!pem.includes('BEGIN PRIVATE KEY') || !pem.includes('END PRIVATE KEY')) {
    throw new WorkspaceServiceAccountIntegrityError(
      'private_key must be a PEM PKCS#8 block containing BEGIN PRIVATE KEY and END PRIVATE KEY.'
    );
  }

  try {
    createPrivateKey({ key: pem, format: 'pem' });
  } catch {
    throw new WorkspaceServiceAccountIntegrityError(
      'private_key failed cryptographic parse (corrupt PEM or wrong key format).'
    );
  }

  return { clientEmail: email, privateKey: pem };
}

/**
 * Sheets API client using domain-wide delegation: the service account impersonates
 * GOOGLE_USER_ADMIN_EMAIL so private spreadsheets are readable without per-user OAuth.
 */
export async function getSheetsClient() {
  const { clientEmail, privateKey } = assertWorkspaceServiceAccountKeyIntegrity();

  const subject = process.env.GOOGLE_USER_ADMIN_EMAIL?.trim();
  if (!subject) {
    throw new Error('GOOGLE_USER_ADMIN_EMAIL is not set.');
  }

  const auth = new JWT({
    email: clientEmail,
    key: privateKey,
    scopes: [SHEETS_READONLY_SCOPE],
    subject,
  });

  await auth.getAccessToken();

  return google.sheets({
    version: 'v4',
    auth: auth as typeof auth & Parameters<typeof google.sheets>[0]['auth'],
  });
}
