import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/admin-api-auth';

const COLLECTION = 'feed_posts';

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const { postIds, isHidden } = body;

    if (!Array.isArray(postIds) || postIds.length === 0) {
      return NextResponse.json(
        { error: 'Se requiere un array de postIds no vacío' },
        { status: 400 }
      );
    }

    if (typeof isHidden !== 'boolean') {
      return NextResponse.json(
        { error: 'El campo isHidden es obligatorio y debe ser booleano' },
        { status: 400 }
      );
    }

    const batch = adminFirestore.batch();
    let count = 0;

    for (const id of postIds) {
      const docRef = adminFirestore.collection(COLLECTION).doc(id);
      batch.update(docRef, { isHidden });
      count++;
    }

    await batch.commit();

    return NextResponse.json({ updated: count });
  } catch (error) {
    console.error('Error bulk updating feed posts:', error);
    return NextResponse.json(
      { error: 'Error al actualizar las publicaciones' },
      { status: 500 }
    );
  }
}
