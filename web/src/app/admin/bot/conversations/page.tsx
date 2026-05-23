'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { db } from '@/lib/firestore';

interface ConversationRow {
  phone: string;
  guestId: string;
  language?: string;
  lastMessageAt?: Timestamp | null;
  messageCount?: number;
}

interface GuestRow {
  id: string;
  fullName?: string;
  preferredName?: string;
}

function maskPhone(p: string): string {
  if (!p) return '';
  if (p.length <= 6) return p;
  return `${p.slice(0, 3)}${'•'.repeat(Math.max(p.length - 6, 1))}${p.slice(-3)}`;
}

function formatWhen(ts: Timestamp | null | undefined): string {
  if (!ts) return '—';
  try {
    const d = ts.toDate();
    return d.toLocaleString('es-ES', {
      timeZone: 'Europe/Madrid',
      dateStyle: 'short',
      timeStyle: 'short',
    });
  } catch {
    return '—';
  }
}

export default function ConversationsListPage() {
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [guests, setGuests] = useState<Map<string, GuestRow>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const snap = await getDocs(collection(db, 'guests'));
      if (cancelled) return;
      const map = new Map<string, GuestRow>();
      for (const d of snap.docs) {
        const data = d.data();
        map.set(d.id, {
          id: d.id,
          fullName: data.fullName as string | undefined,
          preferredName: data.preferredName as string | undefined,
        });
      }
      setGuests(map);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, 'bot_conversations'),
      orderBy('lastMessageAt', 'desc'),
      limit(200)
    );
    const unsub = onSnapshot(q, (snap) => {
      const rows: ConversationRow[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          phone: d.id,
          guestId: data.guestId as string,
          language: data.language as string | undefined,
          lastMessageAt: data.lastMessageAt as Timestamp | undefined,
          messageCount: data.messageCount as number | undefined,
        };
      });
      setConversations(rows);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const decorated = useMemo(
    () =>
      conversations.map((c) => {
        const g = guests.get(c.guestId);
        const name =
          g?.preferredName?.trim() ||
          g?.fullName?.split(/\s+/)[0] ||
          '(sin nombre)';
        return { ...c, displayName: name };
      }),
    [conversations, guests]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="type-heading-6 text-charcoal">Conversaciones</h2>
        <span className="text-sm text-charcoal/60">
          {conversations.length} hilo{conversations.length === 1 ? '' : 's'}
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-ocean" />
        </div>
      ) : decorated.length === 0 ? (
        <div className="bg-white rounded-lg border border-charcoal/10 p-8 text-center text-sm text-charcoal/60">
          Aún no hay conversaciones. Cuando un invitado escriba a Thora,
          aparecerá aquí.
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-charcoal/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-cream/60 text-charcoal/60 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Invitado</th>
                <th className="text-left px-4 py-2 font-medium">Teléfono</th>
                <th className="text-left px-4 py-2 font-medium">Idioma</th>
                <th className="text-right px-4 py-2 font-medium">Mensajes</th>
                <th className="text-right px-4 py-2 font-medium">Último</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal/5">
              {decorated.map((row) => (
                <tr
                  key={row.phone}
                  className="hover:bg-cream/40 transition-colors"
                >
                  <td className="px-4 py-2">
                    <Link
                      href={`/admin/bot/conversations/${encodeURIComponent(row.phone)}`}
                      className="text-ocean hover:underline font-medium"
                    >
                      {row.displayName}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-charcoal/70 tabular-nums">
                    {maskPhone(row.phone)}
                  </td>
                  <td className="px-4 py-2 text-charcoal/70 uppercase text-xs">
                    {row.language ?? '—'}
                  </td>
                  <td className="px-4 py-2 text-charcoal/70 text-right tabular-nums">
                    {row.messageCount ?? 0}
                  </td>
                  <td className="px-4 py-2 text-charcoal/70 text-right tabular-nums">
                    {formatWhen(row.lastMessageAt)}
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
