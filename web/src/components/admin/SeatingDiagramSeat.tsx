'use client';

import {
  CAPTAIN_BADGE,
  FOOD_FILLS,
  FOOD_LETTERS,
  FOOD_STROKES,
  GIFT_BADGE,
  type SeatRender,
} from '@/types/seating-layout';
import {
  compassToSvg,
  outwardUnitVector,
  seatAngleDegrees,
  seatSide,
} from '@/lib/seating-geometry';

interface Props {
  seat: SeatRender;
  totalSeats: number;
  /** 1-based seat position around the ring (NOT seat.seatNumber). */
  positionIndex: number;
  cx: number;
  cy: number;
  ringRadius: number;
}

// ── SVG geometry constants (NOT in CSS — these feed seat-position math) ─────
// Radius of the per-seat coloured disc.
const SEAT_DISC_RADIUS = 16;
// Distance from the seat centre to the name text anchor along the radial
// vector. Larger value → labels sit farther from the table.
const LABEL_OFFSET = 26;
// Vertical separation between the name line and the dietary line.
const LABEL_LINE_HEIGHT = 11;

export default function SeatingDiagramSeat({
  seat,
  totalSeats,
  positionIndex,
  cx,
  cy,
  ringRadius,
}: Props) {
  // Compute the seat's position on the table ring (compass-convention angle
  // → SVG x/y). See web/src/lib/seating-geometry.ts for the math.
  const angle = seatAngleDegrees(positionIndex, totalSeats);
  const { x, y } = compassToSvg(cx, cy, ringRadius, angle);
  // Outward unit vector — used to push the labels away from the table along
  // the radial line so they don't collide with the disc.
  const { dx, dy } = outwardUnitVector(angle);
  const side = seatSide(angle);

  const labelDx = dx * LABEL_OFFSET;
  const labelDy = dy * LABEL_OFFSET;

  // `textAnchor` determines whether the label text grows leftward, rightward
  // or balanced from its anchor. Picked so labels never overflow toward the
  // table centre.
  const textAnchor: 'start' | 'middle' | 'end' =
    side === 'left' ? 'end' : side === 'right' ? 'start' : 'middle';

  const cat = seat.guest?.foodCategory ?? 'unknown';
  const fill = FOOD_FILLS[cat];
  const stroke = FOOD_STROKES[cat];
  const letter = FOOD_LETTERS[cat];

  const guest = seat.guest;
  // Data bug indicator: plan §9.3 says this branch should never be reached
  // in normal operation. When it is, we render a white disc with a red `!`
  // and the literal "(asiento huérfano)" label so it's impossible to miss.
  const isOrphanSeat = guest === null;

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Seat disc. Stroke width is set via CSS class (--seat-stroke-width);
       *  fill + stroke colours come from inline style so they can be tweaked
       *  per category at the token layer (FOOD_FILLS / FOOD_STROKES → CSS
       *  variables). The orphan modifier class wins via specificity. */}
      <circle
        className={`seat-disc${isOrphanSeat ? ' seat-disc--orphan' : ''}`}
        r={SEAT_DISC_RADIUS}
        style={isOrphanSeat ? undefined : { fill, stroke }}
      />
      {/* Letter inside the disc (C/P/V/N/?). Colour + size from CSS vars. */}
      <text
        className={`seat-letter${isOrphanSeat ? ' seat-letter--orphan' : ''}`}
        textAnchor="middle"
        y={5}
      >
        {isOrphanSeat ? '!' : letter}
      </text>

      {/* Captain crown — sits above the disc. Decorative only; the actual
       *  protocol caption is in the legend. */}
      {guest?.isCaptain && (
        <text
          className="seat-captain"
          textAnchor="middle"
          y={-SEAT_DISC_RADIUS - 4}
        >
          {CAPTAIN_BADGE}
        </text>
      )}
      {/* Child gift parcel — sits at top-right of the disc. */}
      {guest?.isChild && (
        <text
          className="seat-gift"
          x={SEAT_DISC_RADIUS - 2}
          y={-SEAT_DISC_RADIUS + 2}
        >
          {GIFT_BADGE}
        </text>
      )}

      {/* Outer labels: guest name (bold) + verbatim dietary text below.
       *  The whole group is translated outward along the radial vector so
       *  the labels sit clear of the table circle. */}
      <g transform={`translate(${labelDx}, ${labelDy})`}>
        <text className="seat-name" textAnchor={textAnchor}>
          {guest?.fullName ?? (isOrphanSeat ? '(asiento huérfano)' : '')}
        </text>
        {guest?.dietaryRestrictions && (
          <text
            className="seat-diet"
            textAnchor={textAnchor}
            dy={LABEL_LINE_HEIGHT}
          >
            {guest.dietaryRestrictions}
          </text>
        )}
      </g>

      {/* Tiny numeric seat index inside the disc, near the bottom edge. Lets
       *  staff cross-reference with printed table cards if needed. */}
      <text
        className="seat-number"
        textAnchor="middle"
        y={SEAT_DISC_RADIUS + 9}
      >
        {seat.seatNumber}
      </text>
    </g>
  );
}
