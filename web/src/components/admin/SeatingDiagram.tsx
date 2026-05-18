'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Printer, RefreshCw } from 'lucide-react';
import SeatingDiagramLegend from './SeatingDiagramLegend';
import SeatingDiagramTable from './SeatingDiagramTable';
import SeatingUnassignedPanel from './SeatingUnassignedPanel';
import type { SeatingRenderPayload, SeatRender } from '@/types/seating-layout';

interface Props {
  payload: SeatingRenderPayload;
  /**
   * 'admin' (default) shows the "Sin coincidencia" diagnostic panel.
   * 'public' hides it — the staff-facing /staff/tables view is not the place
   * to surface data anomalies.
   */
  variant?: 'admin' | 'public';
}

export default function SeatingDiagram({ payload, variant = 'admin' }: Props) {
  const router = useRouter();

  const seatsByTable = useMemo(() => {
    const map = new Map<number, SeatRender[]>();
    for (const seat of payload.seats) {
      const arr = map.get(seat.tableNumber) ?? [];
      arr.push(seat);
      map.set(seat.tableNumber, arr);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => a.seatNumber - b.seatNumber);
    }
    return map;
  }, [payload.seats]);

  return (
    <div className="seating-diagram space-y-5">
      <div className="seating-actions flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="type-heading-4 text-charcoal">Plano de mesas</h1>
          <p className="text-charcoal/60 type-body-small mt-1">
            Última actualización: {new Date(payload.generatedAt).toLocaleString('es-ES')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.refresh()}>
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </Button>
          <Button size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            Imprimir
          </Button>
        </div>
      </div>

      <SeatingDiagramLegend />

      {variant === 'admin' && (
        <SeatingUnassignedPanel guests={payload.unassigned} />
      )}

      {/* Layout-only wrappers. `.seating-grid` and `.seating-row` are styled
       *  by web/src/styles/seating-diagram.css (flex column + flex row with
       *  --seating-row-gap / --seating-table-gap). The inner `div` controls
       *  the per-table responsive sizing (still Tailwind because these
       *  knobs are not part of the diagram-token surface area). */}
      <div className="seating-grid">
        {payload.layout.rows.map((row, rowIdx) => (
          <div key={rowIdx} className="seating-row">
            {row.map((tableNumber) => (
              <div
                key={tableNumber}
                className="basis-[280px] grow max-w-[360px]"
              >
                <SeatingDiagramTable
                  tableNumber={tableNumber}
                  tableName={payload.layout.names[String(tableNumber)] ?? `Mesa ${tableNumber}`}
                  seats={seatsByTable.get(tableNumber) ?? []}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
