import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore, adminMessaging } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/admin-api-auth';
import type { SendNotificationPayload } from '@/types/notification';

const TITLE_MAX = 65;
const BODY_MAX = 240;
const COLLECTION = 'sent_notifications';

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const payload: SendNotificationPayload = await request.json();

    if (!payload.title?.trim() || !payload.body?.trim()) {
      return NextResponse.json(
        { error: 'Título y cuerpo son obligatorios' },
        { status: 400 }
      );
    }

    if (payload.title.length > TITLE_MAX) {
      return NextResponse.json(
        { error: `El título no puede superar ${TITLE_MAX} caracteres` },
        { status: 400 }
      );
    }

    if (payload.body.length > BODY_MAX) {
      return NextResponse.json(
        { error: `El cuerpo no puede superar ${BODY_MAX} caracteres` },
        { status: 400 }
      );
    }

    const fcmMessage = {
      notification: {
        title: payload.title.trim(),
        body: payload.body.trim(),
      },
      data: payload.deepLink ? { deepLink: payload.deepLink } : undefined,
      topic: 'wedding',
      android: { priority: 'high' as const },
      apns: { payload: { aps: { sound: 'default' } } },
    };

    let fcmMessageId: string | null = null;
    let status: 'sent' | 'failed' = 'sent';
    let errorMessage: string | null = null;

    try {
      fcmMessageId = await adminMessaging.send(fcmMessage);
    } catch (err) {
      status = 'failed';
      errorMessage = err instanceof Error ? err.message : 'Error desconocido al enviar';
    }

    const record = {
      title: payload.title.trim(),
      body: payload.body.trim(),
      deepLink: payload.deepLink || null,
      sentAt: new Date().toISOString(),
      sentBy: auth.email,
      fcmMessageId,
      status,
      errorMessage,
      type: 'manual_broadcast',
    };

    const docRef = await adminFirestore.collection(COLLECTION).add(record);

    if (status === 'failed') {
      return NextResponse.json(
        { error: errorMessage, id: docRef.id, status },
        { status: 502 }
      );
    }

    return NextResponse.json({
      id: docRef.id,
      fcmMessageId,
      status,
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json(
      { error: 'Error al enviar la notificación' },
      { status: 500 }
    );
  }
}
