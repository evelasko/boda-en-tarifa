import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/admin-api-auth';
import {
  buildManualRsvpDocument,
  guestHasExistingRsvp,
  type ExistingRsvpConflict,
} from '@/lib/admin-manual-rsvp';
import { RSVPValidation, cleanRSVPResponse } from '@/lib/rsvp-validation';
import type { Guest } from '@/types/guest';
import type { RSVPResponse } from '@/types/rsvp';

const GUESTS_COLLECTION = 'guests';
const RSVP_COLLECTION = 'rsvp_responses';

type CreateManualRsvpBody = {
  responses?: Partial<RSVPResponse>;
  proxySourceRsvpUid?: string;
  notes?: string;
};

function normalizeBody(body: CreateManualRsvpBody): {
  responses: Partial<RSVPResponse>;
  proxySourceRsvpUid?: string;
  notes?: string;
} {
  const cleaned = cleanRSVPResponse(body.responses ?? {});
  const notes =
    typeof body.notes === 'string' && body.notes.trim() ? body.notes.trim() : undefined;
  const proxySourceRsvpUid =
    typeof body.proxySourceRsvpUid === 'string' && body.proxySourceRsvpUid.trim()
      ? body.proxySourceRsvpUid.trim()
      : undefined;
  return { responses: cleaned, notes, proxySourceRsvpUid };
}

function conflictMessage(kind: ExistingRsvpConflict): string {
  if (kind === 'doc') return 'Este invitado ya tiene una respuesta RSVP manual';
  return 'Este invitado ya está enlazado a otra respuesta RSVP';
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const { uid } = await params;
  const guestUid = uid.trim();
  if (!guestUid) {
    return NextResponse.json({ error: 'UID de invitado inválido' }, { status: 400 });
  }

  try {
    const rawBody = (await request.json()) as CreateManualRsvpBody;
    const body = normalizeBody(rawBody);
    const fieldErrors = RSVPValidation.validateResponse(body.responses);
    if (Object.keys(fieldErrors).length > 0) {
      return NextResponse.json(
        {
          error: 'Hay campos obligatorios sin completar',
          fieldErrors,
        },
        { status: 400 }
      );
    }

    const guestRef = adminFirestore.collection(GUESTS_COLLECTION).doc(guestUid);
    const guestSnap = await guestRef.get();
    if (!guestSnap.exists) {
      return NextResponse.json({ error: 'Invitado no encontrado' }, { status: 404 });
    }

    const existing = await guestHasExistingRsvp(guestUid);
    if (existing) {
      return NextResponse.json(
        { error: conflictMessage(existing), conflict: existing },
        { status: 409 }
      );
    }

    const guest = { uid: guestUid, ...(guestSnap.data() ?? {}) } as Guest;
    const manualDoc = buildManualRsvpDocument(guestUid, guest, body.responses, auth.uid, {
      notes: body.notes,
      proxySourceRsvpUid: body.proxySourceRsvpUid,
    });

    await adminFirestore.collection(RSVP_COLLECTION).doc(guestUid).set(manualDoc);
    return NextResponse.json({ ok: true, guestUid, rsvpUid: guestUid }, { status: 201 });
  } catch (error) {
    console.error('Error creating manual RSVP:', error);
    return NextResponse.json(
      { error: 'Error al guardar el RSVP manual' },
      { status: 500 }
    );
  }
}
