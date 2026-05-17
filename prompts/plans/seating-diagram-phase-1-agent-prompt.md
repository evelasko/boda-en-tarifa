# Agent briefing — Implement Phase 1 of the Dynamic Seating Diagram

## Your task

Implement **Phase 1** of the staff-facing seating diagram for the Enrique & Manuel wedding (Tarifa, 2026-05-30). The full specification is in **`prompts/plans/seating-diagram-phase-1.md`** — read it cover-to-cover before writing any code. Treat that document as the contract. This briefing summarizes the *why*, lifts the nuances that are easy to misread, and tells you what to do when blocked.

You are working in:

```
/Users/henry/Workbench/White Hibiscus/dev/boda-en-tarifa
```

The Next.js admin app lives in `web/`. See `web/CLAUDE.md` for project conventions (TailwindCSS 4, App Router, TypeScript 5, design tokens, etc.).

---

## Why this work exists

The wedding has 10 round tables seating ~100 guests. Today the only seating UI is `web/src/components/admin/SeatingUploader.tsx`, which lets an admin upload a static image — useless for the service staff, who need to know per-seat: main course, dietary restrictions, who's a child (gift placement), and who's a table captain.

The data already exists across three Firestore collections (`guests`, `rsvp_responses`, `seating`) but isn't joined or visualised. Phase 1 builds:

1. A canonical layout config (`app_config/seating_layout`) + admin UI to edit it.
2. A server-rendered SVG diagram at `/admin/seating` that joins the collections live, with an A3-landscape print stylesheet so the staff can carry a paper copy on the day.
3. A migration + sheet-sync patch so the existing seating data gets a numeric `tableNumber` field alongside the legacy `tableName`.

Phases 2 (seat-assignment UI) and 3 (retiring the Google Sheet as seating source of truth) are **out of scope** — the plan documents them only so you don't paint into a corner.

---

## Read these before starting

1. **`prompts/plans/seating-diagram-phase-1.md`** — the spec. All 17 sections.
2. **`web/CLAUDE.md`** — project conventions, design tokens, tech stack.
3. **`web/src/types/guest.ts`** and **`web/src/types/rsvp.ts`** — the shape of the data you're joining. Note: `Guest.child` and `Guest.tableCaptain` are booleans on the guest doc; `responses.mainCoursePreference` is on the RSVP doc, joined via `linkedGuestUid` (preferred) or email fallback.
4. **`web/src/lib/admin-guest-rsvp.ts`** — existing join helpers (`buildGuestRsvpLookup`, `resolveGuestRsvpStatus`). Reuse the pattern in `seating-render.ts`.
5. **`web/src/app/api/admin/guests/route.ts`** — reference pattern for admin-auth-gated API routes. Mirror the structure for the new endpoints.
6. **`web/src/lib/sheet-guest-sync.ts`** — find the existing seating write around line 815 (`if (m.seatingPlan === 'delete')`). That's the single spot you patch.
7. **`web/src/components/admin/AdminSidebar.tsx`** — pattern for the two new nav entries.
8. **`firebase/firestore.rules`** — existing structure for the new `app_config/{docId}` rule.

---

## Nuances that are easy to misread

These are the spots where a careful read of the plan matters most. The plan has the full detail; this section just flags what to triple-check.

### 1. Seat angle math is COMPASS convention, not standard math

This is the highest-risk piece of code in the whole delivery. Get it wrong and every seat is mirrored or rotated.

