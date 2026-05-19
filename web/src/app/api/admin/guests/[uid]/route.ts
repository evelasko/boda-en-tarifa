import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminFirestore } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/admin-api-auth';
import { normalizeE164Phone, normalizeWhatsappNumber } from '@/lib/phone';
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

    if (body.email?.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const normalizedEmail = body.email.trim().toLowerCase();
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

    if (guestFields.email !== undefined) {
      updateData.email = guestFields.email.trim().toLowerCase();
    }
    if (guestFields.fullName) {
      updateData.fullName = guestFields.fullName.trim();
    }
    if (guestFields.preferredName !== undefined) {
      const trimmed = guestFields.preferredName.trim();
      updateData.preferredName = trimmed ? trimmed : FieldValue.delete();
    }
    if (guestFields.phoneE164 !== undefined) {
      const normalized = normalizeE164Phone(guestFields.phoneE164);
      if (guestFields.phoneE164 && !normalized) {
        return NextResponse.json(
          { error: 'El teléfono debe estar en formato internacional válido' },
          { status: 400 }
        );
      }
      updateData.phoneE164 = normalized ?? '';
    }
    if (guestFields.whatsappNumber !== undefined) {
      const normalized = normalizeWhatsappNumber(guestFields.whatsappNumber);
      if (guestFields.whatsappNumber && !normalized) {
        return NextResponse.json(
          { error: 'El WhatsApp debe ser un número internacional válido' },
          { status: 400 }
        );
      }
      updateData.whatsappNumber = normalized ?? '';
    }

    const prev = docSnap.data()!;
    const mergedEmail =
      guestFields.email !== undefined
        ? String(guestFields.email).trim().toLowerCase()
        : String(prev.email ?? '').trim().toLowerCase();
    const mergedPhone =
      guestFields.phoneE164 !== undefined
        ? normalizeE164Phone(guestFields.phoneE164) ?? ''
        : String(prev.phoneE164 ?? '').trim();
    const mergedWa =
      guestFields.whatsappNumber !== undefined
        ? normalizeWhatsappNumber(guestFields.whatsappNumber) ?? ''
        : String(prev.whatsappNumber ?? '').trim();
    const hasContact = Boolean(mergedEmail || mergedPhone || mergedWa);
    if (hasContact) {
      updateData.contactPending = false;
    } else if (guestFields.contactPending !== undefined) {
      updateData.contactPending = guestFields.contactPending;
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
