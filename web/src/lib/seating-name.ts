/**
 * Split a guest's full name into the two lines that appear under each seat
 * in the diagram. Both lines are uppercased; Spanish accent characters are
 * preserved by JavaScript's default `String.prototype.toUpperCase()`.
 *
 * Rule (owner-specified):
 *   - The LAST word becomes the second line; everything before it becomes
 *     the first line. E.g. "Noel Darío Sánchez" → ["NOEL DARÍO", "SÁNCHEZ"].
 *
 *   - Exception for the "Jr." suffix: when the last word is "Jr." (or "Jr"
 *     without the period), it's treated as a tag glued to the preceding
 *     surname; the split happens ONE word earlier so the suffix stays on
 *     the same line as the surname. E.g. "José Velasco Jr." →
 *     ["JOSÉ", "VELASCO JR."].
 *
 * Returns `["", ""]` for empty input. For single-word names (no surname),
 * returns the word on line 1 with an empty line 2. For degenerate cases
 * where applying the Jr. rule would leave line 1 empty (e.g. "Foo Jr."),
 * falls back to putting the whole name on line 1 — preserving readability
 * over the split rule.
 */
export function splitGuestName(fullName: string): [string, string] {
  // Trim + collapse runs of whitespace, then drop empty tokens.
  const words = (fullName ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return ['', ''];
  if (words.length === 1) return [words[0].toUpperCase(), ''];

  // Match "Jr" or "Jr." case-insensitively (some users include the period,
  // some don't). Keep the regex narrow to avoid catching unrelated tokens.
  const lastIsJr = /^jr\.?$/i.test(words[words.length - 1]);

  // splitAt is the index at which the SECOND line begins.
  //   - Normal:  splitAt = N - 1     → last word goes to line 2
  //   - Jr. tag: splitAt = N - 2     → suffix + preceding word go to line 2
  const splitAt = lastIsJr ? words.length - 2 : words.length - 1;

  // If the Jr. rule would leave line 1 empty (e.g. "Foo Jr."), prefer a
  // single line over a confusing line 1 = "" / line 2 = "Foo Jr." split.
  if (splitAt < 1) {
    return [words.join(' ').toUpperCase(), ''];
  }

  const first = words.slice(0, splitAt).join(' ').toUpperCase();
  const second = words.slice(splitAt).join(' ').toUpperCase();
  return [first, second];
}
