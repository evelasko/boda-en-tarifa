'use client';

import { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';
import type {
  UnassignedGuest,
  UnassignedReason,
} from '@/types/seating-layout';

interface Props {
  guests: UnassignedGuest[];
}

const REASON_LABELS: Record<UnassignedReason, string> = {
  no_seating_doc: 'Sin asignación de mesa',
  unknown_table_name: 'Mesa desconocida en la hoja',
  table_number_outside_layout: 'Número de mesa fuera del plano',
  duplicate_seat: 'Asiento duplicado',
};

export default function SeatingUnassignedPanel({ guests }: Props) {
  const [open, setOpen] = useState(true);
  if (guests.length === 0) return null;

  const grouped = new Map<UnassignedReason, UnassignedGuest[]>();
  for (const g of guests) {
    const arr = grouped.get(g.reason) ?? [];
    arr.push(g);
    grouped.set(g.reason, arr);
  }

  return (
    <div className="seating-unassigned bg-amber-50 border border-amber-200 rounded-lg">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 p-3 text-left"
      >
        {open ? (
          <ChevronDown className="h-4 w-4 text-amber-700" />
        ) : (
          <ChevronRight className="h-4 w-4 text-amber-700" />
        )}
        <AlertTriangle className="h-4 w-4 text-amber-700" />
        <span className="font-medium text-amber-900">
          Sin coincidencia ({guests.length})
        </span>
        <span className="text-sm text-amber-800/80 ml-1">
          — invitados o asientos que no se han podido ubicar en el plano.
        </span>
      </button>
      {open && (
        <div className="border-t border-amber-200 p-4 space-y-4">
          {[...grouped.entries()].map(([reason, list]) => (
            <div key={reason}>
              <p className="text-sm font-medium text-amber-900 mb-2">
                {REASON_LABELS[reason]} ({list.length})
              </p>
              <ul className="text-sm text-amber-900/90 space-y-1">
                {list.map((g) => (
                  <li key={`${g.uid}-${g.reason}`} className="flex flex-wrap gap-x-2">
                    <span className="font-medium">{g.fullName || g.uid}</span>
                    {g.rawTableName && (
                      <span className="text-amber-800/80">
                        · mesa: &ldquo;{g.rawTableName}&rdquo;
                      </span>
                    )}
                    {typeof g.rawSeatNumber === 'number' && (
                      <span className="text-amber-800/80">
                        · asiento: {g.rawSeatNumber}
                      </span>
                    )}
                    {typeof g.rawTableNumber === 'number' && (
                      <span className="text-amber-800/80">
                        · nº mesa: {g.rawTableNumber}
                      </span>
                    )}
                    {g.collidesWithUid && (
                      <span className="text-amber-800/80">
                        · colisiona con {g.collidesWithUid}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
