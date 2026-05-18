# Agent briefing — Implement Phase 2 of the Dynamic Seating Diagram

## Your task

Implement **Phase 2** of the staff-facing seating diagram for the Enrique & Manuel wedding (Tarifa, 2026-05-30). The full specification is in **`prompts/plans/seating-diagram-phase-2.md`** — read it cover-to-cover before writing any code. Treat that document as the contract. This briefing summarizes the *why*, lifts the nuances that are easy to misread, points at the Phase 1 code you must extend (not duplicate), and tells you what to do when blocked.

You are working in:

```
/Users/henry/Workbench/White Hibiscus/dev/boda-en-tarifa
```

The Next.js admin app lives in `web/`. See `web/CLAUDE.md` for project conventions.

---

## Why this work exists

Phase 1 (commit `4dcde3ae`) shipped a live read-only seating diagram at `/admin/seating` that joins three Firestore collections, plus an editable layout config at `/admin/seating/layout`. Seating assignments — i.e., *which guest sits at which seat* — are still imported from a Google Sheet via `web/src/lib/sheet-guest-sync.ts`. That's clunky: editing the sheet, re-running sync, and re-checking the diagram is multi-step and error-prone, and certain operations (swap, unseat one person) are awkward to express as a sheet diff.

Phase 2 adds an **edit mode** to `/admin/seating` that lets the admin assign, move, swap, and unseat guests directly through the web UI. Phase 3 (separate delivery) will retire the sheet as source of truth — Phase 2 must not do that. Both write paths coexist throughout Phase 2; the admin chooses which to use.

---

## Read these before starting

1. **`prompts/plans/seating-diagram-phase-2.md`** — the spec. All 15 sections.
2. **`prompts/plans/seating-diagram-phase-1.md`** — for historical context. Phase 2 inherits the conventions defined there.
3. **The actual Phase 1 code.** You'll extend many of these — don't propose new structures that contradict them:
   - `web/src/types/seating-layout.ts` — types + colour/letter constants + `resolveFoodCategory`.
   - `web/src/lib/seating-layout.ts` — pure validation + `tableNumberByName`.
   - `web/src/lib/seating-layout-server.ts` — Firestore I/O for the layout doc. Note the `rowsToStorage`/`rowsFromStorage` wrappers (Firestore disallows nested arrays).
   - `web/src/lib/seating-render-core.ts` — the pure join. You will add `occupancy` to the payload here.
   - `web/src/lib/seating-render.ts` — Firestore wiring around the core. You will extend the payload it returns and reuse `buildSeatingRenderPayload` after every mutation.
   - `web/src/lib/seating-geometry.ts` — **do not change**. Compass convention, seat 1 at 315°, `compassToSvg` uses `(sin, −cos)`. Tests assert exact expected angle arrays.
   - `web/src/components/admin/SeatingDiagram.tsx` — the orchestrator. You'll add edit-mode state + drawer.
   - `web/src/components/admin/SeatingDiagramTable.tsx` — fixed 320 viewBox, ring radius 110. Drop target on the circle.
   - `web/src/components/admin/SeatingDiagramSeat.tsx` — orphan-seat path already exists (red `!` disc); reuse the visual vocabulary for transient drag/swap UI rather than inventing more.
   - `web/src/components/admin/SeatingUnassignedPanel.tsx` — extend, don't replace; add "Resolver" affordance for `duplicate_seat`.
   - `web/src/components/admin/SeatingLayoutEditor.tsx` — read this for the established HTML5 drag-and-drop pattern, the `fetchWithAuth` helper, the `useAuth()` usage, and the `sonner` toast pattern. Mirror it.
