import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/admin-api-auth';
import { FieldValue } from 'firebase-admin/firestore';
import type { AdminVenue } from '@/types/content-admin';

const DOC_PATH = 'config/venues';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const doc = await adminFirestore.doc(DOC_PATH).get();
    if (!doc.exists) {
      return NextResponse.json({ items: [] });
    }
    const data = doc.data()!;
    return NextResponse.json({ items: data.items ?? [] });
  } catch (error) {
    console.error('Error fetching venues:', error);
    return NextResponse.json(
      { error: 'Error al obtener los venues' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const items: AdminVenue[] = body.items;

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: 'El campo "items" debe ser un array' },
        { status: 400 }
      );
    }

    for (const item of items) {
      if (!item.id?.trim() || !item.name?.trim()) {
        return NextResponse.json(
          { error: 'Cada venue debe tener id y name' },
          { status: 400 }
        );
      }
      if (typeof item.latitude !== 'number' || item.latitude < -90 || item.latitude > 90) {
        return NextResponse.json(
          { error: `Latitud inválida para "${item.name}"` },
          { status: 400 }
        );
      }
      if (typeof item.longitude !== 'number' || item.longitude < -180 || item.longitude > 180) {
        return NextResponse.json(
          { error: `Longitud inválida para "${item.name}"` },
          { status: 400 }
        );
      }
    }

    const ids = items.map((v) => v.id);
    if (new Set(ids).size !== ids.length) {
      return NextResponse.json(
        { error: 'Los IDs de venue deben ser únicos' },
        { status: 400 }
      );
    }

    await adminFirestore.doc(DOC_PATH).set({
      items,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error saving venues:', error);
    return NextResponse.json(
      { error: 'Error al guardar los venues' },
      { status: 500 }
    );
  }
}
