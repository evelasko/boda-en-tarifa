import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-api-auth';
import {
  readSeatingLayout,
  writeSeatingLayout,
  seedSeatingLayoutIfMissing,
} from '@/lib/seating-layout-server';
import { SeatingLayoutValidationError } from '@/lib/seating-layout';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const layout = await readSeatingLayout();
    if (!layout) {
      return NextResponse.json(
        { error: 'Layout no inicializado', code: 'not_seeded' },
        { status: 404 },
      );
    }
    return NextResponse.json(layout);
  } catch (error) {
    console.error('GET /api/admin/seating/layout failed:', error);
    return NextResponse.json(
      { error: 'Error al leer el plano de mesas' },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const written = await writeSeatingLayout(body, auth.uid);
    return NextResponse.json(written);
  } catch (error) {
    if (error instanceof SeatingLayoutValidationError) {
      return NextResponse.json(
        { error: error.message, details: error.details },
        { status: 400 },
      );
    }
    console.error('PUT /api/admin/seating/layout failed:', error);
    return NextResponse.json(
      { error: 'Error al guardar el plano de mesas' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const { created, layout } = await seedSeatingLayoutIfMissing(auth.uid);
    return NextResponse.json(layout, { status: created ? 201 : 200 });
  } catch (error) {
    console.error('POST /api/admin/seating/layout failed:', error);
    return NextResponse.json(
      { error: 'Error al inicializar el plano de mesas' },
      { status: 500 },
    );
  }
}
