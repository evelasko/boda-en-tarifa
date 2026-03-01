import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/admin-api-auth';

const COLLECTION = 'notices';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const body = await request.json();

    if (typeof body.isHidden !== 'boolean') {
      return NextResponse.json(
        { error: 'El campo isHidden es obligatorio y debe ser booleano' },
        { status: 400 }
      );
    }

    const docRef = adminFirestore.collection(COLLECTION).doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json(
        { error: 'Anuncio no encontrado' },
        { status: 404 }
      );
    }

    await docRef.update({ isHidden: body.isHidden });

    const updated = await docRef.get();
    const data = updated.data()!;
    const createdAt = data.createdAt?.toDate?.()
      ? data.createdAt.toDate().toISOString()
      : (data.createdAt ?? new Date().toISOString());

    return NextResponse.json({
      id,
      authorUid: data.authorUid ?? '',
      authorName: data.authorName ?? '',
      authorPhotoUrl: data.authorPhotoUrl,
      body: data.body ?? '',
      authorWhatsappNumber: data.authorWhatsappNumber ?? '',
      isHidden: data.isHidden ?? false,
      createdAt,
    });
  } catch (error) {
    console.error('Error updating notice:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el anuncio' },
      { status: 500 }
    );
  }
}
