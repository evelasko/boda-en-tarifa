import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminFirestore } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/admin-api-auth';
import {
  buildAdminRsvpResponsePatch,
  validateAdminRsvpEditablePatch,
  type AdminRsvpEditableResponses,
} from '@/lib/admin-rsvp-update';
import type { MainCoursePreference } from '@/types/rsvp';

const RSVP_COLLECTION = 'rsvp_responses';

const MAIN_COURSE_VALUES: MainCoursePreference[] = ['fish', 'meat', 'vegetarian'];

type PatchBody = {
  responses?: Partial<AdminRsvpEditableResponses>;
};

function parsePatchBody(body: PatchBody): AdminRsvpEditableResponses | null {
  const raw = body.responses;
  if (!raw || typeof raw !== 'object') return null;

  const main =
    typeof raw.mainCoursePreference === 'string' &&
    MAIN_COURSE_VALUES.includes(raw.mainCoursePreference as MainCoursePreference)
      ? (raw.mainCoursePreference as MainCoursePreference)
      : null;

  if (!main) return null;

  const patch: AdminRsvpEditableResponses = { mainCoursePreference: main };

  if ('dietaryRestrictions' in raw) {
    if (raw.dietaryRestrictions === null) {
      patch.dietaryRestrictions = null;
    } else if (typeof raw.dietaryRestrictions === 'string') {
      patch.dietaryRestrictions = raw.dietaryRestrictions;
    }
  }

  if (typeof raw.roomSharing === 'string') {
    patch.roomSharing = raw.roomSharing;
  }

  if (typeof raw.sundayBrunch === 'boolean') {
    patch.sundayBrunch = raw.sundayBrunch;
  }

  return patch;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ rsvpUid: string }> }
) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const { rsvpUid: rawUid } = await params;
  const rsvpUid = rawUid.trim();
  if (!rsvpUid) {
    return NextResponse.json({ error: 'UID de respuesta RSVP inválido' }, { status: 400 });
  }

  try {
    const body = (await request.json()) as PatchBody;
    const patch = parsePatchBody(body);
    if (!patch) {
      return NextResponse.json(
        { error: 'Cuerpo de solicitud inválido' },
        { status: 400 }
      );
    }

    const fieldErrors = validateAdminRsvpEditablePatch(patch);
    if (Object.keys(fieldErrors).length > 0) {
      return NextResponse.json(
        { error: 'Hay campos obligatorios sin completar', fieldErrors },
        { status: 400 }
      );
    }

    const ref = adminFirestore.collection(RSVP_COLLECTION).doc(rsvpUid);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Respuesta RSVP no encontrada' }, { status: 404 });
    }

    const data = snap.data() ?? {};
    const existingResponses =
      data.responses && typeof data.responses === 'object'
        ? (data.responses as Record<string, unknown>)
        : {};

    const mergedResponses = buildAdminRsvpResponsePatch(existingResponses, patch);
    const version = typeof data.version === 'number' ? data.version : 0;

    await ref.update({
      responses: mergedResponses,
      lastUpdatedAt: FieldValue.serverTimestamp(),
      version: version + 1,
    });

    const dietary =
      typeof mergedResponses.dietaryRestrictions === 'string'
        ? mergedResponses.dietaryRestrictions
        : '';

    return NextResponse.json({
      ok: true,
      rsvpUid,
      responses: {
        mainCoursePreference: mergedResponses.mainCoursePreference,
        dietaryRestrictions: dietary,
        roomSharing:
          typeof mergedResponses.roomSharing === 'string' ? mergedResponses.roomSharing : '',
        sundayBrunch:
          typeof mergedResponses.sundayBrunch === 'boolean' ? mergedResponses.sundayBrunch : null,
      },
    });
  } catch (error) {
    console.error('Error updating RSVP response for admin:', error);
    return NextResponse.json(
      { error: 'Error al actualizar la respuesta RSVP' },
      { status: 500 }
    );
  }
}
