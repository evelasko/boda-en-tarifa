#!/usr/bin/env node
/**
 * One-time Spotify OAuth helper for the Thora bot.
 * =================================================
 *
 * Run from repo root:
 *   node bot/scripts/spotify-auth.mjs
 *
 * What it does:
 *   1. Generates a one-shot self-signed certificate (via openssl).
 *   2. Starts an HTTPS callback server on https://127.0.0.1:8888.
 *   3. Opens your browser to Spotify's authorize page.
 *   4. After you grant access, captures the `code` from the redirect.
 *   5. Exchanges it for an access_token + refresh_token (Authorization
 *      Code flow with Basic auth — confidential client).
 *   6. Prints the refresh_token to your terminal.
 *
 * You only need to run this ONCE. Save the refresh_token in bot/.env as
 * SPOTIFY_REFRESH_TOKEN, and later mirror it into the Firebase secret
 * of the same name.
 *
 * Prerequisites:
 *   - Node 18+ (for built-in fetch). Tested on Node 24.
 *   - openssl on PATH (default on macOS and most Linux).
 *   - bot/.env contains:
 *       SPOTIFY_CLIENT_ID=...
 *       SPOTIFY_CLIENT_SECRET=...
 *   - Spotify Developer App has redirect URI registered (EXACT match):
 *       https://127.0.0.1:8888/callback
 *
 * Browser warning is expected:
 *   The self-signed cert will trigger "Your connection is not private"
 *   in Chrome / Firefox / Safari. Click "Advanced" → "Proceed to
 *   127.0.0.1 (unsafe)". Spotify never sees this cert — it only protects
 *   your browser → 127.0.0.1 hop, which is purely local.
 */

