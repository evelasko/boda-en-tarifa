'use client';

import { useMemo } from 'react';
import SeatingDiagramLegend from './SeatingDiagramLegend';
import SeatingDiagramTable from './SeatingDiagramTable';
import type { SeatingRenderPayload, SeatRender } from '@/types/seating-layout';

interface Props {
  payload: SeatingRenderPayload;
  tableNumber: number;
}

export default function SeatingDiagramSingleTable({ payload, tableNumber }: Props) {
  const tableName =
    payload.layout.names[String(tableNumber)] ?? `Mesa ${tableNumber}`;

  const seats = useMemo(() => {
    const filtered: SeatRender[] = payload.seats.filter(
      (s) => s.tableNumber === tableNumber,
    );
    filtered.sort((a, b) => a.seatNumber - b.seatNumber);
    return filtered;
  }, [payload.seats, tableNumber]);

  return (
    <div className="seating-diagram seating-diagram--single space-y-4">
      <h1 className="type-heading-4 text-charcoal text-center">
        Mesa {tableNumber} · {tableName}
      </h1>

      <SeatingDiagramLegend showCaptain={false} showGift={false} />

      <div className="seating-table-focus">
        <div className="seating-table-slot w-full">
          <SeatingDiagramTable
            tableNumber={tableNumber}
            tableName={tableName}
            seats={seats}
            hideDietary
            hideGiftBadge
            hideCaptainBadge
          />
        </div>
      </div>
    </div>
  );
}
