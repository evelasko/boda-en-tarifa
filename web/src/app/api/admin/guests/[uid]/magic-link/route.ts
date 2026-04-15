import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminFirestore } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/admin-api-auth';
import { normalizeE164Phone, normalizeWhatsappNumber } from '@/lib/phone';
import { randomUUID } from 'crypto';

const GUESTS_COLLECTION = 'guests';
const MAGIC_LINK_ISSUES_COLLECTION = 'magic_link_issues';

function parseIntEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isNaN(parsed) || parsed <= 0 ? fallback : parsed;
}

function parseBoolEnv(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (!raw) return fallback;
  return raw === '1' || raw.toLowerCase() === 'true';
}

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
    const now = Date.now();
    const issuedAt = new Date(now).toISOString();
    const ttlMinutes = parseIntEnv('MAGIC_LINK_TTL_MINUTES', 60);
    const expiresAt = new Date(now + ttlMinutes * 60 * 1000).toISOString();
    const linkId = randomUUID();
    const revokePrevious = parseBoolEnv('MAGIC_LINK_REVOKE_PREVIOUS_ENABLED', true);
    const rateLimitWindowMinutes = parseIntEnv('MAGIC_LINK_RATE_LIMIT_WINDOW_MINUTES', 10);
    const rateLimitPerGuest = parseIntEnv('MAGIC_LINK_RATE_LIMIT_PER_GUEST', 5);
    const rateLimitPerAdmin = parseIntEnv('MAGIC_LINK_RATE_LIMIT_PER_ADMIN', 20);
    const threshold = new Date(now - rateLimitWindowMinutes * 60 * 1000).toISOString();

    const [recentGuestIssues, recentAdminIssues] = await Promise.all([
      adminFirestore
        .collection(MAGIC_LINK_ISSUES_COLLECTION)
        .where('guestUid', '==', uid)
        .where('issuedAt', '>=', threshold)
        .count()
        .get(),
      adminFirestore
        .collection(MAGIC_LINK_ISSUES_COLLECTION)
        .where('issuedBy', '==', auth.uid)
        .where('issuedAt', '>=', threshold)
        .count()
        .get(),
    ]);

    if (recentGuestIssues.data().count >= rateLimitPerGuest) {
      return NextResponse.json(
        { error: 'Se alcanzó el límite de generación para este invitado' },
        { status: 429 }
      );
    }
    if (recentAdminIssues.data().count >= rateLimitPerAdmin) {
      return NextResponse.json(
        { error: 'Se alcanzó el límite de generación para este administrador' },
        { status: 429 }
      );
    }

    const customToken = await adminAuth.createCustomToken(uid, { magicLinkId: linkId });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bodaentarifa.com';
    const magicLinkUrl = `${baseUrl}/login?token=${customToken}`;
    const phoneE164 = normalizeE164Phone((guest.phoneE164 as string | undefined) ?? '') ?? '';
    const whatsappNumber =
      normalizeWhatsappNumber((guest.whatsappNumber as string | undefined) ?? '') ?? '';
    const inviteMessage =
      `Hola ${guest.fullName ?? 'invitado/a'}, abre tu invitacion aqui: ${magicLinkUrl}`;
    const whatsappShareUrl = whatsappNumber
      ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(inviteMessage)}`
      : null;
    const smsShareUrl = phoneE164
      ? `sms:${phoneE164}?body=${encodeURIComponent(inviteMessage)}`
      : null;

    if (revokePrevious) {
      const activeSnapshot = await adminFirestore
        .collection(MAGIC_LINK_ISSUES_COLLECTION)
        .where('guestUid', '==', uid)
        .where('usedAt', '==', null)
        .where('revokedAt', '==', null)
        .get();
      if (!activeSnapshot.empty) {
        const batch = adminFirestore.batch();
        activeSnapshot.docs.forEach((active) => {
          batch.update(active.ref, {
            revokedAt: issuedAt,
            revokedReason: 'superseded',
          });
        });
        await batch.commit();
      }
    }

    await adminFirestore.collection(MAGIC_LINK_ISSUES_COLLECTION).doc(linkId).set({
      guestUid: uid,
      issuedBy: auth.uid,
      issuedAt,
      expiresAt,
      usedAt: null,
      revokedAt: null,
      revokedReason: null,
      singleUse: parseBoolEnv('MAGIC_LINK_SINGLE_USE_ENABLED', false),
      metadata: { guestName: guest.fullName ?? '' },
    });

    return NextResponse.json({
      magicLinkUrl,
      issuedAt,
      expiresAt,
      linkId,
      guestName: guest.fullName,
      guestEmail: guest.email,
      guestPhoneE164: phoneE164 || null,
      guestWhatsappNumber: whatsappNumber || null,
      whatsappShareUrl,
      smsShareUrl,
    });
  } catch (error) {
    console.error('Error generating magic link:', error);
    return NextResponse.json(
      { error: 'Error al generar el magic link' },
      { status: 500 }
    );
  }
}
