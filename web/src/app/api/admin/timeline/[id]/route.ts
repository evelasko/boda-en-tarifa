import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/admin-api-auth';
import type { UpdateTimelineEventInput, TimelineEvent } from '@/types/timeline';

const COLLECTION = 'event_schedule';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const body: UpdateTimelineEventInput = await request.json();
    const docRef = adminFirestore.collection(COLLECTION).doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json(
        { error: 'Evento no encontrado' },
        { status: 404 }
      );
    }

    if (body.startTime && body.endTime) {
      if (new Date(body.endTime) <= new Date(body.startTime)) {
        return NextResponse.json(
          { error: 'La hora de fin debe ser posterior a la hora de inicio' },
          { status: 400 }
        );
      }
    } else if (body.endTime) {
      const current = docSnap.data()!;
      if (new Date(body.endTime) <= new Date(current.startTime)) {
        return NextResponse.json(
          { error: 'La hora de fin debe ser posterior a la hora de inicio' },
          { status: 400 }
        );
      }
    } else if (body.startTime) {
      const current = docSnap.data()!;
      if (new Date(current.endTime) <= new Date(body.startTime)) {
        return NextResponse.json(
          { error: 'La hora de fin debe ser posterior a la hora de inicio' },
          { status: 400 }
        );
      }
    }

    if (body.dayNumber !== undefined && (body.dayNumber < 1 || body.dayNumber > 3)) {
      return NextResponse.json(
        { error: 'El número de día debe ser 1, 2 o 3' },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.description !== undefined) updateData.description = body.description.trim();
    if (body.startTime !== undefined) updateData.startTime = body.startTime;
    if (body.endTime !== undefined) updateData.endTime = body.endTime;
    if (body.venueId !== undefined) updateData.venueId = body.venueId.trim();
    if (body.dayNumber !== undefined) updateData.dayNumber = body.dayNumber;
    if (body.ctaLabel !== undefined) updateData.ctaLabel = body.ctaLabel?.trim() || null;
    if (body.ctaDeepLink !== undefined) updateData.ctaDeepLink = body.ctaDeepLink?.trim() || null;

    await docRef.update(updateData);

    const updated = await docRef.get();
    const data = updated.data()!;
    const event: TimelineEvent = {
      id,
      title: data.title,
      description: data.description,
      startTime: data.startTime,
      endTime: data.endTime,
      venueId: data.venueId,
      dayNumber: data.dayNumber,
      ...(data.ctaLabel ? { ctaLabel: data.ctaLabel } : {}),
      ...(data.ctaDeepLink ? { ctaDeepLink: data.ctaDeepLink } : {}),
    };

    return NextResponse.json(event);
  } catch (error) {
    console.error('Error updating timeline event:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el evento' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const docRef = adminFirestore.collection(COLLECTION).doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json(
        { error: 'Evento no encontrado' },
        { status: 404 }
      );
    }

    await docRef.delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting timeline event:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el evento' },
      { status: 500 }
    );
  }
}
