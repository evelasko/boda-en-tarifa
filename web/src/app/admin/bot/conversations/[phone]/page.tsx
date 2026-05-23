'use client';

import Link from 'next/link';
import { use, useEffect, useMemo, useState } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  getDoc,
} from 'firebase/firestore';
import { ArrowLeft, ExternalLink, Loader2 } from 'lucide-react';
import { db } from '@/lib/firestore';

interface MessageRow {
  id: string;
  direction: 'inbound' | 'outbound';
  type: string;
  text?: string;
  metaMessageId?: string;
  requestId?: string;
  cloudinaryPublicId?: string;
  claudeModel?: string;
  claudeUsage?: {
    inputTokens?: number;
    cachedReadTokens?: number;
    cachedWriteTokens?: number;
    outputTokens?: number;
  };
  outcome?: string;
  createdAt?: Timestamp;
}

interface GuestRow {
  id: string;
  fullName?: string;
  preferredName?: string;
  language?: string;
}

function formatTime(ts: Timestamp | undefined): string {
  if (!ts) return '';
  try {
    return ts.toDate().toLocaleString('es-ES', {
      timeZone: 'Europe/Madrid',
      dateStyle: 'short',
      timeStyle: 'medium',
    });
  } catch {
    return '';
  }
}

function cloudinaryUrl(publicId: string): string {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? '';
  if (!cloud) return '';
  return `https://res.cloudinary.com/${cloud}/image/upload/${publicId}`;
}

export default function ConversationThreadPage({
  params,
}: {
  params: Promise<{ phone: string }>;
}) {
  const resolved = use(params);
  const phone = decodeURIComponent(resolved.phone);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [guest, setGuest] = useState<GuestRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const rootRef = doc(db, 'bot_conversations', phone);
    let unsubMessages: (() => void) | null = null;

    const unsubRoot = onSnapshot(rootRef, async (snap) => {
      if (!snap.exists()) {
        setLoading(false);
        return;
      }
      const data = snap.data();
      const guestId = data.guestId as string | undefined;
      if (guestId) {
        const gSnap = await getDoc(doc(db, 'guests', guestId));
        if (gSnap.exists()) {
          const d = gSnap.data();
          setGuest({
            id: gSnap.id,
            fullName: d.fullName,
            preferredName: d.preferredName,
            language: d.language,
          });
        }
      }
      // Subscribe to messages (oldest first).
      if (unsubMessages) unsubMessages();
      unsubMessages = onSnapshot(
        query(
          collection(db, 'bot_conversations', phone, 'messages'),
          orderBy('createdAt', 'asc')
        ),
        (msgSnap) => {
          const rows: MessageRow[] = msgSnap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<MessageRow, 'id'>),
          }));
          setMessages(rows);
          setLoading(false);
        }
      );
    });

    return () => {
      unsubRoot();
      if (unsubMessages) unsubMessages();
    };
  }, [phone]);

  const displayName = useMemo(() => {
    if (!guest) return phone;
    return (
      guest.preferredName?.trim() ||
      guest.fullName?.split(/\s+/)[0] ||
      phone
    );
  }, [guest, phone]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/bot/conversations"
          className="inline-flex items-center gap-1 text-sm text-ocean hover:underline"
        >
          <ArrowLeft size={14} />
          Conversaciones
        </Link>
        <div className="text-sm text-charcoal/60">
          {messages.length} mensaje{messages.length === 1 ? '' : 's'}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-charcoal/10 p-4">
        <div className="flex flex-wrap items-baseline gap-3">
          <h2 className="type-heading-6 text-charcoal">{displayName}</h2>
          <code className="text-xs text-charcoal/50 tabular-nums">
            {phone}
          </code>
          {guest?.language && (
            <span className="px-2 py-0.5 text-xs uppercase rounded bg-ocean/10 text-ocean">
              {guest.language}
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-ocean" />
        </div>
      ) : messages.length === 0 ? (
        <div className="bg-white rounded-lg border border-charcoal/10 p-8 text-center text-sm text-charcoal/60">
          Sin mensajes en este hilo.
        </div>
      ) : (
        <div className="space-y-2">
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
        </div>
      )}
    </div>
  );
}

function MessageBubble({ message }: { message: MessageRow }) {
  const isInbound = message.direction === 'inbound';
  const cacheRatio = (() => {
    const u = message.claudeUsage;
    if (!u || !u.inputTokens) return null;
    const cached = u.cachedReadTokens ?? 0;
    return Math.round((cached / u.inputTokens) * 100);
  })();
  return (
    <div className={`flex ${isInbound ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`
          max-w-[80%] rounded-lg px-4 py-3 border
          ${
            isInbound
              ? 'bg-white border-charcoal/10'
              : 'bg-ocean/5 border-ocean/20'
          }
        `}
      >
        <div className="flex items-center gap-2 text-xs text-charcoal/50 mb-1">
          <span className="uppercase tracking-wide">
            {isInbound ? 'IN' : 'OUT'}
          </span>
          <span>·</span>
          <span>{message.type}</span>
          {message.outcome && (
            <>
              <span>·</span>
              <span>{message.outcome}</span>
            </>
          )}
          <span className="ml-auto">{formatTime(message.createdAt)}</span>
        </div>
        {message.text && (
          <p className="whitespace-pre-wrap text-sm text-charcoal">
            {message.text}
          </p>
        )}
        {message.cloudinaryPublicId && (
          <a
            href={cloudinaryUrl(message.cloudinaryPublicId)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-ocean hover:underline mt-2"
          >
            Ver media <ExternalLink size={12} />
          </a>
        )}
        {(message.claudeModel || message.requestId) && (
          <div className="mt-2 pt-2 border-t border-charcoal/5 text-[10px] text-charcoal/40 font-mono flex flex-wrap gap-x-3">
            {message.claudeModel && <span>model {message.claudeModel}</span>}
            {cacheRatio != null && <span>cache {cacheRatio}%</span>}
            {message.requestId && (
              <span>req {message.requestId.slice(0, 8)}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
