'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { Loader2, Plus, Send } from 'lucide-react';
import { db } from '@/lib/firestore';

interface BroadcastRow {
  id: string;
  templateName?: string;
  status?: string;
  audienceCount?: number;
  sentCount?: number;
  failedCount?: number;
  skippedCount?: number;
  createdAt?: Timestamp;
  startedAt?: Timestamp;
  finishedAt?: Timestamp;
  operatorUid?: string | null;
}

const STATUS_TONE: Record<string, string> = {
  complete: 'bg-sage/15 text-sage',
  partial: 'bg-sand/30 text-charcoal/80',
  dispatching: 'bg-ocean/10 text-ocean',
  cancelled: 'bg-charcoal/10 text-charcoal/60',
  draft: 'bg-charcoal/10 text-charcoal/60',
};

function formatWhen(ts: Timestamp | undefined): string {
  if (!ts) return '—';
  try {
    return ts.toDate().toLocaleString('es-ES', {
      timeZone: 'Europe/Madrid',
      dateStyle: 'short',
      timeStyle: 'short',
    });
  } catch {
    return '—';
  }
}

export default function BroadcastsListPage() {
  const [rows, setRows] = useState<BroadcastRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'bot_broadcasts'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const unsub = onSnapshot(q, (snap) => {
      setRows(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<BroadcastRow, 'id'>),
        }))
      );
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="type-heading-6 text-charcoal flex items-center gap-2">
          <Send size={18} className="text-ocean" />
          Difusiones
        </h2>
        <Link
          href="/admin/bot/broadcasts/new"
          className="inline-flex items-center gap-2 bg-ocean text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-ocean/90"
        >
          <Plus size={14} />
          Nueva difusión
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-ocean" />
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-white rounded-lg border border-charcoal/10 p-8 text-center text-sm text-charcoal/60">
          Sin difusiones anteriores. Lanza una desde «Nueva difusión».
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-charcoal/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-cream/60 text-charcoal/60 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-2 font-medium">ID</th>
                <th className="text-left px-4 py-2 font-medium">Plantilla</th>
                <th className="text-left px-4 py-2 font-medium">Estado</th>
                <th className="text-right px-4 py-2 font-medium">Audiencia</th>
                <th className="text-right px-4 py-2 font-medium">Enviados</th>
                <th className="text-right px-4 py-2 font-medium">Fallos</th>
                <th className="text-right px-4 py-2 font-medium">Inicio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal/5">
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-cream/40 transition-colors"
                >
                  <td className="px-4 py-2">
                    <Link
                      href={`/admin/bot/broadcasts/${encodeURIComponent(row.id)}`}
                      className="text-ocean hover:underline font-mono text-xs"
                    >
                      {row.id}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-charcoal/70">
                    {row.templateName ?? '—'}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`text-xs uppercase px-2 py-0.5 rounded ${
                        STATUS_TONE[row.status ?? ''] ?? 'bg-charcoal/10 text-charcoal/60'
                      }`}
                    >
                      {row.status ?? '—'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-charcoal/70 text-right tabular-nums">
                    {row.audienceCount ?? 0}
                  </td>
                  <td className="px-4 py-2 text-charcoal/70 text-right tabular-nums">
                    {row.sentCount ?? 0}
                  </td>
                  <td
                    className={`px-4 py-2 text-right tabular-nums ${
                      (row.failedCount ?? 0) > 0 ? 'text-coral' : 'text-charcoal/40'
                    }`}
                  >
                    {row.failedCount ?? 0}
                  </td>
                  <td className="px-4 py-2 text-charcoal/70 text-right tabular-nums">
                    {formatWhen(row.startedAt ?? row.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
