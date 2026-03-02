import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/admin-api-auth';
import type { ScheduledNotification } from '@/types/notification';

const SENT_COLLECTION = 'sent_notifications';

/**
 * Static schedule mirrored from functions/src/config/notifications.ts.
 * Kept in sync manually — these rarely change.
 */
const SCHEDULED: Omit<ScheduledNotification, 'sent'>[] = [
  // Event reminders
  {
    id: 'welcome_party_reminder',
    sendAt: '2026-05-29T17:00:00Z',
    title: '¡Bienvenidos a Tarifa!',
    body: 'La fiesta de bienvenida empieza en 1 hora. ¡Nos vemos allí!',
    type: 'event_reminder',
    targetId: 'welcome_party',
    enabled: true,
  },
  {
    id: 'ceremony_reminder',
    sendAt: '2026-05-30T15:30:00Z',
    title: '¡La ceremonia está a punto de empezar!',
    body: 'Nos casamos en 30 minutos. ¡No llegues tarde!',
    type: 'event_reminder',
    targetId: 'ceremony',
    enabled: true,
  },
  {
    id: 'dinner_reminder',
    sendAt: '2026-05-30T18:30:00Z',
    title: '¡La cena está servida!',
    body: 'La cena empieza en 30 minutos. ¡Es hora de arreglarse!',
    type: 'event_reminder',
    targetId: 'dinner',
    enabled: true,
  },
  {
    id: 'brunch_reminder',
    sendAt: '2026-05-31T09:00:00Z',
    title: '¡Buenos días!',
    body: 'El brunch de despedida empieza en 1 hora. ¡Te esperamos!',
    type: 'event_reminder',
    targetId: 'brunch',
    enabled: true,
  },
  // Content unlock alerts
  {
    id: 'cocktail_menu_unlock',
    sendAt: '2026-05-30T17:30:00Z',
    title: '¡La carta de cócteles ya está disponible!',
    body: 'Abre la app para ver los cócteles de esta noche.',
    type: 'content_unlock',
    targetId: 'cocktailMenu',
    enabled: true,
  },
  {
    id: 'seating_chart_unlock',
    sendAt: '2026-05-30T19:50:00Z',
    title: '¡Tu mesa está lista!',
    body: 'Mira dónde te sientas esta noche.',
    type: 'content_unlock',
    targetId: 'seatingChart',
    enabled: true,
  },
  {
    id: 'banquet_menu_unlock',
    sendAt: '2026-05-30T20:00:00Z',
    title: 'El menú del banquete',
    body: 'Descubre lo que vamos a cenar.',
    type: 'content_unlock',
    targetId: 'banquetMenu',
    enabled: true,
  },
  // Film development
  {
    id: 'film_development_deadline',
    sendAt: '2026-05-31T03:00:00Z',
    title: '¡Tu carrete se ha revelado!',
    body: 'Las fotos de tu cámara desechable están listas. Abre la app para verlas.',
    type: 'film_development',
    enabled: true,
  },
];

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const sentSnapshot = await adminFirestore.collection(SENT_COLLECTION).get();
    const sentIds = new Set(sentSnapshot.docs.map((doc) => doc.id));

    const scheduled: ScheduledNotification[] = SCHEDULED.map((n) => ({
      ...n,
      sent: sentIds.has(n.id),
    }));

    scheduled.sort(
      (a, b) => new Date(a.sendAt).getTime() - new Date(b.sendAt).getTime()
    );

    return NextResponse.json(scheduled);
  } catch (error) {
    console.error('Error fetching scheduled notifications:', error);
    return NextResponse.json(
      { error: 'Error al obtener las notificaciones programadas' },
      { status: 500 }
    );
  }
}
