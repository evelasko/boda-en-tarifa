import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/admin-api-auth';
import { FieldValue } from 'firebase-admin/firestore';
import type { ContactEntry } from '@/types/content-admin';

const DOC_PATH = 'config/quick_contacts';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const doc = await adminFirestore.doc(DOC_PATH).get();
    if (!doc.exists) {
      return NextResponse.json({ taxis: [], coordinators: [] });
    }
    const data = doc.data()!;
    return NextResponse.json({
      taxis: data.taxis ?? [],
      coordinators: data.coordinators ?? [],
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json(
      { error: 'Error al obtener los contactos' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const taxis: ContactEntry[] = body.taxis ?? [];
    const coordinators: ContactEntry[] = body.coordinators ?? [];

    for (const entry of [...taxis, ...coordinators]) {
      if (!entry.name?.trim() || !entry.phone?.trim()) {
        return NextResponse.json(
          { error: 'Cada contacto debe tener nombre y teléfono' },
          { status: 400 }
        );
      }
    }

    await adminFirestore.doc(DOC_PATH).set({
      taxis,
      coordinators,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ taxis, coordinators });
  } catch (error) {
    console.error('Error saving contacts:', error);
    return NextResponse.json(
      { error: 'Error al guardar los contactos' },
      { status: 500 }
    );
  }
}
