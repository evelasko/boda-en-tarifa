import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminFirestore } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/admin-api-auth';

const RSVP_COLLECTION = 'rsvp_responses';

type UnlinkBody = {
  rsvpUid?: string;
};

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const body = (await request.json()) as UnlinkBody;
    const rsvpUid = typeof body.rsvpUid === 'string' ? body.rsvpUid.trim() : '';

    if (!rsvpUid) {
      return NextResponse.json({ error: 'Se requiere rsvpUid' }, { status: 400 });
    }

    const rsvpRef = adminFirestore.collection(RSVP_COLLECTION).doc(rsvpUid);
    const rsvpSnap = await rsvpRef.get();

    if (!rsvpSnap.exists) {
      return NextResponse.json({ error: 'Respuesta RSVP no encontrada' }, { status: 404 });
    }

    await rsvpRef.update({
      linkedGuestUid: FieldValue.delete(),
      linkedAt: FieldValue.delete(),
      linkedByAdminUid: FieldValue.delete(),
      linkSource: FieldValue.delete(),
      linkNotes: FieldValue.delete(),
      unlinkedAt: FieldValue.serverTimestamp(),
      unlinkedByAdminUid: auth.uid,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error unlinking RSVP:', error);
    return NextResponse.json(
      { error: 'Error al desenlazar la respuesta RSVP' },
      { status: 500 }
    );
  }
}
