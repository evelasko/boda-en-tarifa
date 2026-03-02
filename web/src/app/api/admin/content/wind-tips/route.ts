import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/admin-api-auth';
import { FieldValue } from 'firebase-admin/firestore';

const DOC_PATH = 'config/wind_tips';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const doc = await adminFirestore.doc(DOC_PATH).get();
    if (!doc.exists) {
      return NextResponse.json({ levante: [], poniente: [], other: [] });
    }
    const data = doc.data()!;
    return NextResponse.json({
      levante: data.levante ?? [],
      poniente: data.poniente ?? [],
      other: data.other ?? [],
    });
  } catch (error) {
    console.error('Error fetching wind tips:', error);
    return NextResponse.json(
      { error: 'Error al obtener los consejos de viento' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const levante: string[] = body.levante ?? [];
    const poniente: string[] = body.poniente ?? [];
    const other: string[] = body.other ?? [];

    for (const tips of [levante, poniente, other]) {
      if (!Array.isArray(tips) || tips.some((t) => typeof t !== 'string' || !t.trim())) {
        return NextResponse.json(
          { error: 'Cada consejo debe ser un texto no vacío' },
          { status: 400 }
        );
      }
    }

    await adminFirestore.doc(DOC_PATH).set({
      levante,
      poniente,
      other,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ levante, poniente, other });
  } catch (error) {
    console.error('Error saving wind tips:', error);
    return NextResponse.json(
      { error: 'Error al guardar los consejos de viento' },
      { status: 500 }
    );
  }
}
