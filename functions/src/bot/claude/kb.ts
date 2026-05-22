/* eslint-disable max-len */
/**
 * Knowledge-base builder. Reads source-of-truth Firestore documents,
 * renders them into a single Markdown block that becomes Block B of the
 * system prompt, and caches both in-process (warm function) and via
 * Anthropic prompt caching (handled by `system-prompt.ts`).
 *
 * Spec: `bot/specs/07-knowledge-base.md` §2-§3, §7 (caching strategy).
 * Plan: `bot/docs/kb-implementation-plan.md` §4.4.
 *
 * Stage 2 scope (G1+G2 ship — text-only KB with partial dossiers):
 *   - All sections from spec §3.1 are rendered as TEXT, in canonical order.
 *   - Guest dossiers render text fields only — reference photos arrive in
 *     Stage 3 (G3) as `image` content blocks via a refactored
 *     `system-prompt.ts`. See `kb-implementation-plan.md` §5.
 *   - "Today's situation" is NOT rendered here — it's per-turn (see
 *     `claude/today.ts`).
 *
 * Byte-stability: every renderer iterates inputs in deterministic order
 * (id ascending; key insertion order in YAML preserved by Firestore
 * preserved by sort). The output of `renderKb()` must be stable across
 * rebuilds for prompt caching to hit.
 */

import {getFirestore} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import {createHash} from "node:crypto";
import {listEvents, type BotEvent} from "../services/events.js";
import {listVenues, type BotVenue} from "../services/venues.js";
import {
  getCoupleDossier,
  getDressCodes,
  getWindTips,
  getTravel,
  getTarifaGuide,
  getBotKbExtras,
  listAccommodations,
  listFaq,
  listGuestDossiers,
} from "../services/kb-sources.js";

interface KbVersionDoc {
  version: number;
  hash: string;
}

const KB_VERSION_PATH = "bot_kb_version/_singleton_";

interface CachedKb {
  version: number;
  hash: string;
  text: string;
}

let inProcessCache: CachedKb | null = null;

export async function getKb(): Promise<{
  text: string;
  version: number;
  hash: string;
}> {
  const v = await readKbVersion();

  if (inProcessCache && inProcessCache.version === v.version) {
    return inProcessCache;
  }

  const text = await renderKb();
  const hash = createHash("sha256").update(text).digest("hex");
  const built: CachedKb = {version: v.version, text, hash};
  inProcessCache = built;
  return built;
}

export function invalidateKbCache(): void {
  inProcessCache = null;
}

async function readKbVersion(): Promise<{version: number; hash: string}> {
  try {
    const snap = await getFirestore().doc(KB_VERSION_PATH).get();
    if (snap.exists) {
      const data = snap.data() as KbVersionDoc;
      return {version: data.version, hash: data.hash};
    }
  } catch (err) {
    logger.warn("bot.kb.version_read_failed", {
      err: err instanceof Error ? err.message : String(err),
    });
  }
  return {version: 0, hash: ""};
}

// ── Top-level renderer ─────────────────────────────────────────────────

async function renderKb(): Promise<string> {
  const [
    couple,
    events,
    venues,
    travel,
    dressCodes,
    windTips,
    accommodations,
    tarifaGuide,
    dossiers,
    faq,
    extras,
  ] = await Promise.all([
    getCoupleDossier(),
    listEvents(),
    listVenues(),
    getTravel(),
    getDressCodes(),
    getWindTips(),
    listAccommodations(),
    getTarifaGuide(),
    listGuestDossiers(),
    listFaq(),
    getBotKbExtras(),
  ]);

  const sections: string[] = [];
  sections.push("# WEDDING KNOWLEDGE BASE");
  sections.push("");
  sections.push(renderCouple(couple));
  sections.push(renderSchedule(events));
  sections.push(renderWelcomeBora());
  sections.push(renderVenues(venues));
  sections.push(renderTravel(travel));
  sections.push(renderDressCodes(dressCodes));
  sections.push(renderWeatherWind(windTips));
  sections.push(renderAccommodations(accommodations));
  sections.push(renderTarifaGuide(tarifaGuide));
  sections.push(renderGuestDossiers(dossiers));
  sections.push(renderFaq(faq));
  sections.push(renderSurprises());
  sections.push(renderLocked());
  sections.push(renderModerationHints(extras));

  return sections.join("\n\n");
}

