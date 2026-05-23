'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { AlertTriangle, Loader2, ArrowRight } from 'lucide-react';
import { db } from '@/lib/firestore';

interface EscalationRow {
  id: string;
  guestId: string;
  guestPhone: string;
  guestLanguage?: string;
  reason?: string;
  summary?: string;
  urgency?: 'low' | 'normal' | 'high';
  triggeringMessageText?: string;
  status?: string;
  createdAt?: Timestamp;
}

function ageMin(ts: Timestamp | undefined): string {
  if (!ts) return '—';
  const mins = Math.floor((Date.now() - ts.toMillis()) / 60_000);
  if (mins < 1) return '<1 min';
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

const URGENCY_TONE: Record<string, string> = {
  high: 'bg-coral/15 text-coral',
  normal: 'bg-sand/30 text-charcoal/80',
  low: 'bg-ocean/10 text-ocean',
};

export default function EscalationsListPage() {
  const [rows, setRows] = useState<EscalationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'open' | 'all'>('open');

  useEffect(() => {
    setLoading(true);
    const base = collection(db, 'bot_escalations');
    const q =
      filter === 'open' ?
        query(base, where('status', '==', 'open'), orderBy('createdAt', 'desc')) :
        query(base, orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setRows(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<EscalationRow, 'id'>),
        }))
      );
      setLoading(false);
    });
    return () => unsub();
  }, [filter]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="type-heading-6 text-charcoal flex items-center gap-2">
          <AlertTriangle size={18} className="text-coral" />
          Escalaciones
        </h2>
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => setFilter('open')}
            className={`px-3 py-1 rounded-md ${
              filter === 'open' ?
                'bg-ocean text-white' :
                'bg-white border border-charcoal/10 text-charcoal/70 hover:bg-cream'
            }`}
          >
            Abiertas
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-md ${
              filter === 'all' ?
                'bg-ocean text-white' :
                'bg-white border border-charcoal/10 text-charcoal/70 hover:bg-cream'
            }`}
          >
            Todas
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-ocean" />
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-white rounded-lg border border-charcoal/10 p-8 text-center text-sm text-charcoal/60">
          {filter === 'open' ?
            'Sin escalaciones abiertas — 🐾 Thora va sola.' :
            'No hay escalaciones en la cola.'}
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => (
            <Link
              key={row.id}
              href={`/admin/bot/escalations/${row.id}`}
              className="group block bg-white rounded-lg border border-charcoal/10 p-4
                hover:border-ocean/30 hover:shadow-sm transition-all"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`shrink-0 px-2 py-0.5 text-xs font-medium uppercase rounded ${
                    URGENCY_TONE[row.urgency ?? 'normal']
                  }`}
                >
                  {row.urgency ?? 'normal'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="font-medium text-charcoal">
                      {row.summary ?? row.reason ?? '(sin resumen)'}
                    </span>
                    {row.guestLanguage && (
                      <span className="text-xs uppercase text-charcoal/50">
                        {row.guestLanguage}
                      </span>
                    )}
                  </div>
                  {row.triggeringMessageText && (
                    <p className="text-sm text-charcoal/60 mt-1 line-clamp-2">
                      «{row.triggeringMessageText}»
                    </p>
                  )}
                  <div className="text-xs text-charcoal/50 mt-2 flex items-center gap-3">
                    <span>{ageMin(row.createdAt)} abierta</span>
                    {row.status && row.status !== 'open' && (
                      <span className="uppercase">{row.status}</span>
                    )}
                  </div>
                </div>
                <ArrowRight
                  size={16}
                  className="text-charcoal/30 mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
