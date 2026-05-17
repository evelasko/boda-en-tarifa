# Plan — Dynamic Seating Diagram (Phase 1, read-only)

**Status:** Ready for implementation
**Scope:** Phase 1 only — live, read-only staff diagram + editable layout config. Phase 2 (seat-assignment UI) and Phase 3 (retire spreadsheet as source of truth for seating) are documented at the bottom for context but are **out of scope** for this delivery.

---

## 1. Context

The wedding reception (Tarifa, 2026-05-30) needs a service-staff seating chart. The information that must appear next to each seat — main course choice, dietary restrictions, gift placement for children, table captain — lives across three Firestore collections:

- `guests/{guestUid}` — `fullName`, `child: boolean`, `tableCaptain: boolean`, etc.
- `rsvp_responses/{authUid}` — `responses.mainCoursePreference` (`'meat' | 'fish' | 'vegetarian'`), `responses.dietaryRestrictions` (free text). Linked to a guest via `linkedGuestUid`.
- `seating/{guestUid}` — `{ tableName: string, seatNumber: number }`. Today this is synced from a Google Sheet (`web/src/lib/sheet-guest-sync.ts`).

There is **no** canonical numeric table identity, no layout/position data, and no name↔number mapping yet. Today's only seating UI is `SeatingUploader.tsx`, which just lets an admin upload a static image of a hand-drawn plan.

**Owner-confirmed product rules:**
- 10 round tables in 3 rows. Row layout (left→right, top→bottom): `[[2,1,3],[4,6,10,7],[5,8,9]]`. Max 12 seats per table.
- Table name map: `1:Valdevaqueros, 2:Punta Paloma, 3:Los Lances, 4:Palmones, 5:Caños de Meca, 6:Bolonia, 7:Getares, 8:Arte y Vida, 9:El Palmar, 10:Zahara`.
- Seat geometry: compass convention (0° = top/N, increasing clockwise). Seat 1 is **always at 315°** (top-left); subsequent seats placed every `360°/totalSeats` clockwise. Example for 3 seats: 1@315°, 2@75°, 3@195°. Example for 8 seats: 1@315°, 2@0°, 3@45°, …, 8@270°.
- Empty seats are **not drawn**. Only as many seats as the table actually has are distributed over 360°.
- Per-seat fill + letter:
  - meat → orange + `C`
  - fish → blue + `P`
  - vegetarian → green + `V`
  - child → pink + `N` (always wins; children never have an RSVP doc)
- Children always get a 🎁 badge (gift placed on their seat).
- Table captains always get a 👑 badge.
- Below each seat: `fullName` (bold) and `dietaryRestrictions` verbatim (small text, second line). All guests except children have an RSVP, so dietary text is the source of truth.
- Server-rendered on page load; manual "Actualizar" button (no live subscription).
- Printable A3 landscape on the day of the event.

---

## 2. Goals & Non-goals

