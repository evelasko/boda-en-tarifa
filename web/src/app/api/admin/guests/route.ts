import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/admin-api-auth';
import { buildGuestRsvpLookup, resolveGuestRsvpStatus } from '@/lib/admin-guest-rsvp';
import { normalizeE164Phone, normalizeWhatsappNumber } from '@/lib/phone';
import type { Guest, GuestWithRSVP, CreateGuestInput } from '@/types/guest';

const GUESTS_COLLECTION = 'guests';
const RSVP_COLLECTION = 'rsvp_responses';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const side = searchParams.get('side');
    const rsvpStatus = searchParams.get('rsvpStatus');
    const profileClaimed = searchParams.get('profileClaimed');
    const search = searchParams.get('search')?.toLowerCase();

    const guestsSnap = await adminFirestore.collection(GUESTS_COLLECTION).get();
    const rsvpSnap = await adminFirestore.collection(RSVP_COLLECTION).get();

    const rsvpLookup = buildGuestRsvpLookup(rsvpSnap.docs);

    let guests: GuestWithRSVP[] = guestsSnap.docs.map((doc) => {
      const raw = doc.data();
      const createdAt = raw.createdAt?.toDate?.()
        ? raw.createdAt.toDate().toISOString()
        : (raw.createdAt ?? new Date().toISOString());
      const updatedAt = raw.updatedAt?.toDate?.()
        ? raw.updatedAt.toDate().toISOString()
        : (raw.updatedAt ?? new Date().toISOString());

      return {
        uid: doc.id,
        email: raw.email ?? '',
        fullName: raw.fullName ?? '',
        photoUrl: raw.photoUrl,
        phoneE164: raw.phoneE164,
        whatsappNumber: raw.whatsappNumber,
        funFact: raw.funFact,
        sheetNickname: raw.sheetNickname,
        age: raw.age,
        roomNumber: raw.roomNumber,
        relationToGrooms: raw.relationToGrooms ?? '',
        relationshipStatus: raw.relationshipStatus ?? 'soltero',
        side: raw.side ?? 'ambos',
        profileClaimed: raw.profileClaimed ?? false,
        isDirectoryVisible: raw.isDirectoryVisible ?? true,
        child: raw.child === true,
        connectedTo: raw.connectedTo,
        connectionType: raw.connectionType,
        contactPending: raw.contactPending === true,
        createdAt,
        updatedAt,
        rsvpStatus: resolveGuestRsvpStatus(doc.id, raw.email ?? '', rsvpLookup),
      } as GuestWithRSVP;
    });

    if (side) {
      guests = guests.filter((g) => g.side === side);
    }
    if (profileClaimed !== null && profileClaimed !== undefined && profileClaimed !== '') {
      guests = guests.filter((g) => g.profileClaimed === (profileClaimed === 'true'));
    }
    if (rsvpStatus) {
      guests = guests.filter((g) => g.rsvpStatus === rsvpStatus);
    }
    if (search) {
      guests = guests.filter(
        (g) =>
          g.fullName.toLowerCase().includes(search) ||
          g.email.toLowerCase().includes(search) ||
          (g.phoneE164 ?? '').toLowerCase().includes(search) ||
          (g.whatsappNumber ?? '').toLowerCase().includes(search)
      );
    }

    return NextResponse.json(guests);
  } catch (error) {
    console.error('Error fetching guests:', error);
    return NextResponse.json(
      { error: 'Error al obtener la lista de invitados' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const body: CreateGuestInput = await request.json();
    const isChild = Boolean(body.child);

    const side = body.side ?? (isChild ? 'ambos' : undefined);
    const relationToGrooms = body.relationToGrooms?.trim()
      ? body.relationToGrooms.trim()
      : isChild
        ? 'Menor'
        : '';
    const relationshipStatus = body.relationshipStatus ?? (isChild ? 'soltero' : undefined);

    if (!body.fullName?.trim() || !side || !relationToGrooms || !relationshipStatus) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios: fullName, side, relationToGrooms, relationshipStatus' },
        { status: 400 }
      );
    }

    const normalizedEmail = body.email?.trim() ? body.email.trim().toLowerCase() : '';
    const normalizedPhoneE164 = normalizeE164Phone(body.phoneE164);
    const normalizedWhatsapp = normalizeWhatsappNumber(body.whatsappNumber);

    const contactPending = !isChild && Boolean(body.contactPending);

    if (!isChild && !contactPending && !normalizedEmail && !normalizedPhoneE164 && !normalizedWhatsapp) {
      return NextResponse.json(
        { error: 'Debes proporcionar al menos un email o un teléfono válido, o marcar RSVP pendiente' },
        { status: 400 }
      );
    }

    if (normalizedEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(normalizedEmail)) {
        return NextResponse.json(
          { error: 'El formato del email no es válido' },
          { status: 400 }
        );
      }
      const existingQuery = await adminFirestore
        .collection(GUESTS_COLLECTION)
        .where('email', '==', normalizedEmail)
        .get();

      if (!existingQuery.empty) {
        return NextResponse.json(
          { error: 'Ya existe un invitado con este email' },
          { status: 400 }
        );
      }
    }

    const now = new Date().toISOString();
    const docRef = adminFirestore.collection(GUESTS_COLLECTION).doc();
    const guest: Omit<Guest, 'uid'> = {
      fullName: body.fullName.trim(),
      email: normalizedEmail,
      side,
      relationToGrooms,
      relationshipStatus,
      isDirectoryVisible: body.isDirectoryVisible ?? true,
      phoneE164: normalizedPhoneE164 ?? '',
      whatsappNumber: normalizedWhatsapp ?? '',
      profileClaimed: false,
      createdAt: now,
      updatedAt: now,
    };

    if (isChild) {
      guest.child = true;
    }
    if (body.connectedTo?.trim()) {
      guest.connectedTo = body.connectedTo.trim();
    }
    if (body.connectionType?.trim()) {
      guest.connectionType = body.connectionType.trim();
    }
    if (contactPending && !isChild) {
      guest.contactPending = true;
    }

    await docRef.set(guest);

    return NextResponse.json({ ...guest, uid: docRef.id }, { status: 201 });
  } catch (error) {
    console.error('Error creating guest:', error);
    return NextResponse.json(
      { error: 'Error al crear el invitado' },
      { status: 500 }
    );
  }
}
