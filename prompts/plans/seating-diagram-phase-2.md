# Plan — Dynamic Seating Diagram (Phase 2: in-admin seat assignment)

**Status:** Ready for implementation
**Depends on:** Phase 1, committed as `4dcde3ae seating layout implementation phase 1`.
**Scope:** Add an "edit mode" to `/admin/seating` that lets the admin assign, move, swap, and unseat guests entirely from the web UI. The Google Sheet sync remains the canonical source of seating today; Phase 3 will retire it. Nothing in Phase 2 removes the sheet pipeline — it adds a second, equally valid write path.

---

## 1. Context — what Phase 1 left us with

Phase 1 already shipped the live diagram, the editable layout config, the unassigned-guests warning panel, and the migration that gave every `seating/{guestUid}` doc a `tableNumber`. The relevant files (do **not** rewrite — read them and extend):

| Purpose | File |
|---|---|
| Types + colour/letter constants + `resolveFoodCategory` | `web/src/types/seating-layout.ts` |
| Pure validation + `tableNumberByName` | `web/src/lib/seating-layout.ts` |
| Firestore I/O for the layout doc | `web/src/lib/seating-layout-server.ts` |
| Pure render join | `web/src/lib/seating-render-core.ts` |
| Firestore wiring for render | `web/src/lib/seating-render.ts` |
| Seat geometry (compass angles, `outwardUnitVector`, `seatSide`) | `web/src/lib/seating-geometry.ts` |
| Diagram + table + seat components | `web/src/components/admin/SeatingDiagram*.tsx` |
| Unassigned warning panel | `web/src/components/admin/SeatingUnassignedPanel.tsx` |
| Layout editor | `web/src/components/admin/SeatingLayoutEditor.tsx` |
| Seed prompt (when layout doc missing) | `web/src/components/admin/SeatingLayoutSeedPrompt.tsx` |
| Print stylesheet | `web/src/app/admin/seating/print.css` |
| API routes | `web/src/app/api/admin/seating/{layout,render}/route.ts` |
| Sidebar nav (`Utensils` + `LayoutGrid` icons) | `web/src/components/admin/AdminSidebar.tsx:29-30` |
| Sheet sync (now writes `tableNumber`) | `web/src/lib/sheet-guest-sync.ts:836-849` |

Phase 1 also established conventions Phase 2 must honour:

- **Pure logic ⇄ Firestore I/O split.** Pure module names use `-core` (e.g. `seating-render-core.ts`); Firestore-wired modules import `'server-only'`. Phase 2 follows the same split for `seating-assignment-core.ts` + `seating-assignment.ts`.
- **Toast library is `sonner`.** Already imported elsewhere (`SeatingLayoutEditor.tsx:4`).
- **Auth in client components:** `import { useAuth } from '@/contexts/AuthContext'`; the returned `user` is the Firebase `User` (call `user.getIdToken()` for the bearer token). The fetch helper pattern is in `SeatingLayoutEditor.tsx:22-36`.
- **Admin API routes** use `requireAdmin(request)` from `@/lib/admin-api-auth`. Return Spanish error strings.
- **Storage caveat:** Firestore does not allow nested arrays. `seating-layout-server.ts` wraps rows as `{ tables: number[] }` for storage. Phase 2 doesn't touch this but should be aware when reading the layout doc.
- **Orphan-seat path exists.** `SeatingDiagramSeat.tsx:55-73` renders `guest === null` as a red `!` disc. Phase 2 reuses this visual vocabulary for transient drag-state UI.

---

## 2. Goals & Non-goals

**Goals (Phase 2):**
1. Single "Modo edición" toggle on `/admin/seating` that surfaces an unassigned-guests drawer and enables drag-and-drop assignment.
2. New `PUT /api/admin/seating/assignments/[guestUid]` and `DELETE /api/admin/seating/assignments/[guestUid]` endpoints that mutate `seating/{guestUid}` transactionally, with collision detection and an explicit swap behaviour.
3. Drop-on-table = auto-pick lowest unused seat. Drop-on-occupied-seat = open swap confirmation modal. Click an assigned seat in edit mode = open a small action menu (change seat number, unseat).
4. Conflict-resolution UI for the existing `duplicate_seat` rows in the unassigned panel.
5. Edit-mode state persists in the URL via `?edit=1` so refreshes don't lose it; print mode (`window.print()`) always hides the drawer regardless of edit state.

