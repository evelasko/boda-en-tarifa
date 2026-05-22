/**
 * Song-request moderation. Reads `config/bot_kb_extras.moderation_hints`
 * and classifies a (title, artist) pair into one of three verdicts:
 *
 *   - 'accept' (default for the vast majority of requests)
 *   - 'tease_then_accept' (mild_tease.themes — Thora drops a wink but
 *     still records the request)
 *   - 'decline_softly' (hard_avoid.artists / songs only — rare)
 *
 * Spec: `bot/specs/07-knowledge-base.md` §5.15.
 *
 * Match strategy:
 *   - Normalize title + artist (lowercase, strip diacritics, collapse
 *     whitespace).
 *   - Hard-avoid artists: substring match either way (handles "Las
 *     Ketchup" matching "Las Ketchup feat. someone").
 *   - Hard-avoid songs: substring match on title; if a song entry has
 *     an artist, the artist must also substring-match.
 *   - Mild-tease themes: substring of any normalized theme keyword
 *     against title OR artist.
 *
 * The framing_note from KB extras is NOT returned here — it's already
 * rendered into Block B so Claude reads it as a system rule. The `hint`
 * we return is a tighter, per-request operator note Thora paraphrases.
 */

import {getBotKbExtras} from "./kb-sources.js";

export type SongVerdict = "accept" | "tease_then_accept" | "decline_softly";

export interface SongModerationResult {
  verdict: SongVerdict;
  hint?: string;
}

let cachedHints: Awaited<ReturnType<typeof getBotKbExtras>> | undefined;
let cachedAt = 0;
const CACHE_TTL_MS = 60_000; // hot path — 1 min is enough

async function loadHints() {
  const now = Date.now();
  if (cachedHints !== undefined && now - cachedAt < CACHE_TTL_MS) {
    return cachedHints;
  }
  cachedHints = await getBotKbExtras();
  cachedAt = now;
  return cachedHints;
}

export async function moderateSongRequest(
  title: string,
  artist: string | undefined
): Promise<SongModerationResult> {
  const extras = await loadHints();
  const hints = extras?.moderation_hints;
  if (!hints) {
    return {verdict: "accept"};
  }

  const t = normalize(title);
  const a = normalize(artist);

  // 1. Hard-avoid: artist match.
  for (const artistNeedle of hints.hard_avoid?.artists ?? []) {
    const n = normalize(artistNeedle);
    if (!n) continue;
    if (a && (a.includes(n) || n.includes(a))) {
      return {
        verdict: "decline_softly",
        hint: `${artistNeedle} no entra en la lista de mis humanos`,
      };
    }
  }

  // 2. Hard-avoid: song match.
  for (const song of hints.hard_avoid?.songs ?? []) {
    const nt = normalize(song.title);
    if (!nt || !t.includes(nt)) continue;
    if (song.artist) {
      const na = normalize(song.artist);
      if (na && a && !a.includes(na) && !na.includes(a)) continue;
    }
    return {
      verdict: "decline_softly",
      hint: `"${song.title}" la han vetado mis humanos`,
    };
  }

  // 3. Mild tease: theme match.
  for (const theme of hints.mild_tease?.themes ?? []) {
    if (themeMatches(theme, t, a)) {
      return {
        verdict: "tease_then_accept",
        hint: theme,
      };
    }
  }

  return {verdict: "accept"};
}

// ── Helpers ────────────────────────────────────────────────────────────

function normalize(s: string | undefined | null): string {
  if (!s) return "";
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Themes are free-form short descriptions; we extract content-bearing
 * tokens (length >= 4) and require ANY to substring-match title or
 * artist. Avoids spurious hits on words like "de", "es", "pop".
 *
 * Falls back to a substring search of the whole theme phrase if no
 * usable tokens are found — useful for short keyword-style themes.
 */
function themeMatches(
  theme: string,
  title: string,
  artist: string
): string | null {
  const n = normalize(theme);
  const tokens = n.split(/[^a-z0-9]+/).filter((tok) => tok.length >= 4);
  if (tokens.length === 0) {
    if (title.includes(n) || artist.includes(n)) return theme;
    return null;
  }
  for (const tok of tokens) {
    if (title.includes(tok) || artist.includes(tok)) return theme;
  }
  return null;
}
