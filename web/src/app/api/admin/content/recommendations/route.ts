import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/admin-api-auth';
import { FieldValue } from 'firebase-admin/firestore';
import type { Recommendation } from '@/types/content-admin';

const DOC_PATH = 'config/recommendations';

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
    console.error('Error fetching recommendations:', error);
    return NextResponse.json(
      { error: 'Error al obtener las recomendaciones' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const items: Recommendation[] = body.items;

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: 'El campo "items" debe ser un array' },
        { status: 400 }
      );
    }

    for (const item of items) {
      if (!item.name?.trim() || !item.description?.trim()) {
        return NextResponse.json(
          { error: 'Cada recomendación debe tener nombre y descripción' },
          { status: 400 }
        );
      }
    }

    await adminFirestore.doc(DOC_PATH).set({
      items,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error saving recommendations:', error);
    return NextResponse.json(
      { error: 'Error al guardar las recomendaciones' },
      { status: 500 }
    );
  }
}
