import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/admin-api-auth';

const COLLECTION = 'event_schedule';

export async function PUT(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const body: { events: Array<{ id: string; startTime: string; endTime: string; dayNumber: number }> } =
      await request.json();

    if (!Array.isArray(body.events) || body.events.length === 0) {
      return NextResponse.json(
        { error: 'Se requiere un array de eventos' },
        { status: 400 }
      );
    }

    const batch = adminFirestore.batch();

    for (const event of body.events) {
      const docRef = adminFirestore.collection(COLLECTION).doc(event.id);
      batch.update(docRef, {
        startTime: event.startTime,
        endTime: event.endTime,
        dayNumber: event.dayNumber,
      });
    }

    await batch.commit();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering timeline events:', error);
    return NextResponse.json(
      { error: 'Error al reordenar los eventos' },
      { status: 500 }
    );
  }
}
