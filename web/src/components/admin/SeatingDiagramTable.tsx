'use client';

import SeatingDiagramSeat from './SeatingDiagramSeat';
import type { SeatRender } from '@/types/seating-layout';

interface Props {
  tableNumber: number;
  tableName: string;
  /** Already sorted by seatNumber. */
  seats: SeatRender[];
}

// ── SVG geometry (NOT in CSS — these feed the seat-position math). ──────────
// The "core" coordinate space is a 320×320 square. All seat / table math is
// written against that square: table circle at (CENTER, CENTER) with radius
// TABLE_RADIUS, seats on a ring of radius SEAT_RING_RADIUS, label anchors
// at SEAT_RING_RADIUS + LABEL_OFFSET (LABEL_OFFSET lives in
// SeatingDiagramSeat.tsx). Tweaking these will rescale every table
// proportionally; the viewBox padding below adapts automatically.
const CORE_SIZE = 320;
const CENTER = CORE_SIZE / 2;
const TABLE_RADIUS = 70;
const SEAT_RING_RADIUS = 110;

// ── viewBox padding (cracks the original 320×320 wide open so side-seat
// labels don't clip). ──────────────────────────────────────────────────────
//
// Side-seat labels anchor at (CENTER ± (SEAT_RING_RADIUS + LABEL_OFFSET))
// and grow AWAY from the table centre by up to roughly the longest expected
// name width at the current font size. For Spanish full names rendered in
// uppercase 11px bold, ~130px of horizontal reach beyond the core square
// covers everything we've seen in the dataset (e.g. "MARÍA DEL CARMEN
// GARCÍA"). Bump HORIZONTAL_PAD if longer names start clipping again.
//
// VERTICAL_PAD is small — the top/bottom-seat labels are already mostly
// contained by the core square thanks to the side-aware stacking in
// SeatingDiagramSeat.tsx; a few pixels of breathing room for the captain
// crown above top seats and the dietary line below bottom seats is enough.
const HORIZONTAL_PAD = 130;
const VERTICAL_PAD = 16;
const VIEW_BOX_MIN_X = -HORIZONTAL_PAD;
const VIEW_BOX_MIN_Y = -VERTICAL_PAD;
const VIEW_BOX_WIDTH = CORE_SIZE + HORIZONTAL_PAD * 2;
const VIEW_BOX_HEIGHT = CORE_SIZE + VERTICAL_PAD * 2;

export default function SeatingDiagramTable({
  tableNumber,
  tableName,
  seats,
}: Props) {
  // `totalSeats` for the angle math is the count of ASSIGNED seats — empty
  // seats are never drawn (plan §1 / §9.3). A table with 8 assignments draws
  // 8 evenly-spaced seats over 360°, even if `layout.maxSeats === 12`.
  const totalSeats = seats.length;

  return (
    <div className="seating-table-card bg-white border border-charcoal/10 rounded-lg p-2 shrink-0">
      <svg
        viewBox={`${VIEW_BOX_MIN_X} ${VIEW_BOX_MIN_Y} ${VIEW_BOX_WIDTH} ${VIEW_BOX_HEIGHT}`}
        // Belt-and-braces: even if a parent stylesheet sets clipping, the
        // viewBox already contains everything we draw. `overflow="visible"`
        // is harmless when the viewBox is sized correctly and protects us
        // from regressions if a label inches outside.
        overflow="visible"
        className="w-full h-auto"
        role="img"
        aria-label={`Mesa ${tableNumber} ${tableName}`}
      >
        {/* Central table circle. Fill/stroke/width all come from CSS vars. */}
        <circle
          className="table-disc"
          cx={CENTER}
          cy={CENTER}
          r={TABLE_RADIUS}
        />
        {/* "#N" label, centred slightly above the table name. */}
        <text
          className="table-number-label"
          x={CENTER}
          y={CENTER - 6}
          textAnchor="middle"
        >
          #{tableNumber}
        </text>
        {/* Lighter table name below the number. */}
        <text
          className="table-name-label"
          x={CENTER}
          y={CENTER + 14}
          textAnchor="middle"
        >
          {tableName}
        </text>

        {/* One <SeatingDiagramSeat> per assigned guest. `positionIndex` is
         *  the 1-based slot on the ring (not the seat number) so that empty
         *  seats are skipped from the geometric distribution. */}
        {seats.map((seat, idx) => (
          <SeatingDiagramSeat
            key={`${seat.tableNumber}-${seat.seatNumber}-${idx}`}
            seat={seat}
            totalSeats={totalSeats}
            positionIndex={idx + 1}
            cx={CENTER}
            cy={CENTER}
            ringRadius={SEAT_RING_RADIUS}
          />
        ))}

        {/* Placeholder shown when a table has zero assignments. */}
        {totalSeats === 0 && (
          <text
            className="table-empty-label"
            x={CENTER}
            y={CENTER + 60}
            textAnchor="middle"
          >
            sin invitados asignados
          </text>
        )}
      </svg>
    </div>
  );
}
