import * as crypto from "node:crypto";

/**
 * Verify Meta's `X-Hub-Signature-256` header in constant time.
 *
 * Spec: `bot/specs/08-integration-contract.md` §1.6,
 *       `bot/specs/09-security-privacy.md` §2.3.
 *
 * The signature is HMAC-SHA256 over the **raw request body** with
 * `WHATSAPP_APP_SECRET`. Tampered bodies, replayed bodies under a
 * different secret, or missing/malformed headers all return false.
 *
 * @param {string} rawBody Raw request body, exactly as Meta sent it.
 * @param {string | undefined} signatureHeader Value of X-Hub-Signature-256.
 * @param {string} secret WHATSAPP_APP_SECRET value.
 * @return {boolean} True iff signature valid.
 */
export function verifySignature(
  rawBody: string,
  signatureHeader: string | undefined,
  secret: string
): boolean {
  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) return false;
  if (!secret) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex");
  const provided = signatureHeader.slice("sha256=".length);

  // Length-mismatched buffers crash timingSafeEqual; reject early.
  if (expected.length !== provided.length) return false;

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(provided, "hex")
    );
  } catch {
    return false;
  }
}

export interface HandshakeQuery {
  mode?: string;
  token?: string;
  challenge?: string;
}

export interface HandshakeResult {
  status: 200 | 403;
  body: string;
}

/**
 * Handle Meta's GET subscription verification handshake.
 *
 * Returns the `hub.challenge` body with 200 iff `hub.verify_token`
 * matches our configured token; otherwise 403.
 *
 * @param {HandshakeQuery} query Parsed query parameters.
 * @param {string} expectedToken WHATSAPP_VERIFY_TOKEN value.
 * @return {HandshakeResult}
 */
export function handleHandshake(
  query: HandshakeQuery,
  expectedToken: string
): HandshakeResult {
  if (
    query.mode === "subscribe" &&
    typeof query.token === "string" &&
    typeof query.challenge === "string" &&
    query.token === expectedToken
  ) {
    return {status: 200, body: query.challenge};
  }
  return {status: 403, body: "Forbidden"};
}
