import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/admin-api-auth';
import { normalizeE164Phone } from '@/lib/phone';
import type { CSVGuestRow, Guest } from '@/types/guest';

const GUESTS_COLLECTION = 'guests';
const VALID_SIDES = ['novioA', 'novioB', 'ambos'];
const VALID_STATUSES = ['soltero', 'enPareja', 'buscando'];

interface ImportRow {
  row: number;
  data: CSVGuestRow;
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const body: { rows: ImportRow[] } = await request.json();

    if (!body.rows || !Array.isArray(body.rows) || body.rows.length === 0) {
      return NextResponse.json(
        { error: 'No se proporcionaron filas para importar' },
        { status: 400 }
      );
    }

    const existingSnap = await adminFirestore.collection(GUESTS_COLLECTION).get();
    const existingEmails = new Set(
      existingSnap.docs
        .map((d) => (d.data().email as string | undefined)?.toLowerCase())
        .filter((email): email is string => Boolean(email))
    );

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const created: string[] = [];
    const errors: Array<{ row: number; errors: string[] }> = [];
    const seenEmails = new Set<string>();

    const batch = adminFirestore.batch();
    let batchCount = 0;

    for (const { row, data } of body.rows) {
      const rowErrors: string[] = [];

      if (!data.fullName?.trim()) rowErrors.push('Nombre completo es obligatorio');
      const normalizedEmail = data.email?.trim() ? data.email.trim().toLowerCase() : '';
      const normalizedPhone = normalizeE164Phone(data.phoneE164);
      if (normalizedEmail && !emailRegex.test(normalizedEmail)) {
        rowErrors.push('Formato de email inválido');
      }
      if (!normalizedEmail && !normalizedPhone) {
        rowErrors.push('Debe incluir email o phoneE164 válido');
      }
      if (!data.side?.trim()) rowErrors.push('Lado es obligatorio');
      else if (!VALID_SIDES.includes(data.side.trim())) rowErrors.push(`Lado inválido: ${data.side}. Debe ser: ${VALID_SIDES.join(', ')}`);
      if (!data.relationToGrooms?.trim()) rowErrors.push('Relación con los novios es obligatorio');
      if (!data.relationshipStatus?.trim()) rowErrors.push('Estado sentimental es obligatorio');
      else if (!VALID_STATUSES.includes(data.relationshipStatus.trim())) rowErrors.push(`Estado inválido: ${data.relationshipStatus}. Debe ser: ${VALID_STATUSES.join(', ')}`);

      if (normalizedEmail && existingEmails.has(normalizedEmail)) {
        rowErrors.push(`Ya existe un invitado con email: ${normalizedEmail}`);
      }
      if (normalizedEmail && seenEmails.has(normalizedEmail)) {
        rowErrors.push(`Email duplicado en el CSV: ${normalizedEmail}`);
      }

      if (rowErrors.length > 0) {
        errors.push({ row, errors: rowErrors });
        continue;
      }

      if (normalizedEmail) {
        seenEmails.add(normalizedEmail);
      }
      const now = new Date().toISOString();
      const docRef = adminFirestore.collection(GUESTS_COLLECTION).doc();
      const guest: Omit<Guest, 'uid'> = {
        fullName: data.fullName.trim(),
        email: normalizedEmail,
        phoneE164: normalizedPhone ?? '',
        side: data.side.trim() as Guest['side'],
        relationToGrooms: data.relationToGrooms.trim(),
        relationshipStatus: data.relationshipStatus.trim() as Guest['relationshipStatus'],
        isDirectoryVisible: true,
        profileClaimed: false,
        createdAt: now,
        updatedAt: now,
      };

      batch.set(docRef, guest);
      created.push(docRef.id);
      batchCount++;

      // Firestore batches are limited to 500 writes
      if (batchCount >= 450) break;
    }

    if (batchCount > 0) {
      await batch.commit();
    }

    return NextResponse.json({
      created: created.length,
      skipped: errors.length,
      errors,
    });
  } catch (error) {
    console.error('Error importing guests:', error);
    return NextResponse.json(
      { error: 'Error al importar invitados' },
      { status: 500 }
    );
  }
}