- **Convention:** 0° = top (north), 90° = right (east), 180° = bottom (south), 270° = left (west). Clockwise.
- **Seat 1 is always at 315°** (top-left, north-west). Subsequent seats step by `360°/totalSeats` clockwise.
- **SVG conversion** (because SVG's y-axis points down): `x = cx + r · sin(θ)`, `y = cy − r · cos(θ)`. **Not** the standard `cos/sin` form.
- **Verify against the owner's worked examples** in the plan §1 and §14.1:
  - 8 seats → `[315, 0, 45, 90, 135, 180, 225, 270]`
  - 3 seats → `[315, 75, 195]`
  - 12 seats → `[315, 345, 15, 45, 75, 105, 135, 165, 195, 225, 255, 285]`
  - 1 seat → `[315]`
- Write the `seating-geometry.test.ts` unit tests **first**. If those pass, the rest of the SVG will look right.

### 2. `totalSeats` for angle math = count of ASSIGNED guests, not `maxSeats`

Empty seats are not drawn. A table with 8 assigned guests draws 8 evenly-spaced seats over 360° — even though `layout.maxSeats === 12`. Owner quote, verbatim:

> "Empty seats should not be displayed at all. Always the total seats should be distributed along the 360° displayed with an offset of -45°."

`maxSeats` is only used by the layout editor as a validation cap. The diagram never references it.

### 3. Children always resolve to `child`, no exceptions

Owner-confirmed:
> "Indeed, children will never have an RSVP response document and they all share the same menu (N)."

So `resolveFoodCategory(isChild=true, anything)` must return `'child'`. The pink/N fill and 🎁 emoji are unconditional for any guest with `child: true`. Don't add edge cases for "what if a child has an RSVP" — they don't.

### 4. All non-child guests already have RSVPs

Owner-confirmed:
> "All guests have already RSVP responses except children."

So `foodCategory === 'unknown'` (grey/`?`) should essentially never appear in production. Render it defensively (it's a useful "we have a data problem" indicator) but don't build elaborate empty-state UI around it.

### 5. Dietary text is VERBATIM

`responses.dietaryRestrictions` is free text the guest typed. Render it as-is on the second line under the name. Do NOT truncate (the existing `RsvpResponsesTable.tsx` truncates to 40 chars for table display — that pattern is wrong here; this is for the kitchen staff and they need the full text).

### 6. Phase 1 is read-only for seating assignments

The new write paths are exclusively for `app_config/seating_layout` (the layout editor) and `seating.tableNumber` (the migration script + the sheet-sync patch). **Do not** add any UI or API for assigning guests to seats, swapping seats, or unseating. That's Phase 2.

### 7. Server-rendered, manual refresh — no realtime

`/admin/seating/page.tsx` is a server component with `export const dynamic = 'force-dynamic'`. The "Actualizar" button calls `router.refresh()`. Do not introduce Firestore `onSnapshot` listeners, SWR, React Query, or any polling. The staff will refresh on demand.

### 8. Call `buildSeatingRenderPayload()` directly in the page, not via fetch

The `GET /api/admin/seating/render` endpoint exists for symmetry and external testing, but the server component should call the function directly to avoid a self-fetch round trip. Same applies to the layout page.

### 9. Sheet sync change is one-spot, additive

In `sheet-guest-sync.ts`, around line 815, add `tableNumber` to the seating write payload (resolved via `tableNumberByName(layout, m.seatingPlan.tableName)` — may be `null`). Do not refactor anything else in that file. If the layout doc doesn't exist when the sync runs, log a warning and write `tableNumber: null` — never fail the sync.

### 10. The canonical seed is exactly what the owner specified

```ts
rows: [[2, 1, 3], [4, 6, 10, 7], [5, 8, 9]]
names: {
  '1': 'Valdevaqueros', '2': 'Punta Paloma', '3': 'Los Lances',
  '4': 'Palmones', '5': 'Caños de Meca', '6': 'Bolonia',
  '7': 'Getares',  '8': 'Arte y Vida', '9': 'El Palmar', '10': 'Zahara',
}
maxSeats: 12
```

Don't second-guess the row order or names. Use Spanish accents where shown ("Caños de Meca").

### 11. Don't add export tooling

The owner explicitly cut Excalidraw/PNG/PDF-export-via-library from scope. The only "export" is browser print to A3 landscape via the `@media print` stylesheet. Don't add `puppeteer`, `playwright`, `react-pdf`, etc.

---

## Conventions to follow

- **TypeScript strict.** Run `npx tsc --noEmit` from `web/` before any commit.
- **Lint clean.** Run `npm run lint` from `web/`.
- **Tests.** Look at `web/src/lib/__tests__/` for the existing setup — match it. The two unit-test files specified in the plan §14.1 are required.
- **Auth.** Use `requireAdmin(request)` from `@/lib/admin-api-auth` on every new API route. Never invent a new auth path.
- **Firestore admin SDK.** `adminFirestore` from `@/lib/firebase-admin`. Server-side only — all new server modules start with `import 'server-only';`.
- **Components.** Reuse `@/components/ui/*` (Button, Input, Card, Badge, Tooltip). Don't introduce a UI kit.
- **Spanish copy.** All user-facing strings in Spanish. Match the tone of existing admin pages (`Configurar mesas`, `Plano de mesas`, `Actualizar`, `Imprimir`, `Sin coincidencia`, etc.).
- **Commits.** Follow the 6-commit order in plan §15. Each commit must leave the app type-checking and building. Commit messages in the style of existing repo history (`git log --oneline -n 10` to inspect).
- **Don't touch unrelated files.** The repo currently has several untracked directories (`.claude/skills/`, `bot/data/guest-dossiers/*`). Ignore them — they're not part of this work.

---

## When to ask vs. when to decide

**Ask the user** (don't guess) about:

1. **Final hex values** for `FOOD_FILLS` / `FOOD_STROKES`. The plan §6 has starting suggestions; the project palette in `web/CLAUDE.md` is `coral / sage / sand / ocean / cream / charcoal / gold`. Propose 2-3 options grounded in that palette and let the user pick.
2. **Lucide icons** for the two sidebar entries. Propose options (`Map`, `LayoutGrid`, `CircleDot`, `Armchair`, `Utensils`, etc.).
3. **Legend caption wording** for the captain (👑) and gift (🎁) badges. The plan has first-pass strings; let the user refine before merging.
4. **Any data shape you find that contradicts the plan.** The plan was written from a sample of the codebase, not exhaustive analysis. If `Guest`, `seating/`, or `rsvp_responses/` have fields the plan doesn't account for, flag it before proceeding.

**Decide yourself** on:

- Internal helper names, file structure within a module, test-fixture data, column widths in the layout editor, exact padding/margin values, etc.
- How to lay out the `SeatingLayoutEditor` UI (the plan describes the affordances, not the pixel layout). Native HTML5 drag-and-drop is fine — no new dependency.
- Whether to extract a sub-component if a file gets too long. Default to splitting at ~250 lines.

---

## How to verify success

You are done with Phase 1 when **all of the following** are true:

1. `npx tsc --noEmit` passes from `web/`.
2. `npm run lint` passes from `web/`.
3. All unit tests pass. The `seating-geometry.test.ts` and `seating-render.test.ts` files exist and cover the cases listed in plan §14.1.
4. `npx tsx scripts/seed-seating-layout.ts` against a dev Firestore writes the canonical seed (idempotently).
5. `npx tsx scripts/migrate-seating-table-numbers.ts` against a dev Firestore back-fills `tableNumber` on existing seating docs and prints a `{ updated, unresolved, skipped }` summary.
6. `/admin/seating/layout` renders the layout, lets you rename a table, reorder within a row, change `maxSeats`, and persists across reload.
7. `/admin/seating` renders the diagram with:
   - 3 rows in the exact `[2,1,3]/[4,6,10,7]/[5,8,9]` order.
   - Seat 1 of every table at the top-left (315°), subsequent seats wrapping clockwise.
   - Correct food fill + letter for at least one verified guest of each category (`meat`, `fish`, `vegetarian`, `child`).
   - 👑 badge on the table captain, 🎁 badge on every child seat.
   - Guest name (bold) + verbatim dietary restrictions below each seat.
   - "Actualizar" button works.
   - "Imprimir" button opens print preview that shows A3 landscape with the admin sidebar hidden.
8. The "Sin coincidencia" / unassigned panel appears if you intentionally rename a layout table so a seating doc's `tableName` no longer matches.
9. Sheet sync run (or one trigger after a sheet edit) writes `tableNumber` on the seating doc.
10. Firestore rules deploy cleanly (`firebase deploy --only firestore:rules` — owner runs, but the rules file must be valid).

Hand back to the user with:

- A short summary (3-5 bullets) of what shipped.
- The list of commits.
- Anything you ended up deciding that the user might want to revisit (icons, copy, hex values if you couldn't get a decision).
- Any data anomalies you found while testing (e.g. guests whose `tableName` doesn't resolve).

---

## What NOT to do

- Don't build a seat-assignment UI. (Phase 2.)
- Don't remove anything from `sheet-guest-sync.ts`. (Phase 3.)
- Don't introduce realtime Firestore subscriptions.
- Don't introduce Excalidraw, PDF libraries, headless browsers, or PNG export.
- Don't add new dependencies unless the plan requires them. (It doesn't — everything can be built with what's in `package.json`.)
- Don't rename `tableName` or delete it from seating docs. It stays for Phase 1.
- Don't touch the bot directories (`bot/`), the Flutter app directory (`app/` — shelved), or the unrelated untracked files in the repo.
- Don't deploy. The owner handles Firebase deploys.
- Don't run the migration or seed scripts against production without explicit owner confirmation. Dev project only.

---

## Starting move

Read the plan end-to-end, then start with **commit #1**: types, geometry module, and the geometry unit tests. Get those passing — they're the foundation everything else depends on, and they're the part most likely to surface a misunderstanding early.

Good luck.
