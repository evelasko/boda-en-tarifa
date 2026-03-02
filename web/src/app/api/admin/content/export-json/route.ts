import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/admin-api-auth';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const [venuesDoc, contactsDoc, tipsDoc, recsDoc] = await Promise.all([
      adminFirestore.doc('config/venues').get(),
      adminFirestore.doc('config/quick_contacts').get(),
      adminFirestore.doc('config/wind_tips').get(),
      adminFirestore.doc('config/recommendations').get(),
    ]);

    const venues = venuesDoc.exists ? (venuesDoc.data()!.items ?? []) : [];
    const contacts = contactsDoc.exists
      ? { taxis: contactsDoc.data()!.taxis ?? [], coordinators: contactsDoc.data()!.coordinators ?? [] }
      : { taxis: [], coordinators: [] };
    const tips = tipsDoc.exists
      ? { levante: tipsDoc.data()!.levante ?? [], poniente: tipsDoc.data()!.poniente ?? [], other: tipsDoc.data()!.other ?? [] }
      : { levante: [], poniente: [], other: [] };
    const recs = recsDoc.exists ? (recsDoc.data()!.items ?? []) : [];

    const exportData = {
      remoteConfig: {
        venues_json: JSON.stringify(venues),
        quick_contacts_json: JSON.stringify(contacts),
        wind_tips_json: JSON.stringify(tips),
      },
      bundledAssets: {
        'recommendations.json': recs,
      },
      exportedAt: new Date().toISOString(),
    };

    const dateStr = new Date().toISOString().slice(0, 10);
    const json = JSON.stringify(exportData, null, 2);

    return new NextResponse(json, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="content-export-${dateStr}.json"`,
      },
    });
  } catch (error) {
    console.error('Error exporting content:', error);
    return NextResponse.json(
      { error: 'Error al exportar el contenido' },
      { status: 500 }
    );
  }
}
