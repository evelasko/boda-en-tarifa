'use client';

import Link from 'next/link';
import { use, useEffect, useState } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
} from 'firebase/firestore';
import { ArrowLeft, Loader2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '@/lib/firestore';
import { callBotCancelBroadcast } from '@/lib/bot-callable';

interface BroadcastDoc {
  templateName?: string;
  status?: string;
  audienceCount?: number;
  perMinuteCap?: number;
  sentCount?: number;
  failedCount?: number;
  skippedCount?: number;
  deliveredCount?: number;
  createdAt?: Timestamp;
  startedAt?: Timestamp;
  finishedAt?: Timestamp;
}

interface RecipientRow {
  id: string;
  guestId?: string;
  phone?: string;
  language?: 'es' | 'en';
  firstName?: string;
  status?: string;
  error?: string;
  metaMessageId?: string;
  sentAt?: Timestamp;
}

function maskPhone(p: string | undefined): string {
  if (!p) return '';
  if (p.length <= 6) return p;
  return `${p.slice(0, 3)}${'•'.repeat(p.length - 6)}${p.slice(-3)}`;
}

function formatWhen(ts: Timestamp | undefined): string {
  if (!ts) return '—';
  try {
    return ts.toDate().toLocaleString('es-ES', {
      timeZone: 'Europe/Madrid',
      dateStyle: 'short',
      timeStyle: 'medium',
    });
  } catch {
    return '—';
  }
}

const RECIPIENT_TONE: Record<string, string> = {
  queued: 'bg-charcoal/10 text-charcoal/60',
  sending: 'bg-ocean/10 text-ocean',
  sent: 'bg-ocean/15 text-ocean',
  delivered: 'bg-sage/15 text-sage',
  read: 'bg-sage/25 text-sage',
  failed: 'bg-coral/15 text-coral',
  skipped: 'bg-charcoal/10 text-charcoal/60',
};

export default function BroadcastDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = use(params);
  const id = decodeURIComponent(rawId);
  const [broadcast, setBroadcast] = useState<BroadcastDoc | null>(null);
  const [recipients, setRecipients] = useState<RecipientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const unsubBroadcast = onSnapshot(doc(db, 'bot_broadcasts', id), (snap) => {
      setBroadcast(snap.exists() ? (snap.data() as BroadcastDoc) : null);
      setLoading(false);
    });
    const unsubRecips = onSnapshot(
      query(
        collection(db, 'bot_broadcasts', id, 'recipients'),
        orderBy('createdAt', 'asc')
      ),
      (snap) => {
        setRecipients(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<RecipientRow, 'id'>),
          }))
        );
      }
    );
    return () => {
      unsubBroadcast();
      unsubRecips();
    };
  }, [id]);

  const totals = recipients.reduce(
    (acc, r) => {
      acc[r.status ?? 'queued'] =
        (acc[r.status ?? 'queued'] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const inflight = broadcast?.status === 'dispatching';

  const handleCancel = async () => {
    if (!confirm('¿Cancelar esta difusión? Los envíos ya completados no se pueden deshacer.')) {
      return;
    }
    setCancelling(true);
    try {
      await callBotCancelBroadcast({ broadcastId: id });
      toast.success('Difusión cancelada');
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'No se pudo cancelar.';
      toast.error(msg);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="space-y-4">
      <Link
        href="/admin/bot/broadcasts"
        className="inline-flex items-center gap-1 text-sm text-ocean hover:underline"
      >
        <ArrowLeft size={14} />
        Difusiones
      </Link>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-ocean" />
        </div>
      ) : !broadcast ? (
        <div className="bg-white rounded-lg border border-charcoal/10 p-8 text-center text-sm text-charcoal/60">
          Difusión no encontrada.
        </div>
      ) : (
        <>
          <header className="bg-white rounded-lg border border-charcoal/10 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-baseline gap-2">
                  <h2 className="type-heading-6 text-charcoal">
                    {broadcast.templateName}
                  </h2>
                  <code className="font-mono text-xs text-charcoal/40">
                    {id}
                  </code>
                </div>
                <p className="text-sm text-charcoal/60 mt-1">
                  {broadcast.audienceCount ?? 0} destinatario
                  {broadcast.audienceCount === 1 ? '' : 's'}
                  {broadcast.perMinuteCap != null && (
                    <> · {broadcast.perMinuteCap}/min</>
                  )}
                  {broadcast.startedAt && (
                    <> · iniciada {formatWhen(broadcast.startedAt)}</>
                  )}
                  {broadcast.finishedAt && (
                    <> · finalizada {formatWhen(broadcast.finishedAt)}</>
                  )}
                </p>
              </div>
              <div className="text-right space-y-2">
                <div
                  className={`inline-block text-xs uppercase px-2 py-1 rounded ${
                    broadcast.status === 'complete' ? 'bg-sage/15 text-sage' :
                      broadcast.status === 'dispatching' ? 'bg-ocean/10 text-ocean' :
                        broadcast.status === 'partial' ? 'bg-sand/30 text-charcoal/80' :
                          'bg-charcoal/10 text-charcoal/60'
                  }`}
                >
                  {broadcast.status}
                </div>
                {inflight && (
                  <div>
                    <button
                      onClick={handleCancel}
                      disabled={cancelling}
                      className="inline-flex items-center gap-1 text-xs text-coral hover:text-coral/80 disabled:opacity-50"
                    >
                      {cancelling ?
                        <Loader2 size={12} className="animate-spin" /> :
                        <XCircle size={12} />}
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Stat label="Sent" value={broadcast.sentCount ?? 0} />
              <Stat
                label="Delivered"
                value={
                  (totals.delivered ?? 0) + (totals.read ?? 0)
                }
                tone="sage"
              />
              <Stat
                label="Failed"
                value={broadcast.failedCount ?? totals.failed ?? 0}
                tone={
                  (broadcast.failedCount ?? totals.failed ?? 0) > 0 ?
                    'coral' :
                    undefined
                }
              />
              <Stat
                label="Skipped"
                value={broadcast.skippedCount ?? totals.skipped ?? 0}
              />
            </div>
          </header>

          <section>
            <h3 className="text-sm font-medium text-charcoal/60 mb-2">
              Destinatarios ({recipients.length})
            </h3>
            <div className="bg-white rounded-lg border border-charcoal/10 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-cream/60 text-charcoal/60 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium">Invitado</th>
                    <th className="text-left px-4 py-2 font-medium">Teléfono</th>
                    <th className="text-left px-4 py-2 font-medium">Idioma</th>
                    <th className="text-left px-4 py-2 font-medium">Estado</th>
                    <th className="text-left px-4 py-2 font-medium">Error</th>
                    <th className="text-right px-4 py-2 font-medium">Enviado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-charcoal/5">
                  {recipients.map((r) => (
                    <tr key={r.id} className="hover:bg-cream/40">
                      <td className="px-4 py-2 text-charcoal/80">
                        {r.firstName ?? '—'}
                      </td>
                      <td
                        className="px-4 py-2 text-charcoal/70 tabular-nums font-mono text-xs cursor-pointer"
                        title={r.phone}
                      >
                        {maskPhone(r.phone)}
                      </td>
                      <td className="px-4 py-2 text-charcoal/60 uppercase text-xs">
                        {r.language ?? '—'}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`text-xs uppercase px-2 py-0.5 rounded ${
                            RECIPIENT_TONE[r.status ?? 'queued'] ??
                            'bg-charcoal/10'
                          }`}
                        >
                          {r.status ?? 'queued'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-coral text-xs">
                        {r.error ?? ''}
                      </td>
                      <td className="px-4 py-2 text-charcoal/60 text-right tabular-nums text-xs">
                        {formatWhen(r.sentAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: 'sage' | 'coral';
}) {
  const valueClass =
    tone === 'sage' ? 'text-sage' :
      tone === 'coral' ? 'text-coral' :
        'text-charcoal';
  return (
    <div className="bg-cream/40 rounded-md p-3">
      <div className="text-xs uppercase tracking-wide text-charcoal/50">
        {label}
      </div>
      <div className={`text-2xl font-bold tabular-nums ${valueClass}`}>
        {value}
      </div>
    </div>
  );
}