// ── Section renderers ──────────────────────────────────────────────────

function renderCouple(c: Awaited<ReturnType<typeof getCoupleDossier>>): string {
  if (!c) return "## Couple\n_no couple dossier yet_";
  const lines: string[] = [];
  lines.push("## Couple");
  if (c.names) {
    const e = c.names.enrique;
    const m = c.names.manuel;
    if (e || m) {
      lines.push("### Names & nickname register");
      if (e) {
        lines.push(`- Enrique: canonical=${e.canonical ?? "Enrique"}` +
          `, friends=${e.friends ?? "—"}, family=${e.family ?? "—"}`);
      }
      if (m) {
        lines.push(`- Manuel: canonical=${m.canonical ?? "Manuel"}` +
          `, friends=${m.friends ?? "—"}, family=${m.family ?? "—"}`);
      }
      lines.push(
        "- Pick register from guest's dossier.relationship: family → " +
          "family column; friends → friends column. When in doubt → canonical. " +
          "Mirror nicknames the guest uses themselves.",
      );
    }
  }
  if (c.timeline) {
    lines.push("### Timeline (most facts predate Thora — frame as hearsay)");
    for (const [k, v] of sortedEntries(c.timeline)) {
      lines.push(`- ${k}: ${stringify(v)}`);
    }
  }
  if (c.dance) {
    lines.push("### Dance backgrounds");
    for (const [k, v] of sortedEntries(c.dance)) {
      lines.push(`- ${k}: ${stringify(v)}`);
    }
  }
  if (c.current) {
    lines.push("### Current life");
    for (const [k, v] of sortedEntries(c.current)) {
      lines.push(`- ${k}: ${stringify(v)}`);
    }
  }
  if (c.thora) {
    lines.push("### Thora herself (self-reference rules)");
    for (const [k, v] of sortedEntries(c.thora)) {
      lines.push(`- ${k}: ${stringify(v)}`);
    }
  }
  if (Array.isArray(c.disclosure) && c.disclosure.length > 0) {
    lines.push("### Disclosure policy");
    lines.push("Topic | Share | Framing (ES)");
    for (const d of [...c.disclosure].sort((a, b) =>
      a.topic.localeCompare(b.topic))) {
      lines.push(`- **${d.topic}** [${d.share}]: ${d.framing_es ?? "—"}`);
    }
  }
  if (c.honeymoon_internal?.destination) {
    lines.push("### Honeymoon (INTERNAL — never share)");
    lines.push(`- destination: ${c.honeymoon_internal.destination}`);
    if (c.honeymoon_internal.rule) {
      lines.push(`- rule: ${c.honeymoon_internal.rule}`);
    }
  }
  return lines.join("\n");
}

function renderSchedule(events: BotEvent[]): string {
  const lines: string[] = [];
  lines.push("## Schedule (timezone: Europe/Madrid)");
  if (events.length === 0) {
    lines.push("_No events on file yet._");
    return lines.join("\n");
  }
  const sorted = [...events].sort((a, b) => a.startAt.localeCompare(b.startAt));
  for (const e of sorted) {
    lines.push(`### Event: ${e.id}`);
    lines.push(`- Name (ES): ${e.nameEs}`);
    lines.push(`- Name (EN): ${e.nameEn}`);
    lines.push(`- Start: ${e.startAt}`);
    if (e.endAt) lines.push(`- End (estimated): ${e.endAt}`);
    if (e.venueId) lines.push(`- Venue: ${e.venueId}`);
    if (e.dressCodeId) lines.push(`- Dress code: ${e.dressCodeId}`);
    if (e.transportNotes) lines.push(`- Transport notes: ${e.transportNotes}`);
    if (e.whom) lines.push(`- Whom: ${e.whom}`);
    if (e.descriptionEs) lines.push(`- Description (ES): ${e.descriptionEs}`);
    if (e.descriptionEn) lines.push(`- Description (EN): ${e.descriptionEn}`);
    lines.push("");
  }
  return lines.join("\n").trimEnd();
}

