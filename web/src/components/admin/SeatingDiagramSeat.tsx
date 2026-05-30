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
import { splitGuestName } from '@/lib/seating-name';

interface Props {
  seat: SeatRender;
  totalSeats: number;
  /** 1-based seat position around the ring (NOT seat.seatNumber). */
  positionIndex: number;
  cx: number;
  cy: number;
  ringRadius: number;
  /** When true, omits dietary text and the red in-disc flag (e.g. /mesas). */
  hideDietary?: boolean;
  /** When true, omits the child gift badge on the seat disc (e.g. /mesas). */
  hideGiftBadge?: boolean;
  /** When true, omits the table-captain crown on the seat disc (e.g. /mesas). */
  hideCaptainBadge?: boolean;
}

// ── SVG geometry constants (NOT in CSS — these feed seat-position math) ─────
// Radius of the per-seat coloured disc.
const SEAT_DISC_RADIUS = 16;
// Distance from the seat centre to the label anchor along the radial vector.
// Larger value → labels sit farther from the table.
const LABEL_OFFSET = 26;
// Vertical separation between successive label lines (name line 1, name
// line 2, dietary). Used both to lay the lines out and to align the
// label block relative to the disc on top-side seats.
const LABEL_LINE_HEIGHT = 11;

export default function SeatingDiagramSeat({
  seat,
  totalSeats,
  positionIndex,
  cx,
  cy,
  ringRadius,
  hideDietary = false,
  hideGiftBadge = false,
  hideCaptainBadge = false,
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

  // Adult guests with a non-empty dietaryRestrictions string get a red
  // letter inside the disc — staff cue to look at the second line of text
  // below the disc. Children always have `dietaryRestrictions === ''` per
  // seating-render-core (their menu is uniform), so this never fires for N.
  const hasDietaryFlag =
    !hideDietary &&
    !isOrphanSeat &&
    !!guest?.dietaryRestrictions &&
    guest.dietaryRestrictions.trim().length > 0;

  // ── Build the stacked label block ────────────────────────────────────────
  // Guest name is rendered across two uppercase lines (split via
  // splitGuestName); the dietary text follows as an optional third line.
  // Orphan seats get a single placeholder line so the rest of the layout
  // logic still applies uniformly.
  const [nameLine1, nameLine2] = isOrphanSeat
    ? (['(asiento huérfano)', ''] as const)
    : splitGuestName(guest?.fullName ?? '');

  type LabelLine = { key: string; className: string; text: string };
  const labelLines: LabelLine[] = [];
  if (nameLine1) labelLines.push({ key: 'name1', className: 'seat-name', text: nameLine1 });
  if (nameLine2) labelLines.push({ key: 'name2', className: 'seat-name', text: nameLine2 });
  if (hasDietaryFlag && guest) {
    labelLines.push({ key: 'diet', className: 'seat-diet', text: guest.dietaryRestrictions });
  }

  // Side-aware vertical stacking:
  //   - For 'top' seats (labels sit ABOVE the disc): the LAST line should
  //     be at the radial anchor (closest to the disc); earlier lines stack
  //     upward. Otherwise a long stack would overflow back into the disc.
  //   - For all other sides (bottom, left, right): keep the existing
  //     behaviour — first line at the anchor, later lines stack downward.
  const totalLines = labelLines.length;
  const yForLine = (i: number): number =>
    side === 'top'
      ? (i - (totalLines - 1)) * LABEL_LINE_HEIGHT
      : i * LABEL_LINE_HEIGHT;

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
      {/* Letter inside the disc (C/P/V/N/?). The optional --flagged modifier
       *  turns the letter red when the guest has dietary restrictions.
       *
       *  Why both class AND inline style: the class is here so the rule
       *  remains discoverable in seating-diagram.css and the colour is
       *  driven by --seat-letter-color-flagged. The inline style guarantees
       *  the override applies even if a parent or cached stylesheet would
       *  otherwise win on cascade — it still reads from the same CSS
       *  variable, so tweaking the token in seating-diagram.css updates
       *  this seat just like every other rule. */}
      <text
        className={[
          'seat-letter',
          isOrphanSeat ? 'seat-letter--orphan' : '',
          hasDietaryFlag ? 'seat-letter--flagged' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        textAnchor="middle"
        y={5}
        style={
          hasDietaryFlag
            ? { fill: 'var(--seat-letter-color-flagged)' }
            : undefined
        }
      >
        {isOrphanSeat ? '!' : letter}
      </text>

      {/* Captain crown — sits above the disc. Decorative only; the actual
       *  protocol caption is in the legend. */}
      {guest?.isCaptain && !hideCaptainBadge && (
        <text
          className="seat-captain"
          textAnchor="middle"
          y={-SEAT_DISC_RADIUS - 4}
        >
          {CAPTAIN_BADGE}
        </text>
      )}
      {/* Child gift parcel — sits at top-right of the disc. */}
      {guest?.isChild && !hideGiftBadge && (
        <text
          className="seat-gift"
          x={SEAT_DISC_RADIUS - 2}
          y={-SEAT_DISC_RADIUS + 2}
        >
          {GIFT_BADGE}
        </text>
      )}

      {/* Outer label stack: up to two uppercase name lines + optional
       *  dietary line. The whole group is translated outward along the
       *  radial vector; each <text> child uses its own `y` for vertical
       *  position so the side-aware stacking (top vs everything else)
       *  keeps the stack clear of the disc. */}
      <g transform={`translate(${labelDx}, ${labelDy})`}>
        {labelLines.map((line, i) => (
          <text
            key={line.key}
            className={line.className}
            textAnchor={textAnchor}
            y={yForLine(i)}
          >
            {line.text}
          </text>
        ))}
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
