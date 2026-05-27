import type { Timestamp } from 'firebase/firestore';

export const MESSAGE_PAGE_SIZE = 50;

export interface BotConversationRoot {
  phone: string;
  guestId: string;
  language?: string;
  lastMessageAt?: Timestamp | null;
  messageCount?: number;
  startedAt?: Timestamp | null;
  unresolvedEscalationId?: string;
}

export interface BotToolCall {
  name: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  errored?: boolean;
}

export interface BotMessageRow {
  id: string;
  direction: 'inbound' | 'outbound';
  type: string;
  text?: string;
  metaMessageId?: string;
  requestId?: string;
  cloudinaryPublicId?: string;
  mediaId?: string;
  templateName?: string;
  toolCalls?: BotToolCall[];
  claudeModel?: string;
  claudeUsage?: {
    inputTokens?: number;
    cachedReadTokens?: number;
    cachedWriteTokens?: number;
    outputTokens?: number;
  };
  latencyMs?: number;
  outcome?: string;
  errorCode?: string;
  errorMessage?: string;
  senderType?: string;
  operatorEmail?: string;
  createdAt?: Timestamp;
}

export interface GuestNameRow {
  id: string;
  fullName?: string;
  preferredName?: string;
}

const MADRID_TZ = 'Europe/Madrid';

export function maskPhone(p: string): string {
  if (!p) return '';
  if (p.length <= 6) return p;
  return `${p.slice(0, 3)}${'•'.repeat(Math.max(p.length - 6, 1))}${p.slice(-3)}`;
}

export function formatWhen(
  ts: Timestamp | null | undefined,
  opts?: { dateStyle?: 'short' | 'medium'; timeStyle?: 'short' | 'medium' }
): string {
  if (!ts) return '—';
  try {
    return ts.toDate().toLocaleString('es-ES', {
      timeZone: MADRID_TZ,
      dateStyle: opts?.dateStyle ?? 'short',
      timeStyle: opts?.timeStyle ?? 'short',
    });
  } catch {
    return '—';
  }
}

export function formatMessageTime(ts: Timestamp | undefined): string {
  if (!ts) return '';
  try {
    return ts.toDate().toLocaleString('es-ES', {
      timeZone: MADRID_TZ,
      dateStyle: 'short',
      timeStyle: 'medium',
    });
  } catch {
    return '';
  }
}

export function dateGroupLabel(ts: Timestamp | undefined): string {
  if (!ts) return '';
  const d = ts.toDate();
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const msgDay = new Date(d);
  msgDay.setHours(0, 0, 0, 0);

  if (msgDay.getTime() === startOfToday.getTime()) return 'Hoy';
  if (msgDay.getTime() === startOfYesterday.getTime()) return 'Ayer';
  return d.toLocaleDateString('es-ES', {
    timeZone: MADRID_TZ,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export function guestDisplayName(
  guest: GuestNameRow | undefined,
  fallback: string
): string {
  if (!guest) return fallback;
  return (
    guest.preferredName?.trim() ||
    guest.fullName?.split(/\s+/)[0] ||
    fallback
  );
}

export function cloudinaryUrl(publicId: string): string {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? '';
  if (!cloud) return '';
  return `https://res.cloudinary.com/${cloud}/image/upload/${publicId}`;
}

export function mergeMessagesChronological(
  older: BotMessageRow[],
  recent: BotMessageRow[]
): BotMessageRow[] {
  const byId = new Map<string, BotMessageRow>();
  for (const m of [...older, ...recent]) {
    byId.set(m.id, m);
  }
  return [...byId.values()].sort((a, b) => {
    const ta = a.createdAt?.toMillis() ?? 0;
    const tb = b.createdAt?.toMillis() ?? 0;
    return ta - tb;
  });
}

export type ConversationSort = 'recent' | 'volume';