4. **`web/src/contexts/AuthContext.tsx`** — `useAuth()` returns `{ user, loading, ... }` where `user` is a Firebase `User` with `getIdToken()`.
5. **`web/src/lib/admin-api-auth.ts`** — `requireAdmin(request)` is the gate for every new API route.
6. **`web/src/app/api/admin/guests/[uid]/route.ts`** — reference pattern for `[guestUid]` routes.
7. **`firebase/firestore.rules`** — `seating/{guestUid}` is `allow write: if false`; all writes go through the admin SDK in API routes. No rule change required.
8. **`firebase/firestore.indexes.json`** — **do not** add a composite index for the seating collection. See nuance #2 below.

---

## Nuances that are easy to misread

### 1. Transactions read the WHOLE seating collection in memory

The seating collection has ~100 docs. A Firestore composite index (`tableNumber + seatNumber`) would let you query for collisions, but it adds a deploy step and yields no measurable benefit at this scale. Instead, inside `runTransaction`:

```ts
const seatingSnap = await tx.get(adminFirestore.collection('seating'));
const seating = seatingSnap.docs.map((d) => ({ guestUid: d.id, ...d.data() }));
```

Then filter in memory inside `planAssignment` (pure code). This is the recommended path in plan §4.1 and §9.

### 2. Writes ALWAYS include both `tableName` and `tableNumber`

`seating-render-core.ts:120-128` resolves table identity from `tableNumber` first, falling back to `tableNumberByName(layout, tableName)`. For Phase 2 writes to stay consistent, every assignment write must populate both fields:

```ts
tx.set(adminFirestore.collection('seating').doc(guestUid), {
  tableName: layout.names[String(tableNumber)],   // canonical name from layout
  seatNumber,
  tableNumber,                                    // canonical numeric id
  updatedAt: FieldValue.serverTimestamp(),
});
```

If you omit `tableName`, the sheet sync's next run will treat the doc as needing a sheet update — at best confusing, at worst it'll overwrite your assignment.

### 3. Three policies, with one invalid combination

`onConflict` is `'reject' | 'swap' | 'replace'` (default `'reject'`). The decision tree is in plan §9.1. The one invalid combination:

- **Requester is currently unseated + policy is `'swap'`** → throw a `ConflictError` and let the client re-call with `'replace'`. **Do not silently degrade `swap` to `replace`** — the user's intent is unclear and the client's modal should make them choose explicitly.

The other "no-op" case is when the requester is already at the target seat: return 200 with `outcome.kind === 'assigned'` and an empty writes array. Don't error.

### 4. `seatNumber` omitted means "auto-pick lowest unused"

If `req.seatNumber == null`, server picks lowest unused seat in `[1, layout.maxSeats]` for `req.tableNumber`. If all seats are taken, return 409 `table_full`. Pure helper: `pickLowestUnused(occupied, maxSeats)`. Unit-test this exhaustively (plan §12.1).

### 5. Edit-mode is a URL state, not just a React state

Use `?edit=1` so refresh, back/forward, and copy-paste-link all preserve mode. Read it via `useSearchParams()`, toggle via `router.push('?edit=1' | '/admin/seating')`. The toggle button label switches between "Editar plano" and "Salir de edición".

### 6. Always hide edit chrome from print

The print stylesheet (`web/src/app/admin/seating/print.css`) already hides `.seating-actions`. Add rules for:

```css
@media print {
  .seating-edit-drawer,
  .seating-edit-toggle,
  .seating-pending-banner { display: none !important; }
}
```

Edit mode + print = the same clean staff sheet a non-edit-mode print would produce. Spot-check this by entering edit mode and hitting Cmd+P.

### 7. The API returns the post-mutation payload in the response

Each successful `PUT`/`DELETE` returns `{ outcome, payload: SeatingRenderPayload }`. The client uses that payload to update local state instead of doing a full `router.refresh()` — snappier UX. Only fall back to `router.refresh()` on error (so the user sees fresh server state if our local state has drifted).

### 8. The transaction's plan code must be PURE

