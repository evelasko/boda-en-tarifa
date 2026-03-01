import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/admin-api-auth';
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
      existingSnap.docs.map((d) => (d.data().email as string)?.toLowerCase())
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
      if (!data.email?.trim()) rowErrors.push('Email es obligatorio');
      else if (!emailRegex.test(data.email.trim())) rowErrors.push('Formato de email inválido');
      if (!data.side?.trim()) rowErrors.push('Lado es obligatorio');
      else if (!VALID_SIDES.includes(data.side.trim())) rowErrors.push(`Lado inválido: ${data.side}. Debe ser: ${VALID_SIDES.join(', ')}`);
      if (!data.relationToGrooms?.trim()) rowErrors.push('Relación con los novios es obligatorio');
      if (!data.relationshipStatus?.trim()) rowErrors.push('Estado sentimental es obligatorio');
      else if (!VALID_STATUSES.includes(data.relationshipStatus.trim())) rowErrors.push(`Estado inválido: ${data.relationshipStatus}. Debe ser: ${VALID_STATUSES.join(', ')}`);

      const email = data.email?.trim().toLowerCase();
      if (email && existingEmails.has(email)) {
        rowErrors.push(`Ya existe un invitado con email: ${email}`);
      }
      if (email && seenEmails.has(email)) {
        rowErrors.push(`Email duplicado en el CSV: ${email}`);
      }

      if (rowErrors.length > 0) {
        errors.push({ row, errors: rowErrors });
        continue;
      }

      seenEmails.add(email);
      const now = new Date().toISOString();
      const docRef = adminFirestore.collection(GUESTS_COLLECTION).doc();
      const guest: Omit<Guest, 'uid'> = {
        fullName: data.fullName.trim(),
        email,
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
