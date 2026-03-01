import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/admin-api-auth';
import type { UpdateGuestInput } from '@/types/guest';

const GUESTS_COLLECTION = 'guests';
const RSVP_COLLECTION = 'rsvp_responses';
const SEATING_COLLECTION = 'seating';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const { uid } = await params;

  try {
    const body: UpdateGuestInput = await request.json();
    const docRef = adminFirestore.collection(GUESTS_COLLECTION).doc(uid);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json(
        { error: 'Invitado no encontrado' },
        { status: 404 }
      );
    }

    if (body.email) {
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

      const otherWithSameEmail = existingQuery.docs.find((d) => d.id !== uid);
      if (otherWithSameEmail) {
        return NextResponse.json(
          { error: 'Ya existe otro invitado con este email' },
          { status: 400 }
        );
      }
    }

    const { tableName, seatNumber, ...guestFields } = body;

    const updateData: Record<string, unknown> = {
      ...guestFields,
      updatedAt: new Date().toISOString(),
    };

    if (guestFields.email) {
      updateData.email = guestFields.email.trim().toLowerCase();
    }
    if (guestFields.fullName) {
      updateData.fullName = guestFields.fullName.trim();
    }

    // Remove undefined values
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) delete updateData[key];
    });

    await docRef.update(updateData);

    if (tableName !== undefined || seatNumber !== undefined) {
      const seatingRef = adminFirestore.collection(SEATING_COLLECTION).doc(uid);
      if (tableName || seatNumber) {
        await seatingRef.set(
          {
            tableName: tableName ?? '',
            seatNumber: seatNumber ?? 0,
          },
          { merge: true }
        );
      } else {
        await seatingRef.delete().catch(() => {});
      }
    }

    const updated = await docRef.get();
    return NextResponse.json({ ...updated.data(), uid });
  } catch (error) {
    console.error('Error updating guest:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el invitado' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const batch = adminFirestore.batch();
    batch.delete(docRef);
    batch.delete(adminFirestore.collection(SEATING_COLLECTION).doc(uid));
    batch.delete(adminFirestore.collection(RSVP_COLLECTION).doc(uid));

    await batch.commit();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting guest:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el invitado' },
      { status: 500 }
    );
  }
}