function renderWelcomeBora(): string {
  return [
    "## Welcome at Chiringuito Bora (NOT a formal event)",
    "El Chiringuito Bora en Valdevaqueros es un punto informal de encuentro" +
      " para guests que llegan antes del fin de semana. NO es un evento de la" +
      " boda. Thora puede mencionarlo cuando alguien pregunta por planes para" +
      " tardes libres, pero no aparece en `lookup_events()`.",
  ].join("\n");
}

function renderVenues(venues: BotVenue[]): string {
  const lines: string[] = [];
  lines.push("## Venues");
  if (venues.length === 0) {
    lines.push("_No venues on file yet._");
    return lines.join("\n");
  }
  const sorted = [...venues].sort((a, b) => a.id.localeCompare(b.id));
  for (const v of sorted) {
    lines.push(`### Venue: ${v.id}`);
    lines.push(`- Name: ${v.name}`);
    if (v.type) lines.push(`- Type: ${v.type}`);
    if (v.address) lines.push(`- Address: ${v.address}`);
    if (v.lat != null && v.lng != null) {
      lines.push(`- Lat/Lng: ${v.lat},${v.lng}`);
    }
    if (v.mapsLink) lines.push(`- Maps link: ${v.mapsLink}`);
    if (v.webLink) lines.push(`- Web link: ${v.webLink}`);
    if (v.parking) lines.push(`- Parking: ${v.parking}`);
    if (v.notes) lines.push(`- Notes: ${v.notes}`);
    lines.push("");
  }
  return lines.join("\n").trimEnd();
}

function renderTravel(t: Awaited<ReturnType<typeof getTravel>>): string {
  const lines: string[] = [];
  lines.push("## Travel & logistics");
  if (!t) {
    lines.push("_no travel doc yet_");
    return lines.join("\n");
  }
  if (t.bus) {
    lines.push("### Bus pickup (ceremony day)");
    lines.push(
      `- Date: ${t.bus.date_iso ?? "?"} — depart ${t.bus.departure_time_local ?? "?"}` +
      `, arrive by ${t.bus.arrive_by_local ?? "?"}`
    );
    lines.push(`- Pickup: ${t.bus.pickup_label_es ?? "?"} / ${t.bus.pickup_label_en ?? "?"}`);
    if (t.bus.notes_es) lines.push(`- Notes (ES): ${t.bus.notes_es}`);
    if (t.bus.notes_en) lines.push(`- Notes (EN): ${t.bus.notes_en}`);
  }
  if (Array.isArray(t.airports) && t.airports.length > 0) {
    lines.push("### Airports");
    for (const a of t.airports) {
      const drive = a.drive_minutes_to_tarifa != null ?
        ` (~${a.drive_minutes_to_tarifa} min by car)` : "";
      lines.push(`- ${a.id} ${a.name}${drive}`);
      if (a.notes_es) lines.push(`  · ES: ${a.notes_es}`);
      if (a.notes_en) lines.push(`  · EN: ${a.notes_en}`);
    }
  }
  if (t.taxi?.phone_display) {
    lines.push("### Taxi");
    lines.push(`- Phone: ${t.taxi.phone_display}`);
    if (t.taxi.notes_es) lines.push(`- ES: ${t.taxi.notes_es}`);
    if (t.taxi.notes_en) lines.push(`- EN: ${t.taxi.notes_en}`);
    lines.push("- Thora gives the number formatted to be click-to-call. " +
      "She does NOT dial (\"sin pulgares no marco 🐾\").");
  }
  if (t.self_drive_ceremony) {
    lines.push("### Self-driving to the ceremony");
    if (t.self_drive_ceremony.notes_es) {
      lines.push(`- ES: ${t.self_drive_ceremony.notes_es}`);
    }
    if (t.self_drive_ceremony.notes_en) {
      lines.push(`- EN: ${t.self_drive_ceremony.notes_en}`);
    }
  }
  return lines.join("\n");
}

