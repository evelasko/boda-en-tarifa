import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminFirestore } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/admin-api-auth';

const GUESTS_COLLECTION = 'guests';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const { uid } = await params;

  try {
    const docRef = adminFirestore.collection(GUESTS_COLLECTION).doc(uid);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json(
        { error: 'Invitado no encontrado' },
        { status: 404 }
      );
    }

    const guest = docSnap.data()!;
    const customToken = await adminAuth.createCustomToken(uid);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bodaentarifa.com';
    const magicLinkUrl = `${baseUrl}/login?token=${customToken}`;

    return NextResponse.json({
      magicLinkUrl,
      guestName: guest.fullName,
      guestEmail: guest.email,
    });
  } catch (error) {
    console.error('Error generating magic link:', error);
    return NextResponse.json(
      { error: 'Error al generar el magic link' },
      { status: 500 }
    );
  }
}
