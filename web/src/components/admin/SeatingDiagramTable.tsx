'use client';

import SeatingDiagramSeat from './SeatingDiagramSeat';
import type { SeatRender } from '@/types/seating-layout';

interface Props {
  tableNumber: number;
  tableName: string;
  /** Already sorted by seatNumber. */
  seats: SeatRender[];
}

// ── SVG geometry constants (NOT in CSS — they feed the seat-position math).
// Tweaking these will rescale every table proportionally. The SVG viewBox is
// square so the table circle and the seat ring stay concentric.
const VIEW_BOX = 320;
const CENTER = VIEW_BOX / 2;
// Radius of the central (sand-filled) table circle.
const TABLE_RADIUS = 70;
// Radius of the ring on which seats are placed. Must be > TABLE_RADIUS plus
// the seat-disc radius to keep the seats clear of the table edge.
const SEAT_RING_RADIUS = 110;

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
        viewBox={`0 0 ${VIEW_BOX} ${VIEW_BOX}`}
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