import { createServer } from 'node:https';
import { readFileSync, existsSync, mkdtempSync } from 'node:fs';
import { execSync, spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// --- Config ---

const REDIRECT_URI = 'https://127.0.0.1:8888/callback';
const PORT = 8888;
const SCOPES = 'playlist-modify-public playlist-modify-private';
const ENV_PATH = 'bot/.env';

// --- Helpers ---

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) {
    throw new Error(
      `Cannot find ${filePath}. Run this script from the repo root, not from inside bot/.`,
    );
  }
  const text = readFileSync(filePath, 'utf8');
  const env = {};
  for (const rawLine of text.split('\n')) {
    const line = rawLine.replace(/\r$/, '').trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

function generateSelfSignedCert() {
  const dir = mkdtempSync(join(tmpdir(), 'thora-spotify-auth-'));
  const keyPath = join(dir, 'key.pem');
  const certPath = join(dir, 'cert.pem');
  execSync(
    `openssl req -x509 -newkey rsa:2048 -nodes ` +
      `-keyout "${keyPath}" -out "${certPath}" ` +
      `-days 1 -subj "/CN=127.0.0.1"`,
    { stdio: 'ignore' },
  );
  return {
    key: readFileSync(keyPath),
    cert: readFileSync(certPath),
  };
}

function openBrowser(url) {
  const cmd =
    process.platform === 'darwin'
      ? 'open'
      : process.platform === 'win32'
        ? 'start'
        : 'xdg-open';
  try {
    spawn(cmd, [url], {
      detached: true,
      stdio: 'ignore',
      shell: process.platform === 'win32',
    }).unref();
  } catch {
    // user can copy-paste the URL from the terminal — non-fatal
  }
}

// --- Main ---

let env;
try {
  env = loadEnvFile(ENV_PATH);
} catch (e) {
  console.error(`❌ ${e.message}`);
  process.exit(1);
}

const clientId = env.SPOTIFY_CLIENT_ID;
const clientSecret = env.SPOTIFY_CLIENT_SECRET;
if (!clientId || !clientSecret) {
  console.error(
    `❌ Missing SPOTIFY_CLIENT_ID and/or SPOTIFY_CLIENT_SECRET in ${ENV_PATH}`,
  );
  process.exit(1);
}

const state = randomBytes(16).toString('hex');
const authUrl = new URL('https://accounts.spotify.com/authorize');
authUrl.searchParams.set('client_id', clientId);
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
authUrl.searchParams.set('scope', SCOPES);
authUrl.searchParams.set('state', state);

console.log('\n🐾 Thora bot — Spotify OAuth helper');
console.log('=====================================\n');
console.log('Generating self-signed certificate (one-shot, in temp dir)...');

let key, cert;
try {
  ({ key, cert } = generateSelfSignedCert());
} catch (e) {
  console.error('❌ openssl failed. Ensure openssl is installed and on PATH.');
  console.error(e.message);
  process.exit(1);
}

const server = createServer({ key, cert }, async (req, res) => {
  const url = new URL(req.url, REDIRECT_URI);

  if (url.pathname !== '/callback') {
    res.writeHead(404).end('not found');
    return;
  }

  const code = url.searchParams.get('code');
  const returnedState = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  if (error) {
    res
      .writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' })
      .end(`<h1>Spotify auth error</h1><p>${error}</p>`);
    console.error(`\n❌ Spotify returned error: ${error}`);
    server.close();
    process.exit(1);
  }

  if (returnedState !== state) {
    res.writeHead(400).end('state mismatch');
    console.error('\n❌ State mismatch — possible CSRF. Aborting.');
    server.close();
    process.exit(1);
  }

  if (!code) {
    res.writeHead(400).end('no code returned');
    console.error('\n❌ No code returned from Spotify.');
    server.close();
    process.exit(1);
  }

  // Exchange code for tokens (confidential client → Basic auth header)
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
  });
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString(
    'base64',
  );

  let tokens;
  try {
    const resp = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });
    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(
        `Spotify token endpoint returned ${resp.status}: ${errText}`,
      );
    }
    tokens = await resp.json();
  } catch (e) {
    res
      .writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' })
      .end(`<h1>Token exchange failed</h1><pre>${e.message}</pre>`);
    console.error('\n❌ Token exchange failed:', e.message);
    server.close();
    process.exit(1);
  }

  // Success
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end(`
    <html><body style="font-family: -apple-system, sans-serif; padding: 40px; max-width: 600px; line-height: 1.5;">
      <h1>🐾 Auth complete</h1>
      <p>Refresh token captured. Check your terminal.</p>
      <p>You can close this window.</p>
    </body></html>
  `);

  console.log('\n✅ Success!');
  console.log('\n--- Paste this into bot/.env ---\n');
  console.log(`SPOTIFY_REFRESH_TOKEN=${tokens.refresh_token}`);
  console.log('\n--- Scopes granted ---');
  console.log(tokens.scope);
  console.log(
    "\nDon't forget to also save SPOTIFY_REFRESH_TOKEN to Firebase secrets later",
  );
  console.log(
    "(`firebase functions:secrets:set SPOTIFY_REFRESH_TOKEN`).\n",
  );

  setTimeout(() => {
    server.close();
    process.exit(0);
  }, 500);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`✅ HTTPS callback server listening on ${REDIRECT_URI}\n`);
  console.log('👉 Opening your browser...');
  console.log("   If it doesn't open automatically, paste this URL:\n");
  console.log(`   ${authUrl.toString()}\n`);
  console.log('⚠️  Your browser will warn about a self-signed certificate.');
  console.log(
    '    Click "Advanced" → "Proceed to 127.0.0.1 (unsafe)" — expected.',
  );
  console.log("    Spotify never sees the cert; it's only for your browser → 127.0.0.1.\n");
  openBrowser(authUrl.toString());
});

// Safety: if nothing happens within 5 min, bail
setTimeout(() => {
  console.error('\n❌ Timed out waiting for callback (5 min). Exiting.');
  server.close();
  process.exit(1);
}, 5 * 60 * 1000).unref();
