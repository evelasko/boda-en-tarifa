import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/admin-api-auth';
import type { Guest, GuestWithRSVP, CreateGuestInput } from '@/types/guest';
import type { AttendanceStatus } from '@/types/rsvp';

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

    const rsvpMap = new Map<string, AttendanceStatus>();
    rsvpSnap.docs.forEach((doc) => {
      const data = doc.data();
      if (data.responses?.attendance) {
        rsvpMap.set(doc.id, data.responses.attendance);
      }
    });

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
        whatsappNumber: raw.whatsappNumber,
        funFact: raw.funFact,
        relationToGrooms: raw.relationToGrooms ?? '',
        relationshipStatus: raw.relationshipStatus ?? 'soltero',
        side: raw.side ?? 'ambos',
        profileClaimed: raw.profileClaimed ?? false,
        isDirectoryVisible: raw.isDirectoryVisible ?? true,
        createdAt,
        updatedAt,
        rsvpStatus: rsvpMap.get(doc.id) ?? 'no_response',
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
          g.email.toLowerCase().includes(search)
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

    if (!body.fullName?.trim() || !body.email?.trim() || !body.side || !body.relationToGrooms?.trim() || !body.relationshipStatus) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios: fullName, email, side, relationToGrooms, relationshipStatus' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'El formato del email no es válido' },
        { status: 400 }
      );
    }

    const existingQuery = await adminFirestore
      .collection(GUESTS_COLLECTION)
      .where('email', '==', body.email.trim().toLowerCase())
      .get();

    if (!existingQuery.empty) {
      return NextResponse.json(
        { error: 'Ya existe un invitado con este email' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const docRef = adminFirestore.collection(GUESTS_COLLECTION).doc();
    const guest: Omit<Guest, 'uid'> = {
      fullName: body.fullName.trim(),
      email: body.email.trim().toLowerCase(),
      side: body.side,
      relationToGrooms: body.relationToGrooms.trim(),
      relationshipStatus: body.relationshipStatus,
      isDirectoryVisible: body.isDirectoryVisible ?? true,
      whatsappNumber: body.whatsappNumber?.trim() || '',
      profileClaimed: false,
      createdAt: now,
      updatedAt: now,
    };

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
