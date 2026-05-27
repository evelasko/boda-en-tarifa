'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  startAfter,
  type DocumentSnapshot,
  type QueryDocumentSnapshot,
  type Timestamp,
} from 'firebase/firestore';
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ChevronUp,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { db } from '@/lib/firestore';
import {
  MESSAGE_PAGE_SIZE,
  type BotMessageRow,
  type GuestNameRow,
  dateGroupLabel,
  formatWhen,
  guestDisplayName,
  mergeMessagesChronological,
} from '@/lib/bot-conversations';
import { ConversationMessageBubble } from './ConversationMessageBubble';

interface ConversationThreadPanelProps {
  phone: string;
}

export function ConversationThreadPanel({ phone }: ConversationThreadPanelProps) {
  const [guest, setGuest] = useState<GuestNameRow | null>(null);
  const [rootMeta, setRootMeta] = useState<{
    messageCount?: number;
    language?: string;
    guestId?: string;
    unresolvedEscalationId?: string;
    startedAt?: Timestamp;
  } | null>(null);
  const [olderMessages, setOlderMessages] = useState<BotMessageRow[]>([]);
  const [recentMessages, setRecentMessages] = useState<BotMessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [oldestCursor, setOldestCursor] = useState<
    QueryDocumentSnapshot | undefined
  >(undefined);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [showJumpBottom, setShowJumpBottom] = useState(false);
  const isNearBottomRef = useRef(true);

  const messages = useMemo(
    () => mergeMessagesChronological(olderMessages, recentMessages),
    [olderMessages, recentMessages]
  );

  const totalCount = rootMeta?.messageCount ?? messages.length;

  useEffect(() => {
    setOlderMessages([]);
    setRecentMessages([]);
    setOldestCursor(undefined);
    setLoading(true);
    isNearBottomRef.current = true;
  }, [phone]);

  useEffect(() => {
    const rootRef = doc(db, 'bot_conversations', phone);
    const unsubRoot = onSnapshot(rootRef, async (snap) => {
      if (!snap.exists()) {
        setRootMeta(null);
        setLoading(false);
        return;
      }
      const data = snap.data();
      const count = data.messageCount as number | undefined;
      setRootMeta({
        messageCount: count,
        language: data.language as string | undefined,
        guestId: data.guestId as string | undefined,
        unresolvedEscalationId: data.unresolvedEscalationId as string | undefined,
        startedAt: data.startedAt as Timestamp | undefined,
      });
      const guestId = data.guestId as string | undefined;
      if (guestId) {
        const gSnap = await getDoc(doc(db, 'guests', guestId));
        if (gSnap.exists()) {
          const d = gSnap.data();
          setGuest({
            id: gSnap.id,
            fullName: d.fullName,
            preferredName: d.preferredName,
          });
        } else {
          setGuest(null);
        }
      }
    });
    return () => unsubRoot();
  }, [phone]);

  useEffect(() => {
    const messagesRef = collection(db, 'bot_conversations', phone, 'messages');
    const recentQuery = query(
      messagesRef,
      orderBy('createdAt', 'desc'),
      limit(MESSAGE_PAGE_SIZE)
    );

    const unsub = onSnapshot(recentQuery, (snap) => {
      const rows: BotMessageRow[] = snap.docs
        .map((d) => ({
          id: d.id,
          ...(d.data() as Omit<BotMessageRow, 'id'>),
        }))
        .reverse();

      setRecentMessages(rows);

      if (snap.docs.length > 0) {
        setOldestCursor((prev) => prev ?? snap.docs[snap.docs.length - 1]);
      }

      setLoading(false);

      if (isNearBottomRef.current) {
        requestAnimationFrame(() => {
          const el = scrollRef.current;
          if (el) el.scrollTop = el.scrollHeight;
        });
      }
    });

    return () => unsub();
  }, [phone]);

  const hasMoreOlder = useMemo(() => {
    const total = rootMeta?.messageCount ?? 0;
    if (total === 0) return messages.length === 0;
    return messages.length < total;
  }, [rootMeta?.messageCount, messages.length]);

  const loadOlder = useCallback(async () => {
    if (!hasMoreOlder || loadingOlder) return;

    setLoadingOlder(true);
    const el = scrollRef.current;
    const prevHeight = el?.scrollHeight ?? 0;

    try {
      let pageCursor: DocumentSnapshot | undefined = oldestCursor;
      if (!pageCursor && messages.length > 0) {
        const firstSnap = await getDoc(
          doc(db, 'bot_conversations', phone, 'messages', messages[0].id)
        );
        if (!firstSnap.exists()) return;
        pageCursor = firstSnap;
      }

      if (!pageCursor) return;

      const olderQuery = query(
        collection(db, 'bot_conversations', phone, 'messages'),
        orderBy('createdAt', 'desc'),
        startAfter(pageCursor),
        limit(MESSAGE_PAGE_SIZE)
      );
      const snap = await getDocs(olderQuery);

      if (snap.empty) return;

      const batch: BotMessageRow[] = snap.docs
        .map((d) => ({
          id: d.id,
          ...(d.data() as Omit<BotMessageRow, 'id'>),
        }))
        .reverse();

      setOlderMessages((prev) =>
        mergeMessagesChronological(batch, prev)
      );
      setOldestCursor(snap.docs[snap.docs.length - 1]);

      requestAnimationFrame(() => {
        if (!el) return;
        const newHeight = el.scrollHeight;
        el.scrollTop += newHeight - prevHeight;
      });
    } finally {
      setLoadingOlder(false);
    }
  }, [hasMoreOlder, loadingOlder, oldestCursor, messages, phone]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const nearBottom = distanceFromBottom < 80;
    isNearBottomRef.current = nearBottom;
    setShowJumpBottom(!nearBottom && messages.length > 0);
  }, [messages.length]);

  const jumpToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    isNearBottomRef.current = true;
    setShowJumpBottom(false);
  }, []);

  const displayName = guestDisplayName(guest ?? undefined, phone);

  const grouped = useMemo(() => {
    const groups: { label: string; items: BotMessageRow[] }[] = [];
    let currentLabel = '';
    for (const m of messages) {
      const label = dateGroupLabel(m.createdAt);
      if (label !== currentLabel) {
        currentLabel = label;
        groups.push({ label, items: [m] });
      } else {
        groups[groups.length - 1].items.push(m);
      }
    }
    return groups;
  }, [messages]);

  const loadedVsTotal =
    messages.length < totalCount
      ? `Mostrando ${messages.length} de ${totalCount}`
      : `${messages.length} mensaje${messages.length === 1 ? '' : 's'}`;

  if (loading && messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[20rem]">
        <Loader2 className="h-8 w-8 animate-spin text-ocean" />
      </div>
    );
  }

  if (!rootMeta && !loading) {
    return (
      <div className="flex items-center justify-center h-full p-8 text-sm text-charcoal/60">
        Conversación no encontrada.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <header className="shrink-0 border-b border-charcoal/10 bg-white px-4 py-3">
        <Link
          href="/admin/bot/messages"
          className="lg:hidden inline-flex items-center gap-1 text-sm text-ocean hover:underline mb-2"
        >
          <ArrowLeft size={14} />
          Todos los hilos
        </Link>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="type-heading-6 text-charcoal">{displayName}</h2>
          <code className="text-xs text-charcoal/50 tabular-nums">{phone}</code>
          {(rootMeta?.language || guest) && (
            <span className="px-2 py-0.5 text-xs uppercase rounded bg-ocean/10 text-ocean">
              {rootMeta?.language ?? '—'}
            </span>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-charcoal/50">
          <span>{loadedVsTotal}</span>
          {rootMeta?.unresolvedEscalationId && (
            <Link
              href={`/admin/bot/escalations/${rootMeta.unresolvedEscalationId}`}
              className="inline-flex items-center gap-1 text-coral hover:underline"
            >
              <AlertTriangle size={12} />
              Ver escalación abierta
            </Link>
          )}
          {rootMeta?.guestId && (
            <Link
              href="/admin/guests"
              className="inline-flex items-center gap-1 text-ocean hover:underline"
            >
              Invitados <ExternalLink size={10} />
            </Link>
          )}
          {rootMeta?.startedAt && (
            <span>Inicio: {formatWhen(rootMeta.startedAt)}</span>
          )}
        </div>
      </header>

      <div className="relative flex-1 min-h-0">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="absolute inset-0 overflow-y-auto px-4 py-3 space-y-3 bg-cream/20"
        >
          {hasMoreOlder && (
            <div className="flex justify-center pb-2">
              <button
                type="button"
                onClick={() => void loadOlder()}
                disabled={loadingOlder}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full
                  bg-white border border-charcoal/10 text-charcoal/70
                  hover:border-ocean/30 hover:text-ocean disabled:opacity-50"
              >
                {loadingOlder ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <ChevronUp size={14} />
                )}
                Cargar mensajes anteriores
              </button>
            </div>
          )}

          {messages.length === 0 ? (
            <div className="text-center text-sm text-charcoal/60 py-12">
              Sin mensajes en este hilo.
            </div>
          ) : (
            grouped.map((group) => (
              <section key={group.label} className="space-y-2">
                <div className="sticky top-0 z-10 flex justify-center py-1">
                  <span className="text-[11px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-white/90 border border-charcoal/10 text-charcoal/50 shadow-sm">
                    {group.label}
                  </span>
                </div>
                {group.items.map((m) => (
                  <ConversationMessageBubble key={m.id} message={m} />
                ))}
              </section>
            ))
          )}
        </div>

        {showJumpBottom && (
          <button
            type="button"
            onClick={jumpToBottom}
            className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 px-3 py-2
              rounded-full bg-ocean text-white text-sm shadow-md hover:bg-ocean/90"
          >
            <ArrowDown size={16} />
            Recientes
          </button>
        )}
      </div>
    </div>
  );
}