function renderDressCodes(d: Awaited<ReturnType<typeof getDressCodes>>): string {
  const lines: string[] = [];
  lines.push("## Dress codes");
  if (!d?.codes) {
    lines.push("_no dress codes yet_");
    return lines.join("\n");
  }
  for (const [eventId, c] of sortedEntries(d.codes)) {
    const cc = c as {title_es?: string; title_en?: string; code_es?: string; code_en?: string};
    lines.push(`### ${eventId}`);
    if (cc.title_es) lines.push(`- ${cc.title_es}`);
    if (cc.code_es) lines.push(`  - ES: ${cc.code_es}`);
    if (cc.code_en) lines.push(`  - EN: ${cc.code_en}`);
  }
  return lines.join("\n");
}

function renderWeatherWind(w: Awaited<ReturnType<typeof getWindTips>>): string {
  const lines: string[] = [];
  lines.push("## Weather and wind");
  if (!w) {
    lines.push("_no wind tips yet — current weather snapshot still surfaces" +
      " via the `get_current_weather` tool_");
    return lines.join("\n");
  }
  if (w.primer_es) lines.push(`### Primer (ES)\n${w.primer_es.trim()}`);
  if (w.primer_en) lines.push(`### Primer (EN)\n${w.primer_en.trim()}`);
  if (w.levante_strong) {
    lines.push(
      `### Levante strong (> ${w.levante_strong.threshold_kmh ?? "?"} km/h)`
    );
    for (const t of w.levante_strong.tips_es ?? []) {
      lines.push(`- ES: ${t}`);
    }
    for (const t of w.levante_strong.tips_en ?? []) {
      lines.push(`- EN: ${t}`);
    }
  }
  if (w.poniente_strong) {
    lines.push(
      `### Poniente strong (> ${w.poniente_strong.threshold_kmh ?? "?"} km/h)`
    );
    for (const t of w.poniente_strong.tips_es ?? []) {
      lines.push(`- ES: ${t}`);
    }
    for (const t of w.poniente_strong.tips_en ?? []) {
      lines.push(`- EN: ${t}`);
    }
  }
  lines.push(
    "_Current weather snapshot lives in the per-turn user content via " +
    "`get_current_weather` — it changes faster than the cache TTL and is " +
    "deliberately uncached._"
  );
  return lines.join("\n");
}

function renderAccommodations(
  list: Awaited<ReturnType<typeof listAccommodations>>
): string {
  const lines: string[] = [];
  lines.push("## Accommodations");
  if (list.length === 0) {
    lines.push("_no accommodations yet_");
    return lines.join("\n");
  }
  const sorted = [...list].sort((a, b) => a.id.localeCompare(b.id));
  for (const a of sorted) {
    lines.push(`### ${a.id}`);
    lines.push(`- Name: ${a.name}`);
    if (a.role) lines.push(`- Role (ES): ${a.role}`);
    if (a.role_en) lines.push(`- Role (EN): ${a.role_en}`);
    if (a.approx_price_range_eur_per_night) {
      lines.push(`- Price/night: ${a.approx_price_range_eur_per_night}`);
    }
    if (a.booking_link) lines.push(`- Booking: ${a.booking_link}`);
    if (a.notes_es) lines.push(`- Notes (ES): ${a.notes_es}`);
    if (a.notes_en) lines.push(`- Notes (EN): ${a.notes_en}`);
  }
  return lines.join("\n");
}

