import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/admin-api-auth';
import { FieldValue } from 'firebase-admin/firestore';

const COLLECTION = 'time_gated_content';

const DEFAULT_GATES = [
  {
    id: 'menu-reveal',
    contentType: 'menu',
    title: 'Menu de la cena',
    unlockAt: '2026-05-28T12:00:00+02:00',
    eventId: 'fri-cocktail',
    firestoreDocPath: 'time_gated_content/menu-reveal',
    payload: { items: [], notes: '' },
  },
  {
    id: 'seating-reveal',
    contentType: 'seating',
    title: 'Asignacion de mesas',
    unlockAt: '2026-05-29T10:00:00+02:00',
    eventId: 'fri-dinner',
    firestoreDocPath: 'time_gated_content/seating-reveal',
    payload: {},
  },
];

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const snapshot = await adminFirestore.collection(COLLECTION).get();

    if (snapshot.empty) {
      // Pre-seed default documents
      const batch = adminFirestore.batch();
      for (const gate of DEFAULT_GATES) {
        batch.set(adminFirestore.collection(COLLECTION).doc(gate.id), {
          ...gate,
          unlockAt: new Date(gate.unlockAt),
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
      await batch.commit();

      return NextResponse.json({ items: DEFAULT_GATES });
    }

    const items = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        contentType: data.contentType,
        title: data.title,
        unlockAt: data.unlockAt?.toDate?.()
          ? data.unlockAt.toDate().toISOString()
          : data.unlockAt,
        eventId: data.eventId ?? undefined,
        firestoreDocPath: data.firestoreDocPath ?? `time_gated_content/${doc.id}`,
        payload: data.payload ?? undefined,
      };
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error fetching time-gated content:', error);
    return NextResponse.json(
      { error: 'Error al obtener el contenido programado' },
      { status: 500 }
    );
  }
}
