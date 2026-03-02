import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/admin-api-auth';
import { FieldValue } from 'firebase-admin/firestore';

const COLLECTION = 'time_gated_content';
const VALID_IDS = ['menu-reveal', 'seating-reveal'];

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;

  if (!VALID_IDS.includes(id)) {
    return NextResponse.json(
      { error: `ID inválido: "${id}". Debe ser uno de: ${VALID_IDS.join(', ')}` },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const { title, unlockAt, payload, eventId } = body;

    // Validate unlockAt
    if (unlockAt !== undefined) {
      const date = new Date(unlockAt);
      if (isNaN(date.getTime())) {
        return NextResponse.json(
          { error: 'Fecha de desbloqueo inválida' },
          { status: 400 }
        );
      }
      const start = new Date('2026-05-28T00:00:00+02:00');
      const end = new Date('2026-05-31T23:59:59+02:00');
      if (date < start || date > end) {
        return NextResponse.json(
          { error: 'La fecha de desbloqueo debe estar dentro de la ventana del evento (28-31 mayo 2026)' },
          { status: 400 }
        );
      }
    }

    // Validate title
    if (title !== undefined && typeof title !== 'string') {
      return NextResponse.json(
        { error: 'El título debe ser un texto' },
        { status: 400 }
      );
    }

    // Build update
    const update: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (title !== undefined) update.title = title.trim();
    if (unlockAt !== undefined) update.unlockAt = new Date(unlockAt);
    if (payload !== undefined) update.payload = payload;
    if (eventId !== undefined) update.eventId = eventId;

    await adminFirestore.doc(`${COLLECTION}/${id}`).update(update);

    // Return the updated document
    const doc = await adminFirestore.doc(`${COLLECTION}/${id}`).get();
    const data = doc.data()!;

    return NextResponse.json({
      id: doc.id,
      contentType: data.contentType,
      title: data.title,
      unlockAt: data.unlockAt?.toDate?.()
        ? data.unlockAt.toDate().toISOString()
        : data.unlockAt,
      eventId: data.eventId ?? undefined,
      firestoreDocPath: data.firestoreDocPath ?? `time_gated_content/${doc.id}`,
      payload: data.payload ?? undefined,
    });
  } catch (error) {
    console.error(`Error updating time-gated content ${id}:`, error);
    return NextResponse.json(
      { error: 'Error al actualizar el contenido programado' },
      { status: 500 }
    );
  }
}
