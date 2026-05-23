'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { Loader2, PhoneIncoming, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '@/lib/firestore';
import { callBotAddToAllowlist } from '@/lib/bot-callable';

interface UnknownInboundRow {
  id: string;
  phone?: string;
  receivedAt?: Timestamp;
  count?: number;
  responseSent?: boolean;
  resolved?: boolean;
  resolvedBy?: string;
  resolvedAt?: Timestamp;
  resolvedAs?: string;
}

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

export default function UnknownInboundPage() {
  const [rows, setRows] = useState<UnknownInboundRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'open' | 'all'>('open');
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const base = collection(db, 'bot_unknown_inbound');
    const q =
      filter === 'open' ?
        query(base, where('resolved', '==', false), orderBy('receivedAt', 'desc')) :
        query(base, orderBy('receivedAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setRows(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<UnknownInboundRow, 'id'>),
        }))
      );
      setLoading(false);
    });
    return () => unsub();
  }, [filter]);

  const handleAdd = async (row: UnknownInboundRow) => {
    if (!row.phone) return;
    const firstName = window.prompt(
      `Add ${row.phone} to allowlist as which name? (leave blank to add unnamed)`
    );
    if (firstName === null) return; // cancelled
    setBusy(row.id);
    try {
      const langChoice = window.prompt(
        'Language preference? Type "es" or "en" (leave blank for unknown)'
      );
      const language =
        langChoice === 'es' || langChoice === 'en' ? langChoice : undefined;
      const result = await callBotAddToAllowlist({
        phone: row.phone,
        firstName: firstName.trim() || undefined,
        language,
      });
      toast.success(`Añadido — guest ${result.guestId.slice(0, 8)}…`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No se pudo añadir.';
      toast.error(msg);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="type-heading-6 text-charcoal flex items-center gap-2">
          <PhoneIncoming size={18} className="text-sand" />
          Números desconocidos
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
            Sin resolver
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-md ${
              filter === 'all' ?
                'bg-ocean text-white' :
                'bg-white border border-charcoal/10 text-charcoal/70 hover:bg-cream'
            }`}
          >
            Todos
          </button>
        </div>
      </div>

      <p className="text-sm text-charcoal/60">
        Teléfonos que escribieron a Thora pero no están en la lista de
        invitados. Thora ya les respondió con un mensaje de rechazo amable;
        si reconoces el número, añádelo a la lista.
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-ocean" />
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-white rounded-lg border border-charcoal/10 p-8 text-center text-sm text-charcoal/60">
          {filter === 'open' ?
            'Ningún número desconocido pendiente. 🐾' :
            'Aún no ha escrito nadie de fuera de la lista.'}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-charcoal/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-cream/60 text-charcoal/60 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Teléfono</th>
                <th className="text-right px-4 py-2 font-medium">Mensajes</th>
                <th className="text-right px-4 py-2 font-medium">Último</th>
                <th className="text-left px-4 py-2 font-medium">Estado</th>
                <th className="text-right px-4 py-2 font-medium">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal/5">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-cream/40 transition-colors">
                  <td className="px-4 py-2 font-mono text-xs text-charcoal/80">
                    {row.phone ?? '—'}
                  </td>
                  <td className="px-4 py-2 text-right text-charcoal/70 tabular-nums">
                    {row.count ?? 1}
                  </td>
                  <td className="px-4 py-2 text-right text-charcoal/70 tabular-nums text-xs">
                    {formatWhen(row.receivedAt)}
                  </td>
                  <td className="px-4 py-2">
                    {row.resolved ? (
                      <span
                        className="text-xs uppercase px-2 py-0.5 rounded bg-sage/15 text-sage"
                        title={
                          row.resolvedBy ?
                            `por ${row.resolvedBy} (${formatWhen(row.resolvedAt)})` :
                            undefined
                        }
                      >
                        Resuelto
                      </span>
                    ) : (
                      <span className="text-xs uppercase px-2 py-0.5 rounded bg-sand/30 text-charcoal/70">
                        Abierto
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {!row.resolved && row.phone && (
                      <button
                        onClick={() => handleAdd(row)}
                        disabled={busy === row.id}
                        className="inline-flex items-center gap-1 text-xs text-ocean hover:text-ocean/80 disabled:opacity-50"
                      >
                        {busy === row.id ?
                          <Loader2 size={12} className="animate-spin" /> :
                          <UserPlus size={12} />}
                        Añadir a la lista
                      </button>
                    )}
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
