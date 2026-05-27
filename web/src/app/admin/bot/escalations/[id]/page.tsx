'use client';

import Link from 'next/link';
import { use, useEffect, useState } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { ArrowLeft, Loader2, Send, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '@/lib/firestore';
import { callBotReplyToEscalation } from '@/lib/bot-callable';

interface EscalationDetail {
  guestId: string;
  guestPhone: string;
  guestLanguage?: 'es' | 'en';
  conversationPhone?: string;
  reason?: string;
  summary?: string;
  urgency?: 'low' | 'normal' | 'high';
  triggeringMessageText?: string;
  status: string;
  createdAt?: Timestamp;
  resolvedAt?: Timestamp;
  operatorReply?: string;
}

interface MessageRow {
  id: string;
  direction: 'inbound' | 'outbound';
  type: string;
  text?: string;
  createdAt?: Timestamp;
  senderType?: 'bot' | 'operator';
}

function formatWhen(ts: Timestamp | undefined): string {
  if (!ts) return '';
  try {
    return ts.toDate().toLocaleString('es-ES', {
      timeZone: 'Europe/Madrid',
      dateStyle: 'short',
      timeStyle: 'short',
    });
  } catch {
    return '';
  }
}

export default function EscalationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [escalation, setEscalation] = useState<EscalationDetail | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unsubEsc = onSnapshot(doc(db, 'bot_escalations', id), (snap) => {
      if (!snap.exists()) {
        setEscalation(null);
        setLoading(false);
        return;
      }
      setEscalation(snap.data() as EscalationDetail);
      setLoading(false);
    });
    return () => unsubEsc();
  }, [id]);

  const phone = escalation?.conversationPhone ?? escalation?.guestPhone;

  useEffect(() => {
    if (!phone) return;
    const unsub = onSnapshot(
      query(
        collection(db, 'bot_conversations', phone, 'messages'),
        orderBy('createdAt', 'desc'),
        limit(10)
      ),
      (snap) => {
        const rows: MessageRow[] = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<MessageRow, 'id'>) }))
          .reverse();
        setMessages(rows);
      }
    );
    return () => unsub();
  }, [phone]);

  const isOpen = escalation?.status === 'open';
  const composedTooLong = reply.length > 2000;

  const handleSubmit = async () => {
    if (!reply.trim() || submitting) return;
    setSubmitting(true);
    try {
      await callBotReplyToEscalation({
        escalationId: id,
        replyText: reply.trim(),
      });
      toast.success('Respuesta enviada ✅');
      setReply('');
    } catch (err: unknown) {
      const message =
        err instanceof Error ?
          err.message :
          'No se pudo enviar la respuesta.';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Link
        href="/admin/bot/escalations"
        className="inline-flex items-center gap-1 text-sm text-ocean hover:underline"
      >
        <ArrowLeft size={14} />
        Cola de escalaciones
      </Link>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-ocean" />
        </div>
      ) : !escalation ? (
        <div className="bg-white rounded-lg border border-charcoal/10 p-8 text-center text-sm text-charcoal/60">
          Escalación no encontrada.
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg border border-charcoal/10 p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle
                size={20}
                className={
                  escalation.urgency === 'high' ? 'text-coral' : 'text-sand'
                }
              />
              <div className="flex-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <h2 className="type-heading-6 text-charcoal">
                    {escalation.summary ?? '(sin resumen)'}
                  </h2>
                  <span
                    className={`text-xs uppercase px-2 py-0.5 rounded ${
                      escalation.status === 'open' ?
                        'bg-coral/15 text-coral' :
                        'bg-sage/15 text-sage'
                    }`}
                  >
                    {escalation.status}
                  </span>
                  {escalation.guestLanguage && (
                    <span className="text-xs uppercase text-charcoal/50">
                      {escalation.guestLanguage}
                    </span>
                  )}
                </div>
                {escalation.reason && (
                  <p className="text-sm text-charcoal/60 mt-1">
                    {escalation.reason}
                  </p>
                )}
                {escalation.triggeringMessageText && (
                  <blockquote className="mt-3 px-3 py-2 bg-cream/40 border-l-2 border-ocean/30 text-sm text-charcoal/80">
                    «{escalation.triggeringMessageText}»
                  </blockquote>
                )}
                <div className="mt-3 text-xs text-charcoal/50 flex flex-wrap gap-x-4 gap-y-1">
                  <span>{formatWhen(escalation.createdAt)}</span>
                  {phone && (
                    <Link
                      href={`/admin/bot/messages/${encodeURIComponent(phone)}`}
                      className="text-ocean hover:underline"
                    >
                      Ver hilo completo →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>

          {messages.length > 0 && (
            <section>
              <h3 className="text-sm font-medium text-charcoal/60 mb-2">
                Últimos 10 mensajes
              </h3>
              <div className="space-y-2">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${
                      m.direction === 'inbound' ? 'justify-start' : 'justify-end'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-3 py-2 border text-sm ${
                        m.direction === 'inbound' ?
                          'bg-white border-charcoal/10' :
                          m.senderType === 'operator' ?
                            'bg-sage/10 border-sage/30' :
                            'bg-ocean/5 border-ocean/20'
                      }`}
                    >
                      <div className="text-[10px] uppercase tracking-wide text-charcoal/50 mb-0.5">
                        {m.direction === 'inbound' ?
                          'guest' :
                          m.senderType === 'operator' ?
                            'operator' :
                            'Thora'}
                        <span className="mx-1">·</span>
                        {formatWhen(m.createdAt)}
                      </div>
                      <p className="whitespace-pre-wrap text-charcoal">
                        {m.text ?? `(${m.type})`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {isOpen && (
            <section className="bg-white rounded-lg border border-charcoal/10 p-4">
              <label className="text-sm font-medium text-charcoal/70">
                Responder a {escalation.guestLanguage === 'en' ? 'EN' : 'ES'}
              </label>
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Escribe en el idioma del invitado. Se envía como mensaje de operador (no como Thora)."
                className="mt-2 w-full min-h-[120px] border border-charcoal/15 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ocean/30"
                disabled={submitting}
              />
              <div className="mt-2 flex items-center justify-between">
                <span
                  className={`text-xs ${
                    composedTooLong ? 'text-coral' : 'text-charcoal/40'
                  }`}
                >
                  {reply.length}/2000 caracteres
                </span>
                <button
                  onClick={handleSubmit}
                  disabled={!reply.trim() || composedTooLong || submitting}
                  className="inline-flex items-center gap-2 bg-ocean text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-ocean/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ?
                    <Loader2 size={14} className="animate-spin" /> :
                    <Send size={14} />}
                  Enviar y resolver
                </button>
              </div>
            </section>
          )}

          {!isOpen && escalation.operatorReply && (
            <section className="bg-sage/5 rounded-lg border border-sage/20 p-4">
              <h3 className="text-sm font-medium text-charcoal/70 mb-2">
                Respuesta enviada
              </h3>
              <p className="text-sm text-charcoal whitespace-pre-wrap">
                {escalation.operatorReply}
              </p>
              {escalation.resolvedAt && (
                <p className="text-xs text-charcoal/50 mt-2">
                  Cerrada {formatWhen(escalation.resolvedAt)}
                </p>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
