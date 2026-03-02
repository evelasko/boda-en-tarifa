import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/admin-api-auth';
import type { SentNotification } from '@/types/notification';

const COLLECTION = 'sent_notifications';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const snapshot = await adminFirestore
      .collection(COLLECTION)
      .orderBy('sentAt', 'desc')
      .limit(100)
      .get();

    const notifications: SentNotification[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title ?? '',
        body: data.body ?? '',
        deepLink: data.deepLink ?? null,
        sentAt: data.sentAt ?? '',
        sentBy: data.sentBy ?? '',
        fcmMessageId: data.fcmMessageId ?? null,
        status: data.status ?? 'sent',
        errorMessage: data.errorMessage ?? null,
      };
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error('Error fetching notification history:', error);
    return NextResponse.json(
      { error: 'Error al obtener el historial de notificaciones' },
      { status: 500 }
    );
  }
}
