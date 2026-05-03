const E164_REGEX = /^\+[1-9]\d{7,14}$/;
const WHATSAPP_REGEX = /^[1-9]\d{7,14}$/;

/** `(+CC) national` as used in the guest spreadsheet; also +E164, or 9-digit Spanish local → +34 */
export function normalizeSheetPhoneToE164(input?: string | null): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  const parenCc = trimmed.match(/^\(\+(\d{1,3})\)\s*(.+)$/);
  if (parenCc) {
    const cc = parenCc[1];
    const nationalDigits = parenCc[2].replace(/\D/g, '');
    if (!nationalDigits) return null;
    return normalizeE164Phone(`+${cc}${nationalDigits}`);
  }

  if (trimmed.startsWith('+')) {
    return normalizeE164Phone(trimmed);
  }

  const digitsOnly = trimmed.replace(/\D/g, '');
  if (digitsOnly.length === 9) {
    return normalizeE164Phone(`+34${digitsOnly}`);
  }

  return normalizeE164Phone(trimmed);
}

export function normalizeE164Phone(input?: string | null): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('+')) {
    const normalized = `+${trimmed.slice(1).replace(/\D/g, '')}`;
    return E164_REGEX.test(normalized) ? normalized : null;
  }

  const digits = trimmed.replace(/\D/g, '');
  if (!WHATSAPP_REGEX.test(digits)) return null;
  return `+${digits}`;
}

export function normalizeWhatsappNumber(input?: string | null): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('+')) {
    const asE164 = normalizeE164Phone(trimmed);
    return asE164 ? asE164.slice(1) : null;
  }

  const digits = trimmed.replace(/\D/g, '');
  return WHATSAPP_REGEX.test(digits) ? digits : null;
}
