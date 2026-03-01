import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/admin-api-auth';
import type { Guest } from '@/types/guest';
import type { AttendanceStatus } from '@/types/rsvp';

const GUESTS_COLLECTION = 'guests';
const RSVP_COLLECTION = 'rsvp_responses';
const SEATING_COLLECTION = 'seating';

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const side = searchParams.get('side');
    const rsvpStatus = searchParams.get('rsvpStatus');
    const profileClaimed = searchParams.get('profileClaimed');
    const search = searchParams.get('search')?.toLowerCase();

    const [guestsSnap, rsvpSnap, seatingSnap] = await Promise.all([
      adminFirestore.collection(GUESTS_COLLECTION).get(),
      adminFirestore.collection(RSVP_COLLECTION).get(),
      adminFirestore.collection(SEATING_COLLECTION).get(),
    ]);

    const rsvpMap = new Map<string, AttendanceStatus>();
    rsvpSnap.docs.forEach((doc) => {
      const data = doc.data();
      if (data.responses?.attendance) {
        rsvpMap.set(doc.id, data.responses.attendance);
      }
    });

    const seatingMap = new Map<string, { tableName: string; seatNumber: number }>();
    seatingSnap.docs.forEach((doc) => {
      seatingMap.set(doc.id, doc.data() as { tableName: string; seatNumber: number });
    });

    let guests = guestsSnap.docs.map((doc) => {
      const data = doc.data() as Omit<Guest, 'uid'>;
      return {
        ...data,
        uid: doc.id,
        rsvpStatus: rsvpMap.get(doc.id) ?? 'no_response',
        seating: seatingMap.get(doc.id),
      };
    });

    if (side) guests = guests.filter((g) => g.side === side);
    if (profileClaimed !== null && profileClaimed !== undefined && profileClaimed !== '') {
      guests = guests.filter((g) => g.profileClaimed === (profileClaimed === 'true'));
    }
    if (rsvpStatus) guests = guests.filter((g) => g.rsvpStatus === rsvpStatus);
    if (search) {
      guests = guests.filter(
        (g) => g.fullName.toLowerCase().includes(search) || g.email.toLowerCase().includes(search)
      );
    }

    const headers = [
      'UID', 'Nombre Completo', 'Email', 'Lado', 'Relación con Novios',
      'Estado Sentimental', 'Perfil Reclamado', 'Visible en Directorio',
      'WhatsApp', 'Estado RSVP', 'Mesa', 'Asiento',
    ];

    const rows = guests.map((g) => [
      g.uid,
      escapeCSV(g.fullName),
      escapeCSV(g.email),
      g.side,
      escapeCSV(g.relationToGrooms),
      g.relationshipStatus,
      g.profileClaimed ? 'Sí' : 'No',
      g.isDirectoryVisible ? 'Sí' : 'No',
      g.whatsappNumber || '',
      g.rsvpStatus,
      g.seating?.tableName || '',
      g.seating?.seatNumber?.toString() || '',
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="invitados-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exporting guests:', error);
    return NextResponse.json(
      { error: 'Error al exportar invitados' },
      { status: 500 }
    );
  }
}
