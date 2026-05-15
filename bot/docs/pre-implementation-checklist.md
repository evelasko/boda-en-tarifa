# Pre-Implementation Checklist

> Everything required to go from "design finalized" (state as of 2026-05-14) to "implementation in progress" and beyond, all the way to launch. Generated from the design refinement session that produced `couple-dossier.md`, `guest-dossier-schema.md`, `tarifa-guide.yaml`, plus the updates to `00`/`02`/`05`/`06`/`07`.
>
> **Current date**: 2026-05-14. **Wedding day**: 2026-05-30. **Days remaining**: 16 calendar days, ~12 working.
>
> **Already done** (from setup-guide.md, prior sessions):
> - Setup guide steps 1–12 completed.
> - Production phone number configured (parked; using test number for development).
>
> **Owner legend**: ⚙️ = operator (Enrique / Manuel) · 💻 = implementer · 🤝 = both

---

## 0. Critical path — must complete before implementation kickoff

Anything in this section blocks the implementer from starting Phase 1 of `bot/docs/implementation-plan.md`. Target: complete by D−14 (i.e., today/tomorrow).

| # | Task | Owner | Blocks | Done |
|---|---|---|---|---|
| 0.1 | Confirm Anthropic account exists with Sonnet 4.6 + Haiku 4.5 access; daily spend cap set (~€20). | ⚙️ | Phase 2 (Claude pipeline) | ☑ |
| 0.2 | Confirm Firebase secrets are set: `META_APP_SECRET`, `META_WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_BUSINESS_ACCOUNT_ID`, `WEBHOOK_VERIFY_TOKEN`, `ANTHROPIC_API_KEY`, `CLOUDINARY_*`. | ⚙️ | Phase 1 (webhook scaffold) | ☑ |
| 0.3 | **Spotify Developer App** — create app at developer.spotify.com, configure redirect URI, obtain `client_id` / `client_secret`. | ⚙️ | Phase 3 (F3 song_request integration) | ☑ |
| 0.4 | **Spotify wedding playlist** — create playlist "Boda E&M — peticiones" on your Spotify, get the playlist ID. | ⚙️ | Phase 3 | ☑ |
| 0.5 | **Spotify OAuth one-time authorization** — go through Auth Code flow once to authorize the Developer App to modify the playlist; obtain `refresh_token`. Add `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN`, `SPOTIFY_PLAYLIST_ID` to Firebase secrets. | 🤝 | Phase 3 | ☑ |
| 0.6 | **Decide Meta verification path (Q1 in `00-overview.md`)** — registered Autónomo / company name, or personal name? Either is fine; just lock the choice. | ⚙️ | Setup step 14 (prod number switchover) | ☑ |
| 0.7 | ~~**Confirm `botEnrolled` migration** is OK — script in Phase 2 will set `botEnrolled: true` on all existing `guests/*`. Identify any guests to mark `false` (Q6: probably none).~~ **Resolved 2026-05-14: all guests → `true`, no exclusion list.** Migration script for the implementer is unblocked. | ⚙️ | Phase 2 | ☑ |

---

## 1. Operator content authoring — substantive

These can run in parallel with implementation (Phases 2–4), but **all must complete by D−3 (2026-05-26)** to allow KB rebuild + final eval.

### 1.1 Couple dossier — fill-ins

File: `bot/specs/couple-dossier.md` §4.

