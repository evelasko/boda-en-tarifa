const E164_REGEX = /^\+[1-9]\d{7,14}$/;
const WHATSAPP_REGEX = /^[1-9]\d{7,14}$/;

export function toWhatsappNumber(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const digits = trimmed.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) {
    const normalized = `+${digits.slice(1).replace(/\D/g, "")}`;
    if (!E164_REGEX.test(normalized)) return null;
    return normalized.slice(1);
  }

  const normalized = digits.replace(/\D/g, "");
  if (!WHATSAPP_REGEX.test(normalized)) return null;
  return normalized;
}

export function toE164(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("+")) {
    const normalized = `+${trimmed.slice(1).replace(/\D/g, "")}`;
    return E164_REGEX.test(normalized) ? normalized : null;
  }

  const digits = trimmed.replace(/\D/g, "");
  if (!WHATSAPP_REGEX.test(digits)) return null;
  return `+${digits}`;
}

export function hasValidPhone(raw: string | null | undefined): boolean {
  return toE164(raw) !== null || toWhatsappNumber(raw) !== null;
}