function renderTarifaGuide(
  guide: Awaited<ReturnType<typeof getTarifaGuide>>
): string {
  const lines: string[] = [];
  lines.push("## Tarifa concierge guide");
  if (!guide) {
    lines.push("_no Tarifa guide yet_");
    return lines.join("\n");
  }
  // Skip non-category metadata keys (version, last_updated, etc).
  const skip = new Set(["version", "last_updated", "lastUpdated"]);
  const categories = Object.keys(guide)
    .filter((k) => !skip.has(k))
    .sort();
  for (const cat of categories) {
    const items = guide[cat];
    if (!Array.isArray(items) || items.length === 0) continue;
    lines.push(`### ${cat}`);
    for (const it of items as Array<Record<string, unknown>>) {
      const name = typeof it.name === "string" ? it.name : "(unnamed)";
      const area = typeof it.area === "string" ? ` — ${it.area}` : "";
      lines.push(`- **${name}**${area}`);
      if (typeof it.description === "string" && it.description.trim()) {
        lines.push(`  · ${it.description.trim()}`);
      }
      if (typeof it.personal_note === "string" && it.personal_note.trim()) {
        lines.push(`  · personal: ${it.personal_note.trim()}`);
      }
      if (typeof it.contact === "string" && it.contact.trim()) {
        lines.push(`  · contact: ${it.contact.trim()}`);
      }
    }
  }
  return lines.join("\n");
}

function renderGuestDossiers(
  dossiers: Awaited<ReturnType<typeof listGuestDossiers>>
): string {
  const lines: string[] = [];
  const n = dossiers.length;
  lines.push(
    `## Guest dossiers (${n} dossier'd guests; everyone else is handled ` +
    "warmly at scene-level only — NEVER invent personalization for " +
    "un-dossier'd guests)"
  );
  if (n === 0) {
    lines.push("_no dossiers loaded yet_");
    return lines.join("\n");
  }
  for (const d of dossiers) {
    lines.push(`### Guest: ${d.id}`);
    lines.push(`- Name: ${d.name}`);
    if (d.preferredName) lines.push(`- Preferred: ${d.preferredName}`);
    if (d.firstName) lines.push(`- First name (from guests/): ${d.firstName}`);
    if (d.relationship) lines.push(`- Relationship: ${d.relationship}`);
    if (d.hometown) lines.push(`- Hometown: ${d.hometown}`);
    if (d.languageOverride || d.language) {
      lines.push(`- Language: ${d.languageOverride ?? d.language}`);
    }
    if (d.recognizableFor) {
      lines.push(`- Visual hint: ${d.recognizableFor}`);
    }
    if (typeof d.recognitionConfidenceFloor === "number") {
      lines.push(`- Recognition floor: ${d.recognitionConfidenceFloor}` +
        (Array.isArray(d.referencePhotos) && d.referencePhotos.length === 0 ?
          " (no reference photos yet — text-only; do NOT name from a photo " +
          "unless the guest identifies themselves first)" :
          ""));
    }
    if (Array.isArray(d.safeFacts) && d.safeFacts.length > 0) {
      lines.push("- Safe facts (Thora MAY reference, framed appropriately):");
      for (const f of d.safeFacts) lines.push(`  - ${f}`);
    }
    if (Array.isArray(d.safeJokes) && d.safeJokes.length > 0) {
      lines.push("- Safe jokes (pre-authorized ONLY — never improvise):");
      for (const j of d.safeJokes) lines.push(`  - ${j}`);
    }
    if (Array.isArray(d.doNotMention) && d.doNotMention.length > 0) {
      lines.push("- Do NOT mention (hard exclusions):");
      for (const x of d.doNotMention) lines.push(`  - ${x}`);
    }
    if (Array.isArray(d.personalIntroFor) && d.personalIntroFor.length > 0) {
      lines.push(`- Personal-intro for: ${d.personalIntroFor.join(", ")}`);
      if (d.personalIntroBlurb) {
        lines.push(`  · blurb: ${d.personalIntroBlurb}`);
      }
    }
    lines.push("");
  }
  return lines.join("\n").trimEnd();
}

