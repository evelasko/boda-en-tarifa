import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-api-auth';
import { buildSeatingRenderPayload } from '@/lib/seating-render';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const payload = await buildSeatingRenderPayload();
    if (!payload) {
      return NextResponse.json(
        { error: 'Layout no inicializado', code: 'not_seeded' },
        { status: 404, headers: { 'Cache-Control': 'no-store' } },
      );
    }
    return NextResponse.json(payload, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('GET /api/admin/seating/render failed:', error);
    return NextResponse.json(
      { error: 'Error al construir el plano' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
