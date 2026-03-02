import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/admin-api-auth';
import { FieldValue } from 'firebase-admin/firestore';

const OVERRIDE_DOC = 'config/timeline_override';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const doc = await adminFirestore.doc(OVERRIDE_DOC).get();

    if (!doc.exists) {
      return NextResponse.json({ eventId: '', active: false, updatedAt: '' });
    }

    const data = doc.data()!;
    return NextResponse.json({
      eventId: data.eventId ?? '',
      active: data.active ?? false,
      updatedAt: data.updatedAt?.toDate?.()
        ? data.updatedAt.toDate().toISOString()
        : (data.updatedAt ?? ''),
    });
  } catch (error) {
    console.error('Error fetching timeline override:', error);
    return NextResponse.json(
      { error: 'Error al obtener el estado del override' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const body: { eventId: string; active: boolean } = await request.json();

    if (body.active && !body.eventId?.trim()) {
      return NextResponse.json(
        { error: 'Se requiere un eventId cuando el override está activo' },
        { status: 400 }
      );
    }

    await adminFirestore.doc(OVERRIDE_DOC).set({
      eventId: body.eventId?.trim() ?? '',
      active: body.active ?? false,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      eventId: body.eventId?.trim() ?? '',
      active: body.active ?? false,
    });
  } catch (error) {
    console.error('Error updating timeline override:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el override' },
      { status: 500 }
    );
  }
}