Mirror Phase 1's split: pure planning + decision in `seating-assignment-core.ts`, Firestore-wired transactional helper in `seating-assignment.ts`. The pure function takes `{ layout, seating, guestUid, target, policy }` and returns `{ outcome, writes, deletes? }` or throws. This is what enables the unit tests in §12.1 — they exercise every branch without touching Firestore.

### 9. The sheet sync stays untouched

`web/src/lib/sheet-guest-sync.ts` continues to drive seating writes from the Google Sheet. **Do not delete, weaken, or short-circuit** the seating-write block at lines ~836-849. Phase 2 is additive: two equally valid write paths during the transition. Phase 3 retires the sheet.

If you find yourself "improving" the sheet sync, stop. Out of scope.

### 10. HTML5 DnD, no new dependency

The Phase 1 `SeatingLayoutEditor.tsx` uses native HTML5 DnD (`draggable`, `onDragStart`, `onDragOver`, `onDrop`). Mirror the pattern. SVG elements work the same way in modern browsers — you can attach the handlers to `<g>` and `<circle>`. MIME type: `application/x-seating-guest`; payload `JSON.stringify({ guestUid })`. Always `e.preventDefault()` in `onDragOver` or the drop won't fire.

Do not introduce `react-dnd`, `dnd-kit`, or anything similar — overkill, and the project doesn't use them.

### 11. Children + captains are NOT special-cased in the assignment flow

Children are draggable like anyone else; the render layer already handles their pink/N + 🎁. Captains likewise are draggable like anyone else; the render layer already handles their 👑. The only place captains get special treatment is the captain-unseat confirmation toast (plan §11) — and even that is in the "ask the owner" list (see "When to ask" below).

### 12. The drawer's guest items need `isChild`/`isCaptain` — enrich `UnassignedGuest`

The drawer shows badges for child / captain guests. Add `isChild?: boolean` and `isCaptain?: boolean` to `UnassignedGuest` (in `seating-layout.ts` types) and populate them in `seating-render-core.ts` where unassigned entries are built. This is a small additive change; update the existing tests to expect the new fields.

### 13. `occupancy` is new on the payload — read all of §7.1

`TableOccupancy` carries `{ tableNumber, occupiedSeats[], nextAvailableSeat }` per layout table. Compute it server-side once in `seating-render-core.ts` so the drawer and the modals don't re-derive from `seats[]` on every render. Include empty tables (their `occupiedSeats` is `[]`, `nextAvailableSeat` is `1`). Extend `seating-render.test.ts` with a shape assertion.

---

## Conventions to follow (carry-over from Phase 1)

- **TypeScript strict.** `npx tsc --noEmit` from `web/` before any commit.
- **Lint clean.** `npm run lint` from `web/`.
- **Tests in `web/src/lib/__tests__/`** — match the existing setup. Pure-code modules get tests; Firestore-wired modules rely on manual smoke + the embedded pure tests.
- **Auth in API routes:** `requireAdmin(request)` first; on failure return `auth.response`.
- **Server-only modules** start with `import 'server-only';`.
- **Toast:** `import { toast } from 'sonner';` — for both success and error states.
- **Components from `@/components/ui/*`** — Button, Input, Card. If you need a `Popover` or `Dialog` that doesn't exist yet, check `web/src/components/ui/` before adding a new dependency; the project uses shadcn/ui patterns.
- **Spanish copy.** All user-facing strings in Spanish. Match the tone of existing admin pages.
- **Commit hygiene:** follow the 6-commit order in plan §13. Each commit must leave the app type-checking and building. Commit message style: lowercase, present-tense — see recent log (`git log --oneline -n 5`) for examples.
- **Don't touch unrelated files.** Untracked files in the repo (`bot/data/`, etc.) are not part of this work.

---

## When to ask vs. when to decide

