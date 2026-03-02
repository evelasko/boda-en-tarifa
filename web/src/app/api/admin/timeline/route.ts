import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/admin-api-auth';
import type { TimelineEvent, CreateTimelineEventInput } from '@/types/timeline';

const COLLECTION = 'event_schedule';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const snap = await adminFirestore
      .collection(COLLECTION)
      .orderBy('startTime', 'asc')
      .get();

    const events: TimelineEvent[] = snap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title ?? '',
        description: data.description ?? '',
        startTime: data.startTime ?? '',
        endTime: data.endTime ?? '',
        venueId: data.venueId ?? '',
        ...(data.ctaLabel ? { ctaLabel: data.ctaLabel } : {}),
        ...(data.ctaDeepLink ? { ctaDeepLink: data.ctaDeepLink } : {}),
        dayNumber: data.dayNumber ?? 1,
      };
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching timeline events:', error);
    return NextResponse.json(
      { error: 'Error al obtener los eventos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const body: CreateTimelineEventInput = await request.json();

    if (!body.id?.trim() || !body.title?.trim() || !body.description?.trim() ||
        !body.startTime || !body.endTime || !body.venueId?.trim() || !body.dayNumber) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios: id, title, description, startTime, endTime, venueId, dayNumber' },
        { status: 400 }
      );
    }

    if (new Date(body.endTime) <= new Date(body.startTime)) {
      return NextResponse.json(
        { error: 'La hora de fin debe ser posterior a la hora de inicio' },
        { status: 400 }
      );
    }

    if (body.dayNumber < 1 || body.dayNumber > 3) {
      return NextResponse.json(
        { error: 'El número de día debe ser 1, 2 o 3' },
        { status: 400 }
      );
    }

    // Check for duplicate ID
    const existing = await adminFirestore.collection(COLLECTION).doc(body.id).get();
    if (existing.exists) {
      return NextResponse.json(
        { error: 'Ya existe un evento con este ID' },
        { status: 400 }
      );
    }

    const eventData: Record<string, unknown> = {
      title: body.title.trim(),
      description: body.description.trim(),
      startTime: body.startTime,
      endTime: body.endTime,
      venueId: body.venueId.trim(),
      dayNumber: body.dayNumber,
    };

    if (body.ctaLabel?.trim()) {
      eventData.ctaLabel = body.ctaLabel.trim();
    }
    if (body.ctaDeepLink?.trim()) {
      eventData.ctaDeepLink = body.ctaDeepLink.trim();
    }

    await adminFirestore.collection(COLLECTION).doc(body.id).set(eventData);

    const event: TimelineEvent = {
      id: body.id,
      title: eventData.title as string,
      description: eventData.description as string,
      startTime: eventData.startTime as string,
      endTime: eventData.endTime as string,
      venueId: eventData.venueId as string,
      dayNumber: eventData.dayNumber as number,
      ...(eventData.ctaLabel ? { ctaLabel: eventData.ctaLabel as string } : {}),
      ...(eventData.ctaDeepLink ? { ctaDeepLink: eventData.ctaDeepLink as string } : {}),
    };

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error('Error creating timeline event:', error);
    return NextResponse.json(
      { error: 'Error al crear el evento' },
      { status: 500 }
    );
  }
}
