import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/admin-api-auth';

const COLLECTION = 'event_schedule';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const snap = await adminFirestore
      .collection(COLLECTION)
      .orderBy('startTime', 'asc')
      .get();

    // Build the export array matching app/assets/defaults/event_schedule.json format.
    // Optional fields (ctaLabel, ctaDeepLink) are omitted when empty, not set to null.
    const events: Array<Record<string, unknown>> = snap.docs.map((doc) => {
      const data = doc.data();
      const event: Record<string, unknown> = {
        id: doc.id,
        title: data.title,
        description: data.description,
        startTime: data.startTime,
        endTime: data.endTime,
        venueId: data.venueId,
        dayNumber: data.dayNumber,
      };

      if (data.ctaLabel) {
        event.ctaLabel = data.ctaLabel;
      }
      if (data.ctaDeepLink) {
        event.ctaDeepLink = data.ctaDeepLink;
      }

      return event;
    });

    return new NextResponse(JSON.stringify(events, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="event_schedule.json"',
      },
    });
  } catch (error) {
    console.error('Error exporting timeline JSON:', error);
    return NextResponse.json(
      { error: 'Error al exportar el JSON' },
      { status: 500 }
    );
  }
}
