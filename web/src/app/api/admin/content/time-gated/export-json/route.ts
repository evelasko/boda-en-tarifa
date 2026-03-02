import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/admin-api-auth';

const COLLECTION = 'time_gated_content';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const snapshot = await adminFirestore.collection(COLLECTION).get();

    const gates = snapshot.docs.map((doc) => {
      const data = doc.data();
      const unlockAt = data.unlockAt?.toDate?.()
        ? data.unlockAt.toDate().toISOString()
        : data.unlockAt;

      return {
        id: doc.id,
        contentType: data.contentType,
        title: data.title,
        unlockAt,
        eventId: data.eventId ?? undefined,
        firestoreDocPath: data.firestoreDocPath ?? `time_gated_content/${doc.id}`,
      };
    });

    const json = JSON.stringify(gates, null, 2);
    return new NextResponse(json, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="time_gates_json.json"`,
      },
    });
  } catch (error) {
    console.error('Error exporting time gates:', error);
    return NextResponse.json(
      { error: 'Error al exportar las puertas de tiempo' },
      { status: 500 }
    );
  }
}
