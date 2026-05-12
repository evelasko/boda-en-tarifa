import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminFirestore } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/admin-api-auth';
import type { RsvpGuestLinkSource } from '@/types/rsvp';

const GUESTS_COLLECTION = 'guests';
const RSVP_COLLECTION = 'rsvp_responses';

type LinkBody = {
  rsvpUid?: string;
  guestUid?: string;
  notes?: string;
  source?: RsvpGuestLinkSource;
};

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const body = (await request.json()) as LinkBody;
    const rsvpUid = typeof body.rsvpUid === 'string' ? body.rsvpUid.trim() : '';
    const guestUid = typeof body.guestUid === 'string' ? body.guestUid.trim() : '';

    if (!rsvpUid || !guestUid) {
      return NextResponse.json(
        { error: 'Se requieren rsvpUid y guestUid' },
        { status: 400 }
      );
    }

    const source: RsvpGuestLinkSource =
      body.source === 'auto_email' ? 'auto_email' : 'manual';

    const notes =
      typeof body.notes === 'string' && body.notes.trim() ? body.notes.trim() : undefined;

    const [guestSnap, rsvpSnap] = await Promise.all([
      adminFirestore.collection(GUESTS_COLLECTION).doc(guestUid).get(),
      adminFirestore.collection(RSVP_COLLECTION).doc(rsvpUid).get(),
    ]);

    if (!guestSnap.exists) {
      return NextResponse.json({ error: 'Invitado no encontrado' }, { status: 404 });
    }
    if (!rsvpSnap.exists) {
      return NextResponse.json({ error: 'Respuesta RSVP no encontrada' }, { status: 404 });
    }

    const updatePayload: Record<string, unknown> = {
      linkedGuestUid: guestUid,
      linkedAt: FieldValue.serverTimestamp(),
      linkedByAdminUid: auth.uid,
      linkSource: source,
      unlinkedAt: FieldValue.delete(),
      unlinkedByAdminUid: FieldValue.delete(),
    };

    if (notes !== undefined) {
      updatePayload.linkNotes = notes;
    } else {
      updatePayload.linkNotes = FieldValue.delete();
    }

    await adminFirestore.collection(RSVP_COLLECTION).doc(rsvpUid).update(updatePayload);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error linking RSVP to guest:', error);
    return NextResponse.json(
      { error: 'Error al enlazar la respuesta RSVP' },
      { status: 500 }
    );
  }
}
