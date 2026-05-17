'use client';

import SeatingDiagramSeat from './SeatingDiagramSeat';
import type { SeatRender } from '@/types/seating-layout';

interface Props {
  tableNumber: number;
  tableName: string;
  seats: SeatRender[]; // already sorted by seatNumber
}

const VIEW_BOX = 320;
const CENTER = VIEW_BOX / 2;
const TABLE_RADIUS = 70;
const SEAT_RING_RADIUS = 110;

export default function SeatingDiagramTable({ tableNumber, tableName, seats }: Props) {
  const totalSeats = seats.length;
  return (
    <div className="seating-table-card bg-white border border-charcoal/10 rounded-lg p-2 shrink-0">
      <svg
        viewBox={`0 0 ${VIEW_BOX} ${VIEW_BOX}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Mesa ${tableNumber} ${tableName}`}
      >
        <circle
          cx={CENTER}
          cy={CENTER}
          r={TABLE_RADIUS}
          fill="#FAF6F2"
          stroke="#3A3A3A"
          strokeWidth={1.5}
        />
        <text
          x={CENTER}
          y={CENTER - 6}
          textAnchor="middle"
          fontSize={20}
          fontWeight={700}
          fill="#3A3A3A"
        >
          #{tableNumber}
        </text>
        <text
          x={CENTER}
          y={CENTER + 14}
          textAnchor="middle"
          fontSize={11}
          fill="#5A5A5A"
        >
          {tableName}
        </text>

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

        {totalSeats === 0 && (
          <text
            x={CENTER}
            y={CENTER + 60}
            textAnchor="middle"
            fontSize={10}
            fill="#A0A0A0"
          >
            sin invitados asignados
          </text>
        )}
      </svg>
    </div>
  );
}