**Non-goals (Phase 2):**
- Retiring the spreadsheet as source of truth (Phase 3).
- Bulk auto-arrangement / algorithmic seating.
- Audit log / undo / change history.
- Touch-DnD support (desktop pointer only). Mobile users print or use the layout editor only.
- Editing `Guest.tableCaptain` or `Guest.child` from the seating UI — those remain on `/admin/guests`.
- Editing dietary or main-course preferences from the seating UI.
- Bulk moves (multi-select drag).

---

## 3. UX walkthrough

The page at `/admin/seating` keeps its current default (the staff print-ready view). New behaviour:

### 3.1 Entering edit mode

- A new button "Editar plano" sits in `seating-actions` (top-right, next to "Imprimir"). Clicking it sets `?edit=1` and re-renders the page. The button label switches to "Salir de edición".
- In edit mode:
  - The "Imprimir" button is hidden (edit chrome would print otherwise).
  - A right-hand drawer (`<SeatingEditDrawer>`) slides in showing **unassigned + problematic guests**, searchable.
  - All seats become click-targets and drop-targets.
  - Each table circle becomes a drop-target (drop on the circle ≠ drop on a seat).

### 3.2 Assigning an unassigned guest

- Drag a guest chip from the drawer onto a table circle → server picks the lowest unused seat number for that table (1..`maxSeats`) and writes the assignment. Page revalidates (`router.refresh()`).
- Drag a guest chip onto a specific seat:
  - **Empty seat** (rare — only exists if a previous seat numbering left gaps): assign at that seat number.
  - **Occupied seat:** open `<ConfirmSwapModal>` — "Intercambiar con {existingGuestName}?" with default action "Intercambiar"; secondary action "Cancelar". If the incoming guest was previously seated, the modal also offers "Reemplazar (dejar a {existingGuestName} sin asiento)".

### 3.3 Re-seating an already-seated guest

- Drag the seat disc itself (the inner `<g>` of `SeatingDiagramSeat`) to another seat / table → same flow as above.
- Drag a seat disc onto the drawer's "Sin asiento" header → unseat (modal confirmation if the guest is a captain, otherwise silent).
- Click an assigned seat (single click, not drag) → small popover menu:
  - "Cambiar número de asiento" → numeric input modal (1..`maxSeats`); validates against current table's occupancy.
  - "Quitar asiento" → `DELETE`.
  - "Cancelar".

### 3.4 Resolving duplicates from the unassigned panel

- `SeatingUnassignedPanel` items with `reason === 'duplicate_seat'` get a new "Resolver" button.
- Clicking opens `<ResolveDuplicateModal>`: shows both guests + the contested (table, seat). Three actions:
  - "Mantener {A}, reasignar {B}" → unseats B; user can then drag B to a new spot.
  - "Mantener {B}, reasignar {A}" → mirror.
  - "Intercambiar" — only visible if both guests have other assignments (rare; mostly a guard against weird states).

### 3.5 Print remains untouched

Edit mode strips itself from print via the existing `print.css`. No print artefact ever shows drawer chrome.

---

## 4. Data model

**No schema change.** `seating/{guestUid}` already has `{ tableName, seatNumber, tableNumber, updatedAt }`. Phase 2 just adds writes from a new code path.

