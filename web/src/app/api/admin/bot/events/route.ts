import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/admin-api-auth';

/**
 * Lists bot events from the canonical `events/` Firestore collection
 * (synced from `bot/data/events.yaml` via `bot/scripts/sync-kb.mjs`).
 *
 * This is the same source the bot reads everywhere (KB build, scheduled
 * `botEventReminderTick`, `today.ts`). The admin broadcasts/new page
 * uses this list to populate the T3 (`event_reminder_generic`) event
 * picker so manual sends produce identical messages to the scheduled
 * fire.
 *
 * Distinct from `/api/admin/timeline` which reads `event_schedule/` —
 * that's the Flutter/admin-timeline source of truth, NOT connected to
 * the bot.
 */

const COLLECTION = 'events';

export interface BotEventSummary {
  id: string;
  nameEs: string;
  nameEn?: string;
  startAt: string;
  endAt?: string;
  venueId?: string;
  /**
   * Lead times (minutes before startAt) at which `botEventReminderTick`
   * is configured to fire T3 for this event. Empty array means T3 is
   * suppressed for this event (e.g., ceremony uses bus_pickup_early/last
   * templates instead). Default `[60, 15]` when absent.
   */
  reminders?: number[];
  requiresNight?: 'friday' | 'saturday' | 'sunday';
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const snap = await adminFirestore.collection(COLLECTION).get();
    const events: BotEventSummary[] = snap.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          nameEs: typeof data.nameEs === 'string' ? data.nameEs : '',
          ...(typeof data.nameEn === 'string'
            ? { nameEn: data.nameEn }
            : {}),
          startAt: typeof data.startAt === 'string' ? data.startAt : '',
          ...(typeof data.endAt === 'string' ? { endAt: data.endAt } : {}),
          ...(typeof data.venueId === 'string'
            ? { venueId: data.venueId }
            : {}),
          ...(Array.isArray(data.reminders)
            ? {
                reminders: (data.reminders as unknown[]).filter(
                  (n): n is number => typeof n === 'number'
                ),
              }
            : {}),
          ...(data.requiresNight === 'friday' ||
          data.requiresNight === 'saturday' ||
          data.requiresNight === 'sunday'
            ? { requiresNight: data.requiresNight }
            : {}),
        };
      })
      .filter((e) => e.startAt) // discard malformed docs missing startAt
      .sort((a, b) => a.startAt.localeCompare(b.startAt));

    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching bot events:', error);
    return NextResponse.json(
      { error: 'Error al obtener los eventos del bot' },
      { status: 500 }
    );
  }
}
