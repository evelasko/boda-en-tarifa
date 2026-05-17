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
  positionIndex: number; // 1-based seat position around the ring
  cx: number;
  cy: number;
  ringRadius: number;
}

const SEAT_DISC_RADIUS = 16;
const LABEL_OFFSET = 26;
const LABEL_LINE_HEIGHT = 11;

export default function SeatingDiagramSeat({
  seat,
  totalSeats,
  positionIndex,
  cx,
  cy,
  ringRadius,
}: Props) {
  const angle = seatAngleDegrees(positionIndex, totalSeats);
  const { x, y } = compassToSvg(cx, cy, ringRadius, angle);
  const { dx, dy } = outwardUnitVector(angle);
  const side = seatSide(angle);

  const labelDx = dx * LABEL_OFFSET;
  const labelDy = dy * LABEL_OFFSET;
  const textAnchor: 'start' | 'middle' | 'end' =
    side === 'left' ? 'end' : side === 'right' ? 'start' : 'middle';

  const cat = seat.guest?.foodCategory ?? 'unknown';
  const fill = FOOD_FILLS[cat];
  const stroke = FOOD_STROKES[cat];
  const letter = FOOD_LETTERS[cat];

  const guest = seat.guest;
  const isOrphanSeat = guest === null;

  return (
    <g transform={`translate(${x}, ${y})`}>
      <circle
        r={SEAT_DISC_RADIUS}
        fill={isOrphanSeat ? '#FFFFFF' : fill}
        stroke={isOrphanSeat ? '#C0392B' : stroke}
        strokeWidth={isOrphanSeat ? 2 : 1.5}
      />
      <text
        textAnchor="middle"
        y={5}
        fontSize={14}
        fontWeight={700}
        fill={isOrphanSeat ? '#C0392B' : '#FFFFFF'}
      >
        {isOrphanSeat ? '!' : letter}
      </text>

      {guest?.isCaptain && (
        <text
          textAnchor="middle"
          y={-SEAT_DISC_RADIUS - 4}
          fontSize={13}
        >
          {CAPTAIN_BADGE}
        </text>
      )}
      {guest?.isChild && (
        <text
          x={SEAT_DISC_RADIUS - 2}
          y={-SEAT_DISC_RADIUS + 2}
          fontSize={12}
        >
          {GIFT_BADGE}
        </text>
      )}

      <g transform={`translate(${labelDx}, ${labelDy})`}>
        <text
          className="seat-name"
          fontSize={11}
          fontWeight={600}
          textAnchor={textAnchor}
          fill="#1f1f1f"
        >
          {guest?.fullName ?? (isOrphanSeat ? '(asiento huérfano)' : '')}
        </text>
        {guest?.dietaryRestrictions && (
          <text
            className="seat-diet"
            fontSize={9}
            textAnchor={textAnchor}
            dy={LABEL_LINE_HEIGHT}
            fill="#555"
          >
            {guest.dietaryRestrictions}
          </text>
        )}
      </g>

      <text
        className="seat-number"
        textAnchor="middle"
        y={SEAT_DISC_RADIUS + 9}
        fontSize={8}
        fill="#777"
      >
        {seat.seatNumber}
      </text>
    </g>
  );
}
