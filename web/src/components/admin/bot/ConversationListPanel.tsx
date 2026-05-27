'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
} from 'firebase/firestore';
import { Loader2, MessageSquare, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { db } from '@/lib/firestore';
import {
  type BotConversationRoot,
  type ConversationSort,
  type GuestNameRow,
  formatWhen,
  guestDisplayName,
  maskPhone,
} from '@/lib/bot-conversations';

interface DecoratedConversation extends BotConversationRoot {
  displayName: string;
  fullName?: string;
}

interface ConversationListPanelProps {
  activePhone?: string;
}

export function ConversationListPanel({ activePhone }: ConversationListPanelProps) {
  const [conversations, setConversations] = useState<BotConversationRoot[]>([]);
  const [guests, setGuests] = useState<Map<string, GuestNameRow>>(new Map());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<ConversationSort>('recent');
  const [minMessages, setMinMessages] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const snap = await getDocs(collection(db, 'guests'));
      if (cancelled) return;
      const map = new Map<string, GuestNameRow>();
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
      orderBy('lastMessageAt', 'desc')
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows: BotConversationRoot[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            phone: d.id,
            guestId: data.guestId as string,
            language: data.language as string | undefined,
            lastMessageAt: data.lastMessageAt as Timestamp | undefined,
            messageCount: data.messageCount as number | undefined,
            startedAt: data.startedAt as Timestamp | undefined,
            unresolvedEscalationId: data.unresolvedEscalationId as
              | string
              | undefined,
          };
        });
        setConversations(rows);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, []);

  const decorated = useMemo((): DecoratedConversation[] => {
    const rows = conversations.map((c) => {
      const g = guests.get(c.guestId);
      return {
        ...c,
        displayName: guestDisplayName(g, '(sin nombre)'),
        fullName: g?.fullName,
      };
    });

    const needle = search.trim().toLowerCase();
    const filtered = rows.filter((row) => {
      if ((row.messageCount ?? 0) < minMessages) return false;
      if (!needle) return true;
      const haystack = [
        row.displayName,
        row.fullName ?? '',
        row.phone,
        row.language ?? '',
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(needle);
    });

    filtered.sort((a, b) => {
      if (sort === 'volume') {
        return (b.messageCount ?? 0) - (a.messageCount ?? 0);
      }
      const ta = a.lastMessageAt?.toMillis() ?? 0;
      const tb = b.lastMessageAt?.toMillis() ?? 0;
      return tb - ta;
    });

    return filtered;
  }, [conversations, guests, search, sort, minMessages]);

  const totalMessages = useMemo(
    () => conversations.reduce((sum, c) => sum + (c.messageCount ?? 0), 0),
    [conversations]
  );

  return (
    <div className="flex flex-col h-full min-h-0 bg-white border-r border-charcoal/10">
      <div className="shrink-0 p-3 space-y-3 border-b border-charcoal/10">
        <div className="flex items-center justify-between gap-2">
          <h2 className="type-heading-6 text-charcoal flex items-center gap-2">
            <MessageSquare size={18} className="text-ocean" />
            Mensajes
          </h2>
          <span className="text-xs text-charcoal/50 tabular-nums text-right">
            {decorated.length}/{conversations.length}
            <br />
            {totalMessages.toLocaleString('es-ES')} msg
          </span>
        </div>

        <div className="relative">
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-charcoal/40"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar invitado o teléfono…"
            className="pl-8 h-9 text-sm bg-cream/30 border-charcoal/10"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          <SortChip
            active={sort === 'recent'}
            onClick={() => setSort('recent')}
            label="Recientes"
          />
          <SortChip
            active={sort === 'volume'}
            onClick={() => setSort('volume')}
            label="Más mensajes"
          />
          <SortChip
            active={minMessages >= 50}
            onClick={() => setMinMessages((m) => (m >= 50 ? 0 : 50))}
            label="50+ msg"
          />
          <SortChip
            active={minMessages >= 100}
            onClick={() => setMinMessages((m) => (m >= 100 ? 0 : 100))}
            label="100+ msg"
          />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-ocean" />
          </div>
        ) : decorated.length === 0 ? (
          <div className="p-4 text-center text-sm text-charcoal/60">
            {conversations.length === 0
              ? 'Aún no hay conversaciones.'
              : 'Ningún hilo coincide con el filtro.'}
          </div>
        ) : (
          <ul className="divide-y divide-charcoal/5">
            {decorated.map((row) => {
              const selected = row.phone === activePhone;
              const count = row.messageCount ?? 0;
              const heavy = count >= 100;
              return (
                <li key={row.phone}>
                  <Link
                    href={`/admin/bot/messages/${encodeURIComponent(row.phone)}`}
                    className={`
                      block px-3 py-2.5 transition-colors
                      hover:bg-cream/50
                      ${selected ? 'bg-ocean/10 border-l-2 border-l-ocean' : 'border-l-2 border-l-transparent'}
                    `}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-sm truncate ${
                            selected ? 'font-semibold text-ocean' : 'font-medium text-charcoal'
                          }`}
                        >
                          {row.displayName}
                        </p>
                        <p className="text-xs text-charcoal/50 truncate tabular-nums">
                          {maskPhone(row.phone)}
                          {row.language && (
                            <span className="uppercase ml-1.5">{row.language}</span>
                          )}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <span
                          className={`
                            inline-block text-xs tabular-nums px-1.5 py-0.5 rounded
                            ${
                              heavy
                                ? 'bg-coral/15 text-coral font-medium'
                                : 'text-charcoal/60'
                            }
                          `}
                        >
                          {count}
                        </span>
                        <p className="text-[10px] text-charcoal/45 mt-0.5 max-w-[5.5rem] truncate">
                          {formatWhen(row.lastMessageAt)}
                        </p>
                      </div>
                    </div>
                    {row.unresolvedEscalationId && (
                      <p className="text-[10px] text-coral mt-1">Escalación abierta</p>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function SortChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        px-2 py-0.5 rounded text-xs transition-colors
        ${
          active
            ? 'bg-ocean text-white'
            : 'bg-cream/60 text-charcoal/70 hover:bg-cream border border-charcoal/10'
        }
      `}
    >
      {label}
    </button>
  );
}
