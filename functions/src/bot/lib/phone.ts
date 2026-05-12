/**
 * E.164 phone number helpers.
 *
 * Internal code always uses E.164 with leading `+` (e.g. `+34612345678`).
 * Meta's Cloud API uses `wa_id` without the `+` (e.g. `34612345678`).
 * Conversion happens only at the boundaries.
 */

export type E164 = string;

const E164_REGEX = /^\+[1-9]\d{6,14}$/;

/**
 * Normalize a raw phone-like string into E.164. Throws if it cannot.
 *
 * Accepts:
 *   - already-E.164 (`+34612345678`)
 *   - Meta's wa_id format (`34612345678`)
 *   - whitespace, dashes, parentheses are stripped
 *
 * @param {string} raw
 * @return {E164}
 */
export function normalizeE164(raw: string): E164 {
  if (typeof raw !== "string" || raw.length === 0) {
    throw new Error("phone: empty input");
  }
  const cleaned = raw.replace(/[\s\-()]/g, "");
  const candidate = cleaned.startsWith("+") ? cleaned : `+${cleaned}`;
  if (!E164_REGEX.test(candidate)) {
    throw new Error(`phone: not E.164 (${raw})`);
  }
  return candidate;
}

/**
 * Convert E.164 to Meta's wa_id (no leading `+`).
 *
 * @param {E164} phone
 * @return {string}
 */
export function toMetaWaId(phone: E164): string {
  return phone.startsWith("+") ? phone.slice(1) : phone;
}

/**
 * Convert Meta's wa_id to E.164 (adds leading `+`).
 *
 * @param {string} waId
 * @return {E164}
 */
export function fromMetaWaId(waId: string): E164 {
  return normalizeE164(waId);
}

/**
 * Mask a phone for log emission. Keeps country code and last 3 digits.
 * Example: `+34612345678` -> `+34••••••678`.
 *
 * @param {string | undefined | null} phone
 * @return {string}
 */
export function maskPhone(phone: string | undefined | null): string {
  if (!phone) return "(unknown)";
  if (phone.length <= 6) return "•".repeat(phone.length);
  const head = phone.slice(0, 3);
  const tail = phone.slice(-3);
  const middle = "•".repeat(Math.max(phone.length - 6, 1));
  return `${head}${middle}${tail}`;
}
