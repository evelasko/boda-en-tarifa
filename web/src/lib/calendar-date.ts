/**
 * Wedding content stores calendar days as `YYYY-MM-DD` (no time zone).
 * `new Date("YYYY-MM-DD")` is specified as UTC midnight, so guests west of
 * UTC see the previous local calendar day. Parse as a plain calendar day instead.
 */
export function parseCalendarDate(dateString: string): Date {
  const datePart = dateString.trim().split('T')[0];
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart);
  if (!match) {
    return new Date(dateString);
  }
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  return new Date(y, m - 1, d);
}