function renderFaq(faq: Awaited<ReturnType<typeof listFaq>>): string {
  const lines: string[] = [];
  lines.push("## Frequently asked questions");
  if (faq.length === 0) {
    lines.push("_no FAQ entries yet_");
    return lines.join("\n");
  }
  for (const f of faq) {
    lines.push(`### FAQ: ${f.id}`);
    lines.push(`- Question (ES): "${f.question_es}"`);
    lines.push(`- Question (EN): "${f.question_en}"`);
    lines.push(`- Answer (ES): "${f.answer_es}"`);
    lines.push(`- Answer (EN): "${f.answer_en}"`);
    if (Array.isArray(f.tags) && f.tags.length > 0) {
      lines.push(`- Tags: [${f.tags.join(", ")}]`);
    }
    lines.push("");
  }
  return lines.join("\n").trimEnd();
}

function renderSurprises(): string {
  return [
    "## Wedding surprises (lockdown rules — DO NOT REVEAL)",
    "- Ceremony arrival from the sea: strict pre-bus; \"id mirando al mar\" " +
      "hint at boarding (17:30 Sat); open at shore.",
    "- Musical bingo (post-dinner Sat): open hint allowed " +
      "(\"quedaos hasta el final de la cena\").",
    "- First-time dancing together: open hint allowed.",
  ].join("\n");
}

function renderLocked(): string {
  return [
    "## What is currently locked",
    "- Seating: revealed Saturday May 30 at 19:30 Europe/Madrid. " +
      "Before that: \"Eso te lo cuento el sábado 30 a las 19:30 🐾 Suspense.\"",
    "- Menu: no unlock — paper at-seat. If asked, deflect with humor: " +
      "\"El menú me lo escondieron porque se me hacía la boca agua 🐾\".",
  ].join("\n");
}

function renderModerationHints(
  extras: Awaited<ReturnType<typeof getBotKbExtras>>
): string {
  const lines: string[] = [];
  lines.push("## Song-request moderation hints (mild preferences, NOT hard blocks)");
  const m = extras?.moderation_hints;
  if (!m) {
    lines.push(
      "_no moderation hints yet — default behavior: accept every request_"
    );
    return lines.join("\n");
  }
  if (m.framing_note) {
    lines.push(m.framing_note.trim());
    lines.push("");
  }
  const hardArtists = m.hard_avoid?.artists ?? [];
  const hardSongs = m.hard_avoid?.songs ?? [];
  const teaseThemes = m.mild_tease?.themes ?? [];
  if (hardArtists.length > 0) {
    lines.push("Hard avoid — artists (use moderate_song_request verdict=decline_softly):");
    for (const a of hardArtists) lines.push(`- ${a}`);
  }
  if (hardSongs.length > 0) {
    lines.push("Hard avoid — songs (use moderate_song_request verdict=decline_softly):");
    for (const s of hardSongs) {
      const byArtist = s.artist ? ` — ${s.artist}` : "";
      lines.push(`- ${s.title}${byArtist}`);
    }
  }
  if (teaseThemes.length > 0) {
    lines.push("Mild tease — themes (use moderate_song_request verdict=tease_then_accept):");
    for (const t of teaseThemes) lines.push(`- ${t}`);
  }
  return lines.join("\n");
}

// ── Helpers ────────────────────────────────────────────────────────────

function sortedEntries(
  obj: Record<string, unknown> | undefined | null
): Array<[string, unknown]> {
  if (!obj || typeof obj !== "object") return [];
  return Object.entries(obj).sort(([a], [b]) => a.localeCompare(b));
}

function stringify(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v.trim();
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return v.map(stringify).join(", ");
  if (typeof v === "object") {
    return Object.entries(v as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, val]) => `${k}=${stringify(val)}`)
      .join("; ");
  }
  return String(v);
}