A new server-side helper writes both `tableName` (resolved from the layout's `names` map for that `tableNumber`) and `tableNumber` together, so the document stays consistent with Phase 1's read assumptions in `seating-render-core.ts:120-128`.

```ts
// On every assignment write (PUT):
seating/{guestUid} = {
  tableName: layout.names[String(tableNumber)],
  seatNumber,
  tableNumber,
  updatedAt: FieldValue.serverTimestamp(),
}
```

When the assignment endpoint deletes a doc (unseat), it just removes the doc; the migration's "missing seating doc → unassigned" path picks it up automatically.

### 4.1 Firestore index

If you implement collision detection with a composite query (`where('tableNumber','==',X).where('seatNumber','==',Y)`) you'll need to add the composite to `firebase/firestore.indexes.json`. **Recommendation:** don't. With ~100 docs total, reading the whole `seating` collection inside the transaction is cheap and avoids a deploy step. Pure in-memory filtering.

### 4.2 Firestore rules

No rule change. `seating/{guestUid}` rule remains `allow write: if false` — the admin SDK in the API route bypasses rules. Update the rule's adjacent comment if you want, but no functional change.

---

## 5. Files to create

```
web/src/types/seating-assignment.ts                              # request/response types
web/src/lib/seating-assignment-core.ts                           # pure: pickLowestUnused, planSwap, validation
web/src/lib/seating-assignment.ts                                # server-only: transactional write helpers
web/src/lib/__tests__/seating-assignment-core.test.ts            # unit tests

web/src/app/api/admin/seating/assignments/[guestUid]/route.ts    # PUT, DELETE

web/src/components/admin/SeatingEditDrawer.tsx                   # right-side drawer with searchable guest list
web/src/components/admin/SeatingEditDrawerItem.tsx               # one row in the drawer (draggable)
web/src/components/admin/SeatingSeatActionsPopover.tsx           # click-menu on an assigned seat
web/src/components/admin/ConfirmSwapModal.tsx                    # swap-vs-replace-vs-cancel confirmation
web/src/components/admin/ChangeSeatNumberModal.tsx               # numeric input for "Cambiar número de asiento"
web/src/components/admin/ResolveDuplicateModal.tsx               # duplicate_seat resolver
web/src/components/admin/SeatingDragLayer.tsx                    # optional: visual drag-preview overlay (only if needed; default to native DnD ghost)
```

## 6. Files to modify

```
web/src/components/admin/SeatingDiagram.tsx          # edit-mode state, drawer mount, edit toggle button
web/src/components/admin/SeatingDiagramTable.tsx     # drop-target on table circle; passes edit-mode down
web/src/components/admin/SeatingDiagramSeat.tsx      # draggable when assigned; drop-target; click handler
web/src/components/admin/SeatingUnassignedPanel.tsx  # add "Resolver" affordance on duplicate_seat rows
web/src/app/admin/seating/page.tsx                   # forward `?edit` from searchParams to SeatingDiagram
web/src/app/admin/seating/print.css                  # also hide .seating-edit-drawer when printing
web/src/lib/seating-render-core.ts                   # add `availableSeatsByTable` to the payload (see §7.1)
web/src/types/seating-layout.ts                      # add the optional `availableSeatsByTable` field
```

No other files need to change.

---

## 7. Type & payload extensions

### 7.1 `SeatingRenderPayload` — add `tableOccupancy`

Reason: the drag handlers and the "auto-pick lowest unused" preview both need to know which seats at a given table are free. Computing this server-side once is cheaper than re-deriving from `seats[]` on every render.

```ts
// In web/src/types/seating-layout.ts — append to SeatingRenderPayload
export interface TableOccupancy {
  tableNumber: number;
  occupiedSeats: number[];   // sorted ascending; seat numbers currently in use
  nextAvailableSeat: number | null;  // lowest unused in [1, maxSeats], null if full
}

export interface SeatingRenderPayload {
  layout: SeatingLayout;
  seats: SeatRender[];
  unassigned: UnassignedGuest[];
  generatedAt: string;
  occupancy: TableOccupancy[];   // one entry per layout table, even empty tables
}
```

Update `seating-render-core.ts` to compute and include `occupancy`. Tests in `seating-render.test.ts` need a new case asserting the shape.

### 7.2 `web/src/types/seating-assignment.ts`

```ts
import type { SeatingRenderPayload } from './seating-layout';

export type AssignmentConflictPolicy = 'reject' | 'swap' | 'replace';

export interface AssignmentRequest {
  tableNumber: number;
  /** When omitted, the server picks the lowest unused seat in [1, maxSeats]. */
  seatNumber?: number;
  /**
   * - 'reject' (default): if the target seat is occupied by a different guest, return 409.
   * - 'swap': move the target's current occupant to the requester's previous seat
   *   (or unseat the occupant if the requester was unseated).
   * - 'replace': unseat the target's current occupant; the requester takes the seat.
   *   The displaced guest ends up unassigned.
   */
  onConflict?: AssignmentConflictPolicy;
}

export type AssignmentOutcome =
  | { kind: 'assigned'; guestUid: string; tableNumber: number; seatNumber: number }
  | { kind: 'moved'; guestUid: string; from: { tableNumber: number; seatNumber: number }; to: { tableNumber: number; seatNumber: number } }
  | { kind: 'swapped'; a: { guestUid: string; tableNumber: number; seatNumber: number }; b: { guestUid: string; tableNumber: number; seatNumber: number } }
  | { kind: 'replaced'; placed: { guestUid: string; tableNumber: number; seatNumber: number }; displacedGuestUid: string }
  | { kind: 'unseated'; guestUid: string; from: { tableNumber: number; seatNumber: number } };

export interface AssignmentResponse {
  outcome: AssignmentOutcome;
  payload: SeatingRenderPayload;   // fresh render after the mutation
}

export interface AssignmentConflictError {
  error: string;
  code: 'seat_occupied' | 'table_full' | 'invalid_seat' | 'invalid_table' | 'unknown_guest';
  occupiedBy?: { guestUid: string; fullName: string };
}
```

The endpoint always returns the post-mutation `SeatingRenderPayload` so the client can swap state without a second round-trip. Falls back to `router.refresh()` if the client prefers SSR — but having the payload inline keeps the UX responsive.

---

## 8. API contracts

### 8.1 `PUT /api/admin/seating/assignments/[guestUid]`

- Body: `AssignmentRequest`
- 200: `AssignmentResponse` (kinds: `assigned`, `moved`, `swapped`, `replaced`)
- 400 `invalid_seat` / `invalid_table` / `unknown_guest`
- 404: layout not seeded (mirrors the Phase 1 pattern)
- 409 `seat_occupied`: returned when `onConflict === 'reject'` and the target seat is held by another guest. Body includes `occupiedBy` so the client can render the confirmation modal without a re-fetch.
- 409 `table_full`: returned when `seatNumber` was omitted and the table has `maxSeats` filled.
- 500: anything else.

### 8.2 `DELETE /api/admin/seating/assignments/[guestUid]`

- No body.
- 200: `AssignmentResponse` (kind `unseated`) — even if the guest had no seating doc, return 200 with `unseated` and `from` populated as best-effort (or 204 if you prefer; 200 keeps client code uniform).
- 404: layout not seeded.

### 8.3 `Cache-Control: no-store` on both routes.

---

## 9. Server logic — transactions

All writes go through one helper in `web/src/lib/seating-assignment.ts`:

```ts
import 'server-only';
import { adminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { readSeatingLayout } from './seating-layout-server';
import { pickLowestUnused, planAssignment } from './seating-assignment-core';
import { buildSeatingRenderPayload } from './seating-render';
// ...

export async function applyAssignment(
  guestUid: string,
  req: AssignmentRequest,
): Promise<AssignmentResponse> {
  const layout = await readSeatingLayout();
  if (!layout) throw new SeatingNotSeededError();

  // Pre-validate (cheap, before the transaction).
  if (!layout.rows.flat().includes(req.tableNumber)) throw new InvalidTableError();
  if (req.seatNumber != null && (req.seatNumber < 1 || req.seatNumber > layout.maxSeats)) {
    throw new InvalidSeatError();
  }

  const outcome = await adminFirestore.runTransaction(async (tx) => {
    // 1. Read the entire seating collection — small enough (~100 docs) that
    //    a snapshot is cheaper than a composite-indexed query.
    const seatingSnap = await tx.get(adminFirestore.collection('seating'));
    const seating = seatingSnap.docs.map((d) => ({ guestUid: d.id, ref: d.ref, ...d.data() }));

    // 2. Confirm the guest exists.
    const guestRef = adminFirestore.collection('guests').doc(guestUid);
    const guestDoc = await tx.get(guestRef);
    if (!guestDoc.exists) throw new UnknownGuestError();

    // 3. Plan the mutation in pure code.
    const plan = planAssignment({
      layout,
      seating,
      guestUid,
      target: req,
      policy: req.onConflict ?? 'reject',
    });
    // `plan` is one of:
    //   { kind: 'assigned' | 'moved', writes: [{guestUid, tableNumber, seatNumber}] }
    //   { kind: 'swapped', writes: [{...}, {...}] }
    //   { kind: 'replaced', writes: [{...}], deletes: [displacedGuestUid] }
    //   throws ConflictError | TableFullError as appropriate

    // 4. Apply writes (all sets/deletes; no further reads).
    const tableName = layout.names[String(req.tableNumber)] ?? '';
    for (const w of plan.writes) {
      const writeTableName = layout.names[String(w.tableNumber)] ?? tableName;
      tx.set(adminFirestore.collection('seating').doc(w.guestUid), {
        tableName: writeTableName,
        seatNumber: w.seatNumber,
        tableNumber: w.tableNumber,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
    for (const uid of plan.deletes ?? []) {
      tx.delete(adminFirestore.collection('seating').doc(uid));
    }
    return plan.outcome;
  });

  const payload = await buildSeatingRenderPayload();
  if (!payload) throw new SeatingNotSeededError();
  return { outcome, payload };
}

export async function unseatGuest(guestUid: string): Promise<AssignmentResponse> {
  // Similar transactional flow: read current doc, delete it, return outcome.
}
```

### 9.1 `planAssignment` — pure (in `seating-assignment-core.ts`)

Encapsulates the decision tree so it's unit-testable without Firestore.

```ts
export interface PlanAssignmentInput {
  layout: SeatingLayout;
  seating: Array<{ guestUid: string; tableNumber: number | null; seatNumber: number }>;
  guestUid: string;
  target: { tableNumber: number; seatNumber?: number };
  policy: AssignmentConflictPolicy;
}

export interface AssignmentPlan {
  outcome: AssignmentOutcome;
  writes: Array<{ guestUid: string; tableNumber: number; seatNumber: number }>;
  deletes?: string[];
}

export function planAssignment(input: PlanAssignmentInput): AssignmentPlan { ... }

export function pickLowestUnused(
  occupied: number[],
  maxSeats: number,
): number | null { ... }
```

Decision tree:
1. Resolve target seat (use given `seatNumber` if provided; else `pickLowestUnused`).
2. If no seat available → `TableFullError`.
3. Look up current occupant of (target.table, target.seat). Skip if it's the same guest (no-op or `seatNumber` matches existing assignment).
4. Look up requester's existing assignment.
5. Branch:
   - **No occupant:** single write. `outcome = requester was unseated ? 'assigned' : 'moved'`.
   - **Occupant exists, policy = 'reject':** throw `ConflictError({ occupiedBy: occupantUid })`.
   - **Occupant exists, policy = 'swap':**
     - If requester was unseated → cannot swap (no seat to give the occupant) → degrade to `'replace'` automatically OR throw and let the client re-call with `'replace'`. **Decision: throw `ConflictError({ code: 'seat_occupied', occupiedBy })` with a flag suggesting `replace`.** Don't silently change policy.
     - Otherwise: two writes (requester → target, occupant → requester's old seat). `outcome = 'swapped'`.
   - **Occupant exists, policy = 'replace':** one write (requester → target), one delete (occupant). `outcome = 'replaced'`.

### 9.2 `unseatGuest` plan

Trivial: if no doc exists, return `'unseated'` with `from = { tableNumber: 0, seatNumber: 0 }` (signal). If exists, delete + return `from` populated.

---

## 10. UI component spec

### 10.1 `SeatingDiagram.tsx` — additions

- Read `?edit` from `useSearchParams()`. Compute `editMode: boolean`.
- New top-right button: "Editar plano" / "Salir de edición" toggling the URL via `router.push('?edit=1' | '/admin/seating')` (no full reload — just shallow nav).
- When `editMode`:
  - Render `<SeatingEditDrawer />` as a right-aligned fixed-position panel (or inline alongside the diagram at large widths; both work).
  - Pass `editMode={true}` and `occupancy={payload.occupancy}` down to `SeatingDiagramTable`.
  - Hide "Imprimir" button.
- Maintain a single `pendingMutation` state to disable controls while a request is in flight (banner: "Guardando…").
- After a successful mutation, instead of `router.refresh()`, update local state with the returned `payload` (lighter). But fall back to `router.refresh()` on error so the UI re-reads.

### 10.2 `SeatingEditDrawer.tsx`

- Props: `{ unassigned: UnassignedGuest[], occupancy: TableOccupancy[], onAssign: (guestUid, target) => void }`.
- Structure:
  - Header: "Modo edición" + search input.
  - Section "Sin asiento" → guests with reason `no_seating_doc`.
  - Section "Conflictos" → reasons `unknown_table_name`, `table_number_outside_layout`, `duplicate_seat`. The duplicate items render a "Resolver" button that opens `<ResolveDuplicateModal>`.
  - Each entry is a `<SeatingEditDrawerItem>`.
- Search filters across `fullName` only (case-insensitive substring).
- The drawer itself is a drop target — dropping a seat here means unseat (handled in `SeatingDiagram` via shared drag context).

### 10.3 `SeatingEditDrawerItem.tsx`

- Props: `{ guest: UnassignedGuest }`.
- Renders: guest name + tiny role badges (👑 if captain — pull from the `seats[]`? No — Phase 2 must enrich the payload). **Add `isChild` and `isCaptain` to `UnassignedGuest`** in `seating-render-core.ts`; small additive change. (Also enrich the orphan-flag branches.)
- `draggable: true`. `onDragStart` sets `dataTransfer` with `application/x-seating-guest` MIME type carrying `JSON.stringify({ guestUid })`.

### 10.4 `SeatingDiagramTable.tsx` — additions

- New props: `editMode: boolean`, `occupancy: TableOccupancy | undefined`, `onDropAtTable: (guestUid) => void`.
- The outer `<circle>` becomes a drop target via SVG `onDragOver={(e) => { if (editMode) { e.preventDefault(); }}}` and `onDrop`.
- Visual hover state: while a guest is being dragged and the cursor enters the circle, raise the stroke width / change colour. Use a CSS class toggled via React state.

### 10.5 `SeatingDiagramSeat.tsx` — additions

- New props: `editMode: boolean`, `onAssignToSeat: (guestUid, tableNumber, seatNumber) => void`, `onClickInEditMode: () => void`.
- The disc `<g>` becomes:
  - `draggable={editMode && guest != null}` — only assigned seats can be dragged.
  - drop target when `editMode === true`.
  - `onClick={editMode ? onClickInEditMode : undefined}` — opens `<SeatingSeatActionsPopover>`.
- Drag payload mirrors the drawer: same MIME type, same JSON shape (`{ guestUid }`). The handler doesn't need to distinguish drawer-origin from diagram-origin — both produce the same write.

### 10.6 `SeatingSeatActionsPopover.tsx`

- Anchored to the clicked seat. Use the existing `Popover` component if one exists in `@/components/ui/*`; otherwise a controlled absolute-positioned div.
- Actions:
  - "Cambiar número de asiento" → opens `<ChangeSeatNumberModal>`.
  - "Quitar asiento" → confirmation toast + DELETE.

### 10.7 `ChangeSeatNumberModal.tsx`

- Numeric input bounded by [1, layout.maxSeats].
- Pre-validate against `occupancy[currentTable].occupiedSeats` excluding the current seat — disable "Guardar" if the chosen number is occupied (the modal explains).
- Submits a `PUT` with `{ tableNumber: currentTable, seatNumber: chosen, onConflict: 'reject' }`.

### 10.8 `ConfirmSwapModal.tsx`

- Triggered by `SeatingDiagram` when a `PUT` with `onConflict: 'reject'` returns 409.
- Three buttons: "Intercambiar", "Reemplazar", "Cancelar". The "Reemplazar" button is hidden if the requester was unseated (then "Intercambiar" is the only safe option — wait, that's wrong: if the requester was unseated, swap is *invalid* and replace is the only option; if the requester was seated, both are valid). Decide in code based on whether the requester currently has a seat.
- Re-submits with the chosen policy.

### 10.9 `ResolveDuplicateModal.tsx`

- Receives `{ a, b, contestedSeat }` from the unassigned-panel row.
- Two main actions: "Mantener {a}" (calls `DELETE /assignments/{b.uid}`) or "Mantener {b}" (mirror).
- After success, both rows disappear from the unassigned panel; the kept guest stays placed.

### 10.10 Drag-and-drop nuts and bolts

- Use plain HTML5 DnD; no new dependency. The Phase 1 `SeatingLayoutEditor` already uses HTML5 DnD — match that style.
- MIME type: `application/x-seating-guest`. Always set `dataTransfer.effectAllowed = 'move'`.
- On `dragover` for any drop target, call `e.preventDefault()` to allow the drop (HTML5 quirk).
- SVG drop targets work the same way as HTML drop targets in modern browsers — just attach `onDragOver` and `onDrop` to the `<g>` / `<circle>`.

### 10.11 `print.css`

Add:
```css
@media print {
  .seating-edit-drawer,
  .seating-edit-toggle,
  .seating-pending-banner { display: none !important; }
}
```

---

## 11. Edge cases & rules

| Case | Behaviour |
|---|---|
| Drag a guest onto their own current seat | No-op. Server returns 200 with `outcome.kind === 'assigned'`, no writes. |
| Drag a guest onto a different seat of their own table | `kind: 'moved'`, single write. |
| Drop on an unknown drop zone | No mutation; drag ends silently. |
| Table full and `seatNumber` omitted | 409 `table_full`. Drawer shows toast "Mesa {name} llena". |
| Layout doc deleted between page load and a write | 404 `not_seeded`. Toast + reload prompt. |
| Server returns 500 | Toast "Error al guardar"; preserve drag origin. |
| Captain dragged off the diagram | Confirmation toast: "¿Quitar a {name} (capitán)?" before DELETE. |
| Children — special handling? | None. Children are draggable like any guest, render pink/N with 🎁 when seated. |
| Two-tab race (admin edits in two browsers) | Last write wins. Transaction guarantees the conflict check ran against fresh state. UI shows the post-write payload, so the loser's screen "snaps" to the correct state on their next action. |

---

## 12. Tests

### 12.1 `seating-assignment-core.test.ts` — required cases

- `pickLowestUnused([], 12) === 1`
- `pickLowestUnused([1,2,4], 12) === 3`
- `pickLowestUnused([1,2,3,4,5,6,7,8,9,10,11,12], 12) === null`
- `pickLowestUnused([2,5], 6) === 1`
- `planAssignment`:
  - assign unseated guest to empty seat → `{ kind: 'assigned', writes: [1] }`
  - move seated guest to empty seat → `{ kind: 'moved', writes: [1] }`
  - assign to occupied seat with `reject` → throws `ConflictError({ code:'seat_occupied' })`
  - swap seated guest with seated occupant → `{ kind: 'swapped', writes: [2] }`
  - swap from unseated state with `swap` policy → throws (use `replace` instead)
  - replace from unseated state → `{ kind: 'replaced', writes: [1], deletes: [occupantUid] }`
  - assign with omitted `seatNumber` → picks lowest unused
  - assign with omitted `seatNumber` on full table → `TableFullError`
  - assign with target `tableNumber` not in layout → caller's responsibility (validated outside `planAssignment`); test the validation in the route handler indirectly

### 12.2 `seating-render.test.ts` — extend

Add a case asserting `occupancy[]` is populated for every layout table (including empty ones), `occupiedSeats` is sorted, and `nextAvailableSeat` is correct (including `null` for full tables and `1` for empty tables).

### 12.3 Manual smoke checklist

1. Open `/admin/seating?edit=1`. Drawer shows.
2. Drag a "Sin asiento" guest onto an empty table → toast "Asignado a mesa N — asiento M"; chip disappears from drawer.
3. Drag the just-placed guest onto a different seat at the same table → toast "Movido"; diagram updates.
4. Drag a different guest onto an occupied seat → modal asks "Intercambiar / Reemplazar / Cancelar".
5. Choose "Intercambiar" → both guests' positions swap. Diagram + drawer reflect.
6. Click an assigned seat → popover. Pick "Quitar asiento" → seat removed from diagram, guest back in drawer.
7. Toggle "Salir de edición" → drawer collapses, edit chrome hidden, layout otherwise identical.
8. Cmd+P from non-edit mode → A3 landscape print preview still clean. Cmd+P from edit mode → drawer + edit toggle hidden, print still clean.
9. Manually create a `duplicate_seat` (write two seating docs to the same table+seat via Firestore console) → reload → "Resolver" button visible → resolve → conflict gone.
10. Two-tab race: in tab A drag guest X to seat S. Tab B refresh and verify state matches. Then in tab B drag guest Y to seat S with reject policy → 409. Choose Replace → A's next refresh shows X displaced.

---

## 13. Implementation order

Each commit deployable on its own.

1. **Type + render extension.** `TableOccupancy`, payload field, `availableSeatsByTable` computation in `seating-render-core.ts`, enrich `UnassignedGuest` with `isChild`/`isCaptain`, extend existing test. No UI yet.
2. **Pure assignment core.** `seating-assignment-core.ts` + tests. No Firestore.
3. **Server helper + API routes.** `seating-assignment.ts` + `PUT/DELETE /api/admin/seating/assignments/[guestUid]/route.ts`. Backed by transactions. Cover at least one route-level test if the project has a pattern; otherwise rely on manual smoke.
4. **Edit-mode toggle + drawer (no DnD yet).** Surfaces unassigned + occupancy data; clicking a drawer item opens a stub "Assign to…" select listing tables. Manual smoke can already mutate via clicks. This gives us a functional UI even if DnD has issues.
5. **DnD on diagram.** Wire drag handlers on seats and tables; ConfirmSwapModal; ChangeSeatNumberModal; seat-action popover. Hide edit-only chrome in print.
6. **Duplicate resolver.** ResolveDuplicateModal + button on `SeatingUnassignedPanel`.

PRs 1–3 don't change any UI. PRs 4–6 layer it on.

---

## 14. Open decisions (to ask the user, not invent)

1. **"Replace" vs "Swap" default in `ConfirmSwapModal`.** Plan defaults to "Intercambiar" first. Owner may prefer "Reemplazar" — confirm.
2. **Captain unseat confirmation.** Plan adds a confirmation toast for captains specifically. Owner may want no special-case; confirm.
3. **Drawer position.** Plan says right-side fixed at large widths. Owner may prefer left side, or a top-of-page accordion on small screens.
4. **Persistence of `?edit=1` across page reloads.** Plan says yes (URL-encoded). Confirm — alternative is sessionStorage so it doesn't leak into shared URLs.
5. **Optimistic UI vs always-server-state.** Plan returns the post-mutation payload from the API and uses it directly. Owner may prefer a stricter "always re-fetch" model. The plan's approach is faster but means a server bug could let stale state through; the alternative is more conservative.

---

## 15. Phase 3 preview (NOT in this delivery — context only)

When Phase 3 lands:
- Remove `tableNameRaw`/`seatRaw`-driven seating writes from `sheet-guest-sync.ts`. The Phase 1 patch (lines ~836-849) goes away with its surrounding logic; the function then handles only contact/profile sync.
- Delete `tableName` from `seating/` docs after a one-shot migration verifies all docs have a valid `tableNumber` matching `app_config/seating_layout.names`.
- Document the new flow in `web/CLAUDE.md` and the sheet column legend.
- Remove the "unknown_table_name" reason from `UnassignedReason` (will no longer occur).

Phase 2 deliberately leaves the sheet pipeline alone so that an admin can still use the sheet during the transition if the new UI has issues. **Do not** remove or weaken the sheet path in this delivery.