| # | Task | Done |
|---|---|---|
| 1.1.1 | **Engagement** — date and circumstances. Decide if Thora may share (default: yes, but pick the gossip ceiling). | ☑ |
| 1.1.2 | **Current city** — where you both live now. Needed so Thora can answer "where do you live" naturally. | ☑ |
| 1.1.3 | **Honeymoon destination** — Thora should know internally (so she doesn't accidentally hint), but **off-limits** to share. Write it in §4 with the explicit "internal only" marker. | ☑ |
| 1.1.4 | **Any other on-the-record couple facts** worth seeding — shared hobbies beyond dance, where you got engaged, etc. | ☑ |
| 1.1.5 | **First-dance specifics** (optional) — song? Choreography hints? Decide which are teasable vs. surprise. | ☑ |

### 1.2 Guest dossiers — ~30 most-photographed guests

File: `bot/specs/guest-dossier-schema.md`. Per-guest entries written as YAML / JSON, uploaded to Firestore via the import script.

**Priority ordering** (do these top-down until time runs out):
1. **Closest family both sides** (parents, siblings, key cousins, key aunts/uncles)
2. **Best friends / bridal-party-equivalents**
3. **Long-time friends certain to be heavily photographed**
4. **Personal-intro contacts** (kite instructor, scuba operator, etc.) even if not heavily photographed

| # | Task | Done |
|---|---|---|
| 1.2.1 | **Compile candidate list** from `guests.json` — filter to ~30 most-photographed. Save list to `bot/specs/guest-dossier-targets.md`. | ☐ |
| 1.2.2 | **Collect 1–3 reference photos** per guest. Frontal, well-lit, recent. No sunglasses, no extreme angles. | ☐ |
| 1.2.3 | **Upload reference photos** to Cloudinary `bot/reference/{guestId}-{n}.jpg` (signed URLs). | ☐ |
| 1.2.4 | **Fill the schema** per guest: `name`, `preferred_name`, `recognizable_for`, `relationship`, `hometown`, `safe_facts`, **`safe_jokes`** (pre-authorized roast material — ceiling is "mild roast", NOT risqué), `do_not_mention`, `recognition_confidence_floor` (default 0.75; bump to 0.85 for siblings or elderly relatives). | ☐ |
| 1.2.5 | **Flag personal-intro contacts** — for guests who'll do kite lessons / scuba / restaurant intros etc., set `personal_intro_for` and `personal_intro_blurb`. Get the contact's verbal consent first. | ☐ |

### 1.3 Tarifa concierge guide

File: `bot/specs/tarifa-guide.yaml`. Each category has 1–6 items with `name`, `area`, `description`, optional `contact` + `personal_note`.

**Categories** (fill each; minimum 1 item per category):

| # | Category | Items | Personal notes? | Done |
|---|---|---|---|---|
| 1.3.1 | **Beaches** (Valdevaqueros, Bolonia, Los Lances, Punta Paloma already scaffolded — add personal notes) | 4–6 | Yes per beach | ☐ |
| 1.3.2 | **Restaurants** (paella, fish, tapas, breakfast, cocktail, chiringuito, splurge, vegetarian-friendly, family-friendly) | 6–10 | At least 1 per restaurant | ☐ |
| 1.3.3 | **Kite & wind** — your school recommendation + instructor name (with their consent for personal-intro mode) | 2–3 | Mandatory for personal-intro | ☐ |
| 1.3.4 | **Water** — scuba, paddle/SUP, surf | 3–5 | Optional | ☐ |
| 1.3.5 | **Sightseeing** — castillo + mirador + Baelo Claudia + casco antiguo scaffolded — add personal notes | 4–6 | Yes | ☐ |
| 1.3.6 | **Day trips** — Tánger, Vejer, Cádiz, Gibraltar scaffolded — add personal notes | 4–5 | Yes | ☐ |
| 1.3.7 | **Whale watching** — pick operator (FIRMM is a common choice) | 1–2 | Yes | ☐ |
| 1.3.8 | **Walking** — Faro de Camarinal scaffolded + add 1–2 more | 2–4 | Yes | ☐ |
| 1.3.9 | **Nightlife** — chiringuitos / bars in town | 3–5 | Yes | ☐ |
| 1.3.10 | **Family-friendly** — kid-friendly activities for guests with children | 2–4 | Optional | ☐ |

### 1.4 Moderation hints for song requests

File: write directly to Firestore at `config/bot.moderation_hints` (or seed-script-import). Schema in `06-whatsapp-flows.md` F3 handler.

| # | Task | Done |
|---|---|---|
| 1.4.1 | **Blocked artists** — list any artists you don't want at the wedding under any circumstance. | ☐ |
| 1.4.2 | **Blocked songs** — specific songs to exclude (e.g., over-played wedding clichés, ex-related). | ☐ |
| 1.4.3 | **Blocked themes** — free-form descriptions ("no religious processionals", "no songs about breakups"). | ☐ |
| 1.4.4 | **Operator note** — short note Thora can reference when delegating ("Mis humanos están saturados de esa canción 🐾"). | ☐ |

### 1.5 Event-data corrections in Firestore

These fix discrepancies between current `events/*` Firestore content and the design from `our-take.md`.

| # | Task | Owner | Done |
|---|---|---|---|
| 1.5.1 | **Drop or repurpose `welcome_dinner` event** — per `our-take.md`, there is no formal welcome dinner. Either delete the doc or rename it. | ⚙️ | ☐ |
| 1.5.2 | **Add `pre_wedding` event** — slug `pre_wedding`, name "Pre-boda — Drinks en Casa Explora", Fri May 29 22:30, venue Casa Explora. | ⚙️ | ☐ |
| 1.5.3 | **Confirm ceremony time** — currently 18:00 Sat. Verify bus departure 17:30. Update if wrong. | ⚙️ | ☐ |
| 1.5.4 | **Confirm reception (cocktail+dinner+party) timing** — cocktail ~20:00, dinner ~21:30, party ~midnight, end 05:00. Adjust as needed. | ⚙️ | ☐ |
| 1.5.5 | **Confirm brunch timing** — currently 11:30 Sun. Verify. | ⚙️ | ☐ |
| 1.5.6 | **Add `venues/carbones_13`** — name, full address, lat/lng, Maps link, parking note ("self-drivers: TBD"), tarifa entrance description. | ⚙️ | ☐ |
| 1.5.7 | **Add `venues/casa_explora`** — same fields. | ⚙️ | ☐ |
| 1.5.8 | **Update `venues/tres_mares`** — confirm the cocktail / dinner / party / brunch sub-areas; heel-plug availability noted. | ⚙️ | ☐ |
| 1.5.9 | **Add `venues/chiringuito_bora`** — Welcoming venue (informal); lat/lng so Thora can send pin if asked. | ⚙️ | ☐ |
| 1.5.10 | **`100% Fun` parking venue** — even though just a pickup point, add it so Thora can send pin for bus reminders. | ⚙️ | ☐ |

### 1.6 Dress codes per event

File: `config/dress_codes` in Firestore.

| # | Event | Dress code | Done |
|---|---|---|---|
| 1.6.1 | Pre-wedding (Casa Explora) | No code, casual. | ☐ |
| 1.6.2 | Ceremony (Carbones 13) | TBD — operator to fill. Beach formal? Cocktail? | ☐ |
| 1.6.3 | Reception (Tres Mares) | TBD — likely same as ceremony or slightly more polished. | ☐ |
| 1.6.4 | Brunch (Tres Mares pool) | Casual / poolside. | ☐ |

### 1.7 Self-driving parking info (Carbones 13)

| # | Task | Done |
|---|---|---|
| 1.7.1 | **Locate parking** — is there a lot? Street parking? How far from ceremony seating? | ☐ |
| 1.7.2 | **Add to KB** — write 1–2 lines for the venue record covering self-driving so Thora can answer the fringe case. | ☐ |

### 1.8 Wind tips

File: `config/wind_tips` in Firestore. Used by `weather_morning_brief` template when Levante > 25 km/h or Poniente > 30 km/h.

| # | Task | Done |
|---|---|---|
| 1.8.1 | Fill 3–5 short tips per wind type. E.g., Levante strong: "gorros y gafas si vais a la playa", "moños no aguantan", "ojo con la arena en los ojos"; Poniente: "olas más grandes, ojo bañistas inexpertos". | ☐ |

### 1.9 Template assets (images)

| # | Template | Asset needed | Hosted at | Done |
|---|---|---|---|---|
| 1.9.1 | T1 `welcome_onboarding` | Photo of Thora (warm, slightly playful, wedding-context). | `https://bodaentarifa.com/og/thora-welcome.jpg` | ☐ |
| 1.9.2 | T6 `film_developed` | Retro-film aesthetic photo, ideally featuring Thora. | `https://bodaentarifa.com/og/film-developed.jpg` | ☐ |
| 1.9.3 | T8 `farewell_thanks` | Sunset photo with Thora in frame (or group photo if you have one in time). | `https://bodaentarifa.com/og/farewell.jpg` | ☐ |

### 1.10 FAQ seed entries

File: `faq/*` Firestore collection (created during Phase 2 — see `07-knowledge-base.md` §6). Pre-populate ~30 entries before launch.

| # | Suggested FAQ topics to seed (write Q + A in ES + EN) | Done |
|---|---|---|
| 1.10.1 | Parking at each venue | ☐ |
| 1.10.2 | Dress codes per event | ☐ |
| 1.10.3 | Kids welcome? | ☐ |
| 1.10.4 | Pets welcome? (Tarifa is dog-friendly — note Thora's presence) | ☐ |
| 1.10.5 | Gifts / wedding list | ☐ |
| 1.10.6 | Photo policy (consent already on web) | ☐ |
| 1.10.7 | Late arrival to ceremony | ☐ |
| 1.10.8 | Plus-one questions | ☐ |
| 1.10.9 | Vegan / gluten-free options | ☐ |
| 1.10.10 | Casa Explora dinner reservation note (mentioned in the design session as FAQ-only) | ☐ |
| 1.10.11 | Hotel transfers between Tres Mares / Copacabana / Dulce Nombre | ☐ |
| 1.10.12 | Wedding hashtag (if any) | ☐ |
| 1.10.13 | Languages spoken at the wedding | ☐ |
| 1.10.14 | What to do if you get sick / first aid | ☐ |
| 1.10.15 | Sand / shoes for ceremony | ☐ |

---

## 2. Meta-side approvals (parallel with Phase 3 implementation)

Submit between D−10 and D−7 (i.e., by 2026-05-20) to leave buffer for re-submission of any rejections.

### 2.1 Templates — 16 logical × 2 languages = 32 total

| # | Template | Submitted | Approved |
|---|---|---|---|
| 2.1.1 | `welcome_onboarding_es` | ☐ | ☐ |
| 2.1.2 | `welcome_onboarding_en` | ☐ | ☐ |
| 2.1.3 | `rsvp_reminder_es` | ☐ | ☐ |
| 2.1.4 | `rsvp_reminder_en` | ☐ | ☐ |
| 2.1.5 | `event_reminder_30min_es` | ☐ | ☐ |
| 2.1.6 | `event_reminder_30min_en` | ☐ | ☐ |
| 2.1.7 | `seating_unlock_es` | ☐ | ☐ |
| 2.1.8 | `seating_unlock_en` | ☐ | ☐ |
| 2.1.9 | `film_developed_es` | ☐ | ☐ |
| 2.1.10 | `film_developed_en` | ☐ | ☐ |
| 2.1.11 | `weather_morning_brief_es` | ☐ | ☐ |
| 2.1.12 | `weather_morning_brief_en` | ☐ | ☐ |
| 2.1.13 | `farewell_thanks_es` | ☐ | ☐ |
| 2.1.14 | `farewell_thanks_en` | ☐ | ☐ |
| 2.1.15 | `manual_announcement_es` | ☐ | ☐ |
| 2.1.16 | `manual_announcement_en` | ☐ | ☐ |
| 2.1.17 | `escalation_followup_es` | ☐ | ☐ |
| 2.1.18 | `escalation_followup_en` | ☐ | ☐ |
| 2.1.19 | `feedback_request_es` | ☐ | ☐ |
| 2.1.20 | `feedback_request_en` | ☐ | ☐ |
| 2.1.21 | `bus_pickup_early_es` | ☐ | ☐ |
| 2.1.22 | `bus_pickup_early_en` | ☐ | ☐ |
| 2.1.23 | `bus_pickup_last_es` | ☐ | ☐ |
| 2.1.24 | `bus_pickup_last_en` | ☐ | ☐ |
| 2.1.25 | `pre_wedding_drinks_es` | ☐ | ☐ |
| 2.1.26 | `pre_wedding_drinks_en` | ☐ | ☐ |
| 2.1.27 | `amenities_cocktail_es` | ☐ | ☐ |
| 2.1.28 | `amenities_cocktail_en` | ☐ | ☐ |
| 2.1.29 | `pitonisa_now_es` | ☐ | ☐ |
| 2.1.30 | `pitonisa_now_en` | ☐ | ☐ |
| 2.1.31 | `arrival_day_nudge_es` | ☐ | ☐ |
| 2.1.32 | `arrival_day_nudge_en` | ☐ | ☐ |

### 2.2 Flows — 4 logical × 2 languages = 8 total

(F2 `brunch_attendance` and F5 `photo_consent` are **dropped** per the design session; do not submit.)

| # | Flow | Submitted | Published |
|---|---|---|---|
| 2.2.1 | `rsvp_full_es` (4 screens) | ☐ | ☐ |
| 2.2.2 | `rsvp_full_en` (4 screens) | ☐ | ☐ |
| 2.2.3 | `song_request_es` (1 screen) | ☐ | ☐ |
| 2.2.4 | `song_request_en` (1 screen) | ☐ | ☐ |
| 2.2.5 | `logistics_intake_es` (2 screens, operator-trigger only) | ☐ | ☐ |
| 2.2.6 | `logistics_intake_en` (2 screens, operator-trigger only) | ☐ | ☐ |
| 2.2.7 | `feedback_es` (2 screens) | ☐ | ☐ |
| 2.2.8 | `feedback_en` (2 screens) | ☐ | ☐ |

---

## 3. Spec doc light cleanups (implementer can do alongside coding)

These are leftovers from the 2026-05-14 design refinement that weren't fully propagated to the architecture / data-model / integration / security docs. Light edits.

| # | Doc | Cleanup needed | Done |
|---|---|---|---|
| 3.1 | `bot/specs/01-prd.md` | F2 + F5 drop ripple; F6 (brunch) drop from feature inventory; add F (Tarifa concierge) feature; add F (face recognition / photo personalization). | ☐ |
| 3.2 | `bot/specs/03-architecture.md` | Add Spotify integration component; reference-photo caching; dossier import; vision pipeline component. | ☐ |
| 3.3 | `bot/specs/04-data-model.md` | Add `guest_dossier/{id}` schema; `config/tarifa_guide`; `config/bot.moderation_hints`; `song_requests` schema; `config/bot.spotify.*`; `pre_wedding` event slug. | ☐ |
| 3.4 | `bot/specs/08-integration-contract.md` | Add new template + tool signatures (T12–T17 + new lookup tools); update admin UI endpoints (`/admin/bot/songs`, `/admin/bot/tarifa-guide`, `/admin/bot/dossiers`). | ☐ |
| 3.5 | `bot/specs/09-security-privacy.md` | Note reference-photo (biometric-adjacent) storage in Cloudinary signed-only folder; dossier retention aligned with 90-day post-wedding purge; consent for personal-intro contacts. | ☐ |

---

## 4. Pre-launch smoke tests & polish (D−7 to D−2, i.e., 2026-05-23 to 2026-05-28)

These verify the bot end-to-end before the full broadcast.

| # | Task | Owner | Done |
|---|---|---|---|
| 4.1 | **Quality rating check** — WABA quality rating at least Medium with no warnings. | ⚙️ | ☐ |
| 4.2 | **Templates approved** — verify all 32 show "Approved" in Meta Business Suite. | ⚙️ | ☐ |
| 4.3 | **Flows published** — verify all 8 show "Published". | ⚙️ | ☐ |
| 4.4 | **Phone number connected** — production phone number shows "Connected" status. | ⚙️ | ☐ |
| 4.5 | **Live evals (RUN_LIVE_EVALS=1)** — run all 25+ golden examples from `02-conversation-design.md` §7. Pass criteria: 100%. | 💻 | ☐ |
| 4.6 | **Adversarial evals** — 10 cases: prompt injection, allowlist bypass, off-topic, very long messages, voice notes, stickers, NSFW. | 💻 | ☐ |
| 4.7 | **Bilingual UAT** — operator + Manuel + 2 trusted friends test in ES and EN. | 🤝 | ☐ |
| 4.8 | **Bot's quality rating subscribed alert** — Cloud Logging alert configured (per `admin-runbook.md` §5). | 💻 | ☐ |
| 4.9 | **Cost simulation** — 50 simulated turns, verify cache hit rate ≥85% and projected event cost <€30. | 💻 | ☐ |
| 4.10 | **Operator notification path** — verify high-urgency escalation pings Enrique's personal WhatsApp + Manuel as backup. | 🤝 | ☐ |
| 4.11 | **Disaster drill** — flip `config/bot.enabled = false`; verify bot stops responding within 10s. | 💻 | ☐ |
| 4.12 | **D-2 smoke test** — schedule fake event 5 min from now → verify reminder fires correctly. Then delete. | ⚙️ | ☐ |
| 4.13 | **Album content review** — go through `feed_posts` moderation queue, approve / hide as needed. | ⚙️ | ☐ |
| 4.14 | **`admin-runbook.md` walkthrough** — operator reads and walks through every section once. | ⚙️ | ☐ |

---

## 5. Launch sequence

| # | When | Task | Owner | Done |
|---|---|---|---|---|
| 5.1 | **D−8 (2026-05-21)** | Pilot broadcast: send `welcome_onboarding` to ~5 willing recipients (Enrique + Manuel + 2-3 friends). Verify rendering, fix issues. | ⚙️ | ☐ |
| 5.2 | **D−7 (2026-05-22)** | Full onboarding broadcast: `welcome_onboarding` to all `botEnrolled: true` guests, pre-segmented by language. | ⚙️ | ☐ |
| 5.3 | **D−7 to D−1** | Daily 10-min review: escalations queue, unknown-inbound queue, FAQ additions (per `admin-runbook.md` §2). | ⚙️ | ☐ |
| 5.4 | **D−1 (2026-05-28)** | Final album content review. | ⚙️ | ☐ |
| 5.5 | **D-day (2026-05-29 → 2026-05-31)** | Mornings: 5-min scan over coffee. During events: phone in pocket. Bot self-runs. | ⚙️ | — |
| 5.6 | **D+1 (2026-06-01) ~12:00** | `feedback_request` fires automatically. | — | — |
| 5.7 | **D+1 (2026-06-01) ~14:00** | Send `farewell_thanks` manually. | ⚙️ | ☐ |
| 5.8 | **D+1 (2026-06-01) ~17:00–19:00** | 60-min album moderation pass. | ⚙️ | ☐ |
| 5.9 | **D+1 (2026-06-01) 20:00** | `film_developed` fires automatically (album reveal). Verify. | ⚙️ | ☐ |

*Note: 5.8 and 5.9 are actually scheduled for D-day (Sunday May 31), not D+1. Sequence kept above to match wedding rhythm — see `admin-runbook.md` for definitive schedule.*

---

## 6. Open-but-deferred decisions (resolve before D−4)

These were deferred during the design session or surfaced in the spec edits. Some have defaults; confirm or override.

| # | Question | Default | Decided |
|---|---|---|---|
| 6.1 | `safe_jokes` ceiling per guest — confirm mild roast level is the cap (no risqué). | Mild roast cap. | ☐ |
| 6.2 | Reference photo resolution — 512px max side, JPEG q75. Tune if recognition is inaccurate. | 512px / q75. | ☐ |
| 6.3 | Recognition confidence floor default — 0.75. Adjust per-guest as needed for similar-looking siblings/twins. | 0.75 default; 0.85 for high-look-alike-risk. | ☐ |
| 6.4 | Wedding hashtag (if any) — for FAQ. | None. | ☐ |
| 6.5 | Whether to broadcast the "first time dancing together" hint via a dedicated template, or only rely on conversational hints. | Conversational only (no dedicated template). | ☐ |
| 6.6 | Whether to add a "good night" template for night-of-day-2 (post-party recovery message). | Skip for v1. | ☐ |
| 6.7 | Photo-of-Thora self-recognition canonical phrasing — "Esa soy yo 🐾 qué guapa salgo". | Set. | ☐ |
| 6.8 | Voice notes in v1.1 — Whisper transcription if time permits? | Defer. | ☐ |

---

## 7. Stretch goals (only if all above complete by D−5)

| # | Stretch | Done |
|---|---|---|
| 7.1 | Add a "post-party recovery" template fired Sun ~11:00 to nudge brunch attendance + tease album reveal at 20:00. | ☐ |
| 7.2 | Build a small admin UI for adding FAQ entries on the fly (instead of Firestore edit). | ☐ |
| 7.3 | Pre-event photo-of-Thora bait — send a "guess where Thora is today" engagement message to seed photo intake habit. | ☐ |

---

## Top-line summary — what's blocking implementation start

If you've completed **section 0** (7 items), the implementer can start Phase 1 today. Everything else can run in parallel.

If you complete section 0 + sections 1.1–1.3 (couple dossier + ~10 priority guest dossiers + at least 1 item per Tarifa-guide category) by D−10, the bot will launch with most of its personality intact. The remaining content can fill in up to D−3.

**Critical path watch points:**
- Spotify Developer App + OAuth (0.3–0.5) — non-trivial, do early.
- Reference photo collection for ~10 priority guests (1.2.2) — needs the guests to share recent photos with you.
- Meta template submission (section 2) — Meta approval is ~2h but can stall; submit early.
- D−2 smoke test (4.12) — last chance to catch issues.