**Goals (Phase 1):**
1. Introduce a canonical numeric table identity (`tableNumber`) and a Firestore-backed layout config (`app_config/seating_layout`) editable from the admin web.
2. Render the seating chart live at `/admin/seating` from Firestore, with print stylesheet for A3 landscape.
3. Surface unassigned/unresolved guests (those whose `seating.tableName` doesn't match any name in the layout, or whose `seating` doc is missing) as a warning panel.
4. Keep the Google Sheet sync working but extend it to also write `tableNumber`.

**Non-goals (Phase 1):**
- Drag-to-seat or any UI that mutates a guest's seat assignment from the admin. (Phase 2.)
- Disconnecting the spreadsheet as source of truth for seating. (Phase 3.)
- Exporting to Excalidraw / PNG / external tools. **Removed from scope per owner.**
- Guest-facing seating views.

---

## 3. Data Model

### 3.1 New Firestore doc: `app_config/seating_layout`

Single doc, fully overwritten on save (small payload, no contention concerns).

```ts
{
  rows: number[][];        // e.g. [[2,1,3],[4,6,10,7],[5,8,9]]
  names: Record<string,string>;  // { "1":"Valdevaqueros", "2":"Punta Paloma", ... } — string keys, integer-encoded
  maxSeats: number;        // 12
  updatedAt: Timestamp;    // serverTimestamp on every write
  updatedByAdminUid: string;
}
```

**Invariants enforced by the PUT endpoint:**
- `rows` is a non-empty array of non-empty arrays of positive integers.
- Every number appearing in `rows` appears exactly once across the whole structure (no duplicates, no skips outside the set).
- `Object.keys(names)` is exactly the set of numbers in `rows`, encoded as strings.
- `Number.isInteger(maxSeats) && maxSeats >= 1 && maxSeats <= 20`.

If the doc does not exist when the seating page loads, the API returns a 404 (the seed script must have been run). Both `/admin/seating` and `/admin/seating/layout` handle that case by showing a "Seed the layout first" empty state with a button that POSTs the canonical seed.

### 3.2 Changes to `seating/{guestUid}`

Add field `tableNumber: number | null`. The migration script (§7.2) back-fills it for all existing docs by resolving `tableName` against `app_config/seating_layout.names` (case-insensitive, trimmed). Unresolved docs get `tableNumber: null` and surface as warnings in the diagram.

The `tableName` field stays for now (Phase 2/3 will revisit). The diagram **only** uses `tableNumber`; `tableName` is shown as the label coming from the layout, never from the seating doc.

### 3.3 Firestore security rules

Add to `firebase/firestore.rules`:

```
// app_config/{docId} — admin-only writes; reads allowed to operators (no
// PII here, no need to expose to all signed-in users).
match /app_config/{docId} {
  allow read: if isOperator();
  allow write: if false;  // admin SDK only, via API routes
}
```

Existing `seating/{guestUid}` rule is unchanged (read for any authenticated user, writes via admin SDK only) — but **note** for reviewers: the per-guest read access is something the bot/app already relies on; leaving it alone.

---

## 4. Files to create

```
web/src/types/seating-layout.ts                            # types + color/letter constants
web/src/lib/seating-layout.ts                              # server-side validation + canonical seed
web/src/lib/seating-render.ts                              # server-side join (guests + rsvp + seating + layout)
web/src/lib/seating-geometry.ts                            # angle math (pure, unit-tested)
web/src/lib/__tests__/seating-geometry.test.ts             # geometry unit tests
web/src/lib/__tests__/seating-render.test.ts               # join logic unit tests (with mocked firestore)

web/src/app/api/admin/seating/layout/route.ts              # GET, PUT, POST (seed)
web/src/app/api/admin/seating/render/route.ts              # GET

web/src/app/admin/seating/page.tsx                         # /admin/seating
web/src/app/admin/seating/layout/page.tsx                  # /admin/seating/layout

web/src/components/admin/SeatingDiagram.tsx                # SVG renderer (client component)
web/src/components/admin/SeatingDiagramTable.tsx           # one <g> per table
web/src/components/admin/SeatingDiagramSeat.tsx            # one <g> per seat
web/src/components/admin/SeatingDiagramLegend.tsx          # colour/letter/emoji legend
web/src/components/admin/SeatingUnassignedPanel.tsx        # warning banner
web/src/components/admin/SeatingLayoutEditor.tsx           # rows / names / maxSeats editor (client)

web/src/app/admin/seating/print.css                        # @media print rules (imported by page.tsx)

web/scripts/seed-seating-layout.ts                         # idempotent seeder for app_config/seating_layout
web/scripts/migrate-seating-table-numbers.ts               # one-shot backfill of seating.tableNumber

prompts/plans/seating-diagram-phase-1.md                   # this file
```

## 5. Files to modify

```
web/src/lib/sheet-guest-sync.ts          # also write tableNumber on every seating write
web/src/components/admin/AdminSidebar.tsx # add nav entries
firebase/firestore.rules                 # add app_config rule
```

No other files require changes for Phase 1.

---

## 6. Type definitions — `web/src/types/seating-layout.ts`

```ts
import type { MainCoursePreference } from './rsvp';

export interface SeatingLayout {
  rows: number[][];
  names: Record<string, string>;
  maxSeats: number;
  updatedAt: string;          // ISO 8601
  updatedByAdminUid: string;
}

export type FoodCategory = 'meat' | 'fish' | 'vegetarian' | 'child' | 'unknown';

export interface SeatRender {
  tableNumber: number;
  tableName: string;
  seatNumber: number;
  guest: {
    uid: string;
    fullName: string;
    isChild: boolean;
    isCaptain: boolean;
    foodCategory: FoodCategory;
    dietaryRestrictions: string;     // verbatim, may be ''
  } | null;                          // null means a numbered seat with no assignment
}

export interface UnassignedGuest {
  uid: string;
  fullName: string;
  reason:
    | 'no_seating_doc'                       // no doc in seating/
    | 'unknown_table_name'                   // seating.tableName not in layout.names
    | 'table_number_outside_layout'          // seating.tableNumber not in layout.rows
    | 'duplicate_seat';                      // two guests on the same (table, seat)
  rawTableName?: string;
  rawSeatNumber?: number;
  rawTableNumber?: number | null;
  collidesWithUid?: string;                  // for duplicate_seat
}

export interface SeatingRenderPayload {
  layout: SeatingLayout;
  seats: SeatRender[];                       // every assigned seat, sorted by tableNumber then seatNumber
  unassigned: UnassignedGuest[];
  generatedAt: string;                       // ISO 8601
}

// ── Visual constants (single source of truth — consumed by SVG + legend) ──
export const FOOD_LABELS: Record<FoodCategory, string> = {
  meat: 'Carne',
  fish: 'Pescado',
  vegetarian: 'Vegetariano',
  child: 'Niño/a',
  unknown: 'Sin RSVP',
};

export const FOOD_LETTERS: Record<FoodCategory, string> = {
  meat: 'C',
  fish: 'P',
  vegetarian: 'V',
  child: 'N',
  unknown: '?',
};

// Fills — colour values to live in Tailwind theme or inline.
// Final hex values to be chosen against the project palette in CLAUDE.md
// (coral/sage/sand/ocean/cream/gold). Suggested starting values below.
export const FOOD_FILLS: Record<FoodCategory, string> = {
  meat: '#E89B5A',          // orange
  fish: '#5A8FB8',          // blue
  vegetarian: '#7BAA6E',    // green
  child: '#E58FB5',         // pink
  unknown: '#C9C2BA',       // grey
};

export const FOOD_STROKES: Record<FoodCategory, string> = {
  meat: '#A86A2E',
  fish: '#345E80',
  vegetarian: '#4F7A45',
  child: '#A35176',
  unknown: '#8C857D',
};

export const CAPTAIN_BADGE = '👑';
export const GIFT_BADGE = '🎁';

// Resolution helper — exposed for tests and the join logic.
export function resolveFoodCategory(
  isChild: boolean,
  mainCourse: MainCoursePreference | null | undefined,
): FoodCategory {
  if (isChild) return 'child';
  if (mainCourse === 'meat' || mainCourse === 'fish' || mainCourse === 'vegetarian') {
    return mainCourse;
  }
  return 'unknown';
}
```

---

## 7. Server-side modules

### 7.1 `web/src/lib/seating-layout.ts`

```ts
import 'server-only';
import { adminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { SeatingLayout } from '@/types/seating-layout';

const COLLECTION = 'app_config';
const DOC_ID = 'seating_layout';

export const CANONICAL_SEED: Omit<SeatingLayout, 'updatedAt' | 'updatedByAdminUid'> = {
  rows: [[2, 1, 3], [4, 6, 10, 7], [5, 8, 9]],
  names: {
    '1': 'Valdevaqueros', '2': 'Punta Paloma', '3': 'Los Lances',
    '4': 'Palmones', '5': 'Caños de Meca', '6': 'Bolonia',
    '7': 'Getares',  '8': 'Arte y Vida', '9': 'El Palmar', '10': 'Zahara',
  },
  maxSeats: 12,
};

export async function readSeatingLayout(): Promise<SeatingLayout | null> { ... }

export async function writeSeatingLayout(
  next: Omit<SeatingLayout, 'updatedAt' | 'updatedByAdminUid'>,
  adminUid: string,
): Promise<SeatingLayout> { ... }

/** Throws ValidationError on invariant violations (see §3.1). */
export function validateLayout(input: unknown): asserts input is Omit<SeatingLayout, 'updatedAt' | 'updatedByAdminUid'> { ... }

/** Case-insensitive, trimmed reverse lookup. Returns null if not found. */
export function tableNumberByName(layout: SeatingLayout, raw: string): number | null { ... }
```

### 7.2 `web/scripts/seed-seating-layout.ts`

Standalone Node script (run via `npx tsx scripts/seed-seating-layout.ts`). Idempotent: if the doc exists, prints current contents and exits 0 without modifying. Use `--force` flag to overwrite.

### 7.3 `web/scripts/migrate-seating-table-numbers.ts`

Standalone backfill. For each doc in `seating/`:
1. If `tableNumber` is already a number → skip.
2. Else resolve `tableName` via `tableNumberByName(layout, doc.tableName)`. On hit → update `tableNumber`. On miss → leave `tableNumber: null` and log to stderr as "UNRESOLVED <guestUid> <tableName>".

Prints summary at the end: `{ updated, unresolved, skipped }`. Does **not** delete `tableName`.

### 7.4 `web/src/lib/seating-geometry.ts`

Pure functions, no I/O. Heavy unit-test coverage.

```ts
/** Compass-convention angle for seat `seatNumber` (1-based) in a table of `totalSeats`. */
export function seatAngleDegrees(seatNumber: number, totalSeats: number): number {
  const step = 360 / totalSeats;
  return (315 + (seatNumber - 1) * step + 360) % 360;
}

/** Compass-angle to SVG (cx + r*sin, cy − r*cos). */
export function compassToSvg(cx: number, cy: number, r: number, angleDeg: number): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) };
}

/** Side of the table that the seat lies on — drives text-anchor and label offset direction. */
export function seatSide(angleDeg: number): 'top' | 'right' | 'bottom' | 'left' {
  // top: angle in [315, 45), right: [45, 135), bottom: [135, 225), left: [225, 315)
  ...
}
```

Tests must verify the exact examples from the spec:
- 8 seats: `[315, 0, 45, 90, 135, 180, 225, 270]`
- 3 seats: `[315, 75, 195]`
- 12 seats: `[315, 345, 15, 45, 75, 105, 135, 165, 195, 225, 255, 285]`
- 1 seat: `[315]`

### 7.5 `web/src/lib/seating-render.ts`

```ts
import 'server-only';
import { adminFirestore } from '@/lib/firebase-admin';
import { readSeatingLayout } from './seating-layout';
import { buildGuestRsvpLookup } from './admin-guest-rsvp';
import { resolveFoodCategory, type SeatingRenderPayload } from '@/types/seating-layout';

export async function buildSeatingRenderPayload(): Promise<SeatingRenderPayload | null> {
  const layout = await readSeatingLayout();
  if (!layout) return null;

  const [guestsSnap, rsvpSnap, seatingSnap] = await Promise.all([
    adminFirestore.collection('guests').get(),
    adminFirestore.collection('rsvp_responses').get(),
    adminFirestore.collection('seating').get(),
  ]);

  // 1. Index guests by uid.
  // 2. Build a guestUid → mainCoursePreference map from rsvp_responses, joining via:
  //    - linkedGuestUid (preferred, admin-curated)
  //    - case-insensitive email match (fallback) — reuse buildGuestRsvpLookup / resolveGuestRsvpStatus patterns
  //    Children have no RSVP, which is fine (foodCategory becomes 'child').
  // 3. For each seating doc:
  //    - resolve tableNumber (already on doc post-migration; fallback to tableNumberByName)
  //    - drop into a Map<tableNumber, Map<seatNumber, SeatRender | 'COLLISION'>>
  //    - record duplicates in the unassigned list
  // 4. For each guest in `guests` not present in the seating map, add to unassigned with reason 'no_seating_doc'.
  // 5. Flatten the map into seats[] sorted by tableNumber then seatNumber.
  // 6. Drop seats whose tableNumber is not in the layout, but record them as unassigned with
  //    reason 'table_number_outside_layout'.

  return { layout, seats, unassigned, generatedAt: new Date().toISOString() };
}
```

**Important:** the join must NOT include guests for tables that aren't in the layout — those go to the unassigned panel. Same for seat numbers > the count of actually-assigned seats at that table (no special handling — we just render whatever seats are assigned; empty seats are skipped per the geometry rule).

---

## 8. API contracts

All routes use `requireAdmin(request)` from `@/lib/admin-api-auth`.

### 8.1 `GET /api/admin/seating/layout`
- 200: `SeatingLayout`
- 404: `{ error: 'Layout no inicializado', code: 'not_seeded' }`

### 8.2 `PUT /api/admin/seating/layout`
- Body: `Omit<SeatingLayout, 'updatedAt' | 'updatedByAdminUid'>`
- 200: `SeatingLayout` (the just-written doc)
- 400: `{ error, details: string[] }` on validation failure (uses `validateLayout`)

### 8.3 `POST /api/admin/seating/layout`
- No body. Idempotent seed: if doc exists, return existing with 200; else write `CANONICAL_SEED` and return 201.

### 8.4 `GET /api/admin/seating/render`
- 200: `SeatingRenderPayload`
- 404: `{ error: 'Layout no inicializado', code: 'not_seeded' }` (mirrors 8.1)
- Caching: `Cache-Control: no-store` — the page is server-rendered with `force-dynamic` and the manual refresh button must always re-fetch fresh.

---

## 9. SVG component spec

### 9.1 `SeatingDiagram.tsx` (client component, `'use client'`)

Props: `{ payload: SeatingRenderPayload }`.

Top-level structure:

```
<div class="seating-diagram">
  <SeatingDiagramLegend />
  <SeatingUnassignedPanel guests={payload.unassigned} />  {/* hidden when empty */}
  <div class="seating-grid">                              {/* CSS grid: 3 rows, each row = flex with N tables */}
    {payload.layout.rows.map((row, i) => (
      <div class="seating-row" data-row={i}>
        {row.map(tableNumber => (
          <SeatingDiagramTable
            tableNumber={tableNumber}
            tableName={payload.layout.names[String(tableNumber)]}
            seats={seatsByTable.get(tableNumber) ?? []}
          />
        ))}
      </div>
    ))}
  </div>
</div>
```

`seatsByTable` is built once with `useMemo`.

### 9.2 `SeatingDiagramTable.tsx`

Each table is a fixed-size SVG (e.g. 320×320 viewBox). Inside:

| Element | Geometry | Style |
|---|---|---|
| Table circle | `<circle cx=160 cy=160 r=70/>` | sand fill, charcoal stroke |
| Table label (number) | `<text x=160 y=152 text-anchor=middle font-weight=bold>` | `#1` |
| Table label (name) | `<text x=160 y=170 text-anchor=middle>` | `Valdevaqueros` |
| Seats | `<g>` per seat, positioned via `seating-geometry` at radius 110 from centre | see 9.3 |

Use `viewBox` so the print stylesheet can scale tables independently of screen size.

### 9.3 `SeatingDiagramSeat.tsx`

Props: `{ seatNumber, totalSeats, seat: SeatRender, tableCenter: {cx, cy}, ringRadius }`.

```
- Compute angle = seatAngleDegrees(seatNumber, totalSeats).
- Compute (sx, sy) = compassToSvg(cx, cy, ringRadius, angle).
- Render:
    <g transform="translate(sx, sy)">
      <circle r=14 fill=FOOD_FILLS[cat] stroke=FOOD_STROKES[cat] stroke-width=1.5 />
      <text y=4 text-anchor=middle font-size=14 font-weight=bold fill=#fff>
        {FOOD_LETTERS[cat]}
      </text>
      {seat.guest?.isCaptain && <text y=-18 text-anchor=middle font-size=14>👑</text>}
      {seat.guest?.isChild && <text x=14 y=-10 font-size=12>🎁</text>}
      {/* Name + dietary text: rendered OUTSIDE the ring along the radial vector.
          Anchor position is at compassToSvg(cx, cy, ringRadius + 32, angle) − relative
          to the seat's translate, that's a vector of length 32 in the outward direction. */}
      <g transform="translate(${outwardDx}, ${outwardDy})">
        <text class="seat-name"  font-size=11 font-weight=600
              text-anchor={side === 'left' ? 'end' : side === 'right' ? 'start' : 'middle'}>
          {seat.guest?.fullName ?? ''}
        </text>
        <text class="seat-diet"  font-size=9
              text-anchor=... dy=12 fill=#555>
          {seat.guest?.dietaryRestrictions ?? ''}
        </text>
      </g>
      <text class="seat-number" y=22 text-anchor=middle font-size=8 fill=#777>
        {seatNumber}
      </text>
    </g>
```

Notes:
- **Empty seats are never drawn.** Per owner spec: "Empty seats should not be displayed at all. Always the total seats should be distributed along the 360°…" The `totalSeats` passed to `seatAngleDegrees` is the **count of actually-assigned guests at that table** — NOT `maxSeats` from the layout. So a table with 8 assignments draws 8 evenly-spaced seats over 360°, even if `maxSeats=12`. The `seat.guest === null` branch should therefore never be reached in normal operation; if it is, that's a data bug — render a debug-visible red disc with the seat number and log a warning.
- The seat-number text (`<text class="seat-number">`) sits inside the disc, near the bottom — included for staff to cross-reference with any printed table cards.
- `outwardDx`/`outwardDy` is the unit vector from table centre to seat × text offset (≈22px). Compute as `(sin(angle) * 22, -cos(angle) * 22)`.

### 9.4 `SeatingDiagramLegend.tsx`

Horizontal legend at the top of the page. Shows each food category as a coloured disc + letter + label, plus the 👑/🎁 emojis with descriptions ("Capitán de mesa: coloca menú impreso", "Niño/a: coloca regalo en su asiento" — owner to finalize wording).

### 9.5 `SeatingUnassignedPanel.tsx`

Renders only if `unassigned.length > 0`. Amber banner with a collapsible list grouped by reason. Each row: name + reason + raw values (`"Mesa en hoja: 'Valdevauceros' (sin coincidencia)"`).

---

## 10. Print stylesheet — `web/src/app/admin/seating/print.css`

Imported from the page. Key rules:

```css
@media print {
  @page { size: A3 landscape; margin: 8mm; }
  body { background: white; }
  .admin-sidebar, .admin-header, .seating-actions { display: none !important; }
  .seating-diagram { font-family: 'Helvetica Neue', Arial, sans-serif; }
  .seating-grid { gap: 12mm; }
  /* SVG already scales via viewBox; container width = page width */
  .seating-row { page-break-inside: avoid; }
}
```

Page has a visible "Imprimir" button that calls `window.print()`.

---

## 11. Admin pages

### 11.1 `/admin/seating/page.tsx` (server component)

```tsx
export const dynamic = 'force-dynamic';   // always SSR fresh

export default async function SeatingPage() {
  // Use the same fetch-from-API pattern the project uses elsewhere
  // (cookie-forwarding to the admin endpoint), OR call buildSeatingRenderPayload directly
  // since this is a server component on the same Next process. Prefer direct call to
  // avoid a self-fetch.
  const payload = await buildSeatingRenderPayload();
  if (!payload) return <SeatingNotSeededState />;
  return <SeatingDiagramClient payload={payload} />;
}
```

`SeatingDiagramClient` is a thin wrapper that adds the "Actualizar" button (calls `router.refresh()`) and the "Imprimir" button.

### 11.2 `/admin/seating/layout/page.tsx`

Renders `<SeatingLayoutEditor initial={layout} />`. The editor:
- Three "row" containers, each a horizontal list of table chips (chip shows `#N · Name`).
- Buttons: add row, remove row, add table to row, remove table from row, drag-reorder within a row.
- Rename inline (double-click the name).
- `maxSeats` numeric input.
- "Guardar" button → PUT. On validation error: show inline error list returned by the API.

Use existing `Button`, `Input`, `Card` components from `@/components/ui/*`. Drag-and-drop can use plain HTML5 DnD (no new dependency needed).

### 11.3 `AdminSidebar.tsx` nav entries

Add **after** `Contenido Programado`:

```ts
{ href: '/admin/seating', label: 'Plano de mesas', icon: <pick from lucide-react: 'Map' or 'Grid3x3'> },
{ href: '/admin/seating/layout', label: 'Configurar mesas', icon: Settings, nested: true },
```

---

## 12. Sheet-sync changes — `web/src/lib/sheet-guest-sync.ts`

In Phase 1, the sheet remains the source of truth for who sits at which seat. Update the sync so seating writes also include `tableNumber`:

1. Load the layout once at the top of `runSync` (`readSeatingLayout()`). Pass it through.
2. In the section that builds the seating write (search for `seatingPlan` around line 815):
   ```ts
   if (m.seatingPlan === 'delete') {
     // unchanged
   } else {
     const tableNumber = tableNumberByName(layout, m.seatingPlan.tableName);  // may be null
     await seatingRef.set({
       tableName: m.seatingPlan.tableName,
       seatNumber: m.seatingPlan.seatNumber,
       tableNumber,  // null if unresolved — surfaces in the unassigned panel
       updatedAt: FieldValue.serverTimestamp(),
     });
   }
   ```
3. Sync result should additionally report `{ seatingUnresolved: number }` — count of seating writes where `tableNumber` came out null. Log them to the sync output for visibility.

If the layout doc does not exist when the sync runs, skip the `tableNumber` resolution (leave it `null`) and emit a warning log line — the sync must not fail just because the layout hasn't been seeded yet.

---

## 13. Firestore rules — `firebase/firestore.rules`

Add a `match /app_config/{docId}` block (text in §3.3). Place it adjacent to the existing `seating/` block.

Deploy: `firebase deploy --only firestore:rules` (owner runs; not part of CI yet).

---

## 14. Testing

### 14.1 Unit tests
- `seating-geometry.test.ts` — verify the seat-1@315° invariant and the four example angle arrays from §1.
- `seating-render.test.ts` — pure logic test of `buildSeatingRenderPayload` with hand-crafted snapshot fixtures (use Firestore admin SDK mocks if available, else extract the join function into a pure helper that takes `{guests, rsvps, seating, layout}` and unit-test that). Cover:
  - Happy path: 3 guests, 1 child, 1 captain, correct food letters.
  - Child with a (theoretically) attached RSVP still resolves to `child`.
  - Guest with no RSVP & not a child → `unknown` / `?`.
  - Seating doc with `tableName` not in layout → goes to unassigned with `unknown_table_name`.
  - Guest with no seating doc → goes to unassigned with `no_seating_doc`.
  - Two guests assigned to the same `(tableNumber, seatNumber)` → both flagged `duplicate_seat`.
- `seating-layout.test.ts` — `validateLayout` against:
  - duplicate table number across rows → fail
  - `names` keys mismatch `rows` numbers → fail
  - `maxSeats` out of range → fail
  - canonical seed → pass

### 14.2 Manual smoke
1. Run `npx tsx scripts/seed-seating-layout.ts` against dev project.
2. Run `npx tsx scripts/migrate-seating-table-numbers.ts` against dev project. Verify console summary.
3. Open `/admin/seating/layout` — verify the canonical layout renders. Edit a name, save, reload — change persists.
4. Open `/admin/seating` — verify diagram renders. Spot-check 1 known guest's seat (food colour, dietary text).
5. Trigger `runSync` (or a manual sheet edit + sync) and verify the new seating doc has `tableNumber` populated.
6. Print preview (Cmd+P) on `/admin/seating` — verify A3 landscape, sidebar hidden, single page.
7. Temporarily rename a table in the layout so a seating doc's `tableName` no longer matches → verify "Sin coincidencia" warning appears.

### 14.3 What we will NOT test in Phase 1
- Drag-to-seat / assignment mutations (Phase 2).
- Live updates without manual refresh.
- Cross-browser print fidelity beyond Chrome/Safari.

---

## 15. Implementation order (suggested commits)

Each commit should keep the app deployable.

1. **types + geometry + tests** — `seating-layout.ts` (types only), `seating-geometry.ts`, both `*.test.ts`. No UI changes.
2. **layout backend** — `seating-layout.ts` (server helpers), `seed-seating-layout.ts` script, `app_config` Firestore rule, `GET/PUT/POST /api/admin/seating/layout`.
3. **layout admin UI** — `/admin/seating/layout` page + `SeatingLayoutEditor.tsx` + sidebar entry. End-to-end editable.
4. **migration + sheet sync update** — `migrate-seating-table-numbers.ts`, edits to `sheet-guest-sync.ts`. Run migration on dev.
5. **render backend** — `seating-render.ts`, `GET /api/admin/seating/render`, unit tests.
6. **diagram UI** — all `SeatingDiagram*` components, `/admin/seating` page, print.css, sidebar entry, legend, unassigned panel.

PRs 1–3 can ship without 4–6 being ready. PR 5 depends on PRs 2 and 4. PR 6 depends on PR 5.

---

## 16. Open decisions deferred to implementer

These are minor enough to call at code time, but flagged so they don't get missed:

1. **Exact hex values for food fills** — the constants in §6 are starting suggestions. Pick final values against the project palette (`coral`, `sage`, `sand`, `ocean`, `cream`, `gold` per `web/CLAUDE.md`). Update both `FOOD_FILLS` and `FOOD_STROKES` together.
2. **Lucide icon for the sidebar entries** — pick something semantic (`Map`, `LayoutGrid`, `CircleDot`). Settings for the layout sub-entry mirrors the existing nested pattern.
3. **Legend copy in Spanish** — owner to refine ("Carne", "Pescado", "Vegetariano", "Niño/a"). Captain/gift emoji captions in §9.4 are first-pass.
4. **Table dimensions when row count differs** — if row 2 has 4 tables and row 1 has 3, do we scale tables down in row 2 to fit the same width, or scale up rows 1 & 3? Recommendation: keep table SVGs at a fixed `320×320` viewBox and let CSS flexbox handle layout (`justify-content: space-around`). Each row stretches to container width with even gaps. Test at typical desktop width (≥1280px) and on A3 landscape.

---

## 17. Phase 2 & 3 — context only (NOT in this delivery)

Documented here so the Phase 1 implementer doesn't accidentally bake in assumptions that contradict the eventual end state.

**Phase 2 — seat-assignment UI in the admin web**
- "Unassigned guests" sidebar inside `/admin/seating` becomes draggable; drop targets are seats.
- New API `PUT /api/admin/seating/assignment` body `{ guestUid, tableNumber, seatNumber } | { guestUid, action: 'unseat' }`. Writes to `seating/{guestUid}`. Conflict detection (no two guests on the same seat) enforced server-side via Firestore transaction.
- Adds in-page conflict resolution UI for the `duplicate_seat` reason.

**Phase 3 — retire spreadsheet as source of truth for seating**
- Remove seating-related writes from `sheet-guest-sync.ts` (`tableNameRaw`, `seatRaw`, the `SeatingPlan` machinery). Keep sync for contact/profile fields only.
- Delete `tableName` field from `seating/` docs after a one-shot script copies it to `tableName` in `app_config/seating_layout.names` if it differs (sanity check; should already match).
- Update documentation (CLAUDE.md, sheet column comments, bot dossiers).

Phase 1 deliberately does NOT touch the sheet sync semantics beyond writing the additional `tableNumber` field — backward-compatible.