**Ask the user** (don't guess) about — these are listed verbatim in plan §14:

1. **Default action in `ConfirmSwapModal`.** Plan defaults to "Intercambiar" first. Owner may prefer "Reemplazar" — confirm.
2. **Captain unseat confirmation toast.** Plan adds it; owner may want all unseats to be silent.
3. **Drawer position.** Plan says right-side fixed. Owner may prefer left, or a top accordion.
4. **`?edit=1` URL persistence.** Plan says yes (visible in shared links). Owner may prefer sessionStorage instead.
5. **Anything in the existing Phase 1 code that you think is wrong.** If you'd change Phase 1 to make Phase 2 cleaner, flag it before doing it. Don't refactor across phases unilaterally.

**Decide yourself** on:

- Internal helper names, file structure inside a module, fixture data, exact paddings, popover positioning algorithm.
- Whether to extract a sub-component when something exceeds ~250 lines.
- How to structure the drawer's search filter, sort order within groups.
- The exact "no-op" early-return logic for "guest dropped on their own current seat".

---

## How to verify success

You are done with Phase 2 when **all of the following** are true:

1. `npx tsc --noEmit` passes from `web/`.
2. `npm run lint` passes from `web/`.
3. All unit tests pass. `seating-assignment-core.test.ts` covers every case listed in plan §12.1. `seating-render.test.ts` has the new `occupancy` assertion.
4. `/admin/seating` (no query string) renders exactly as Phase 1 did — print view unchanged.
5. `/admin/seating?edit=1` shows the drawer; the print + edit toggle button hide each other appropriately.
6. Manual smoke checklist from plan §12.3, all 10 steps pass:
   - Drag from drawer to empty table → auto-pick lowest seat.
   - Drag a seated guest to a different empty seat → `moved`.
   - Drag onto occupied seat → swap modal → swap succeeds.
   - Click an assigned seat → popover with "Cambiar número" + "Quitar asiento".
   - Drop full table with omitted `seatNumber` → 409 `table_full`, toast appears.
   - Toggle off edit mode → page identical to a fresh `/admin/seating`.
   - Cmd+P from edit mode → A3 landscape, drawer + edit chrome hidden.
   - Manually-seeded `duplicate_seat` → "Resolver" button works.
   - Two-tab race → transaction wins, both tabs converge on next action.
7. `web/src/lib/sheet-guest-sync.ts` is **unchanged**.
8. No new dependencies added (verify `git diff` on `web/package.json`).

Hand back to the user with:

- A short summary (3-5 bullets) of what shipped.
- The list of commits.
- Anything you ended up deciding that the user might want to revisit.
- Any data anomalies surfaced while testing (e.g., guests whose `seating/` doc has invalid `tableNumber`).

---

## What NOT to do

- Don't weaken or alter the sheet sync. (Phase 3.)
- Don't add a Firestore composite index for the seating collection.
- Don't introduce `react-dnd`, `dnd-kit`, or any DnD library.
- Don't add a `react-modal` or similar; use the project's existing modal/dialog primitives in `@/components/ui/*` (read `MagicLinkModal.tsx` or `GuestFormModal.tsx` for the pattern).
- Don't silently degrade `swap` → `replace` server-side. Make the client re-call.
- Don't change `seating-geometry.ts`. The angle math is correct and frozen.
- Don't add fields to `seating/{guestUid}` docs beyond what plan §4 specifies.
- Don't introduce realtime Firestore subscriptions or polling.
- Don't change the layout editor or any Phase 1 component beyond the explicit modifications in plan §6.
- Don't deploy. The owner handles Firebase deploys (rules + Firestore migrations).
- Don't run anything destructive against production. Dev project only.

---

## Starting move

Read both plans, then start with **commit #1** from plan §13: add `TableOccupancy` to the payload, enrich `UnassignedGuest` with `isChild`/`isCaptain`, extend `seating-render-core.ts` to populate them, update the existing `seating-render.test.ts`. This is a small, safe change that proves you've read the existing structure correctly. Then move to commit #2 (pure assignment core + tests) — the highest-risk logic, isolated from Firestore and the UI.

Good luck.
