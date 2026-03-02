import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/admin-api-auth';

const DOC_PATH = 'config/recommendations';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const doc = await adminFirestore.doc(DOC_PATH).get();
    const items = doc.exists ? (doc.data()!.items ?? []) : [];

    // Strip any internal fields — output only the fields the Flutter app expects
    const clean = items.map((r: Record<string, unknown>) => {
      const entry: Record<string, unknown> = {
        name: r.name,
        description: r.description,
      };
      if (r.category) entry.category = r.category;
      if (r.mapUrl) entry.mapUrl = r.mapUrl;
      if (r.imageUrl) entry.imageUrl = r.imageUrl;
      return entry;
    });

    const json = JSON.stringify(clean, null, 2);

    return new NextResponse(json, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="recommendations.json"',
      },
    });
  } catch (error) {
    console.error('Error downloading recommendations:', error);
    return NextResponse.json(
      { error: 'Error al descargar las recomendaciones' },
      { status: 500 }
    );
  }
}
