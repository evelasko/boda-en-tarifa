import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/admin-api-auth';
import { REMOTE_CONFIG_KEYS, CONFIG_COLLECTION } from '@/types/remote-config';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const exportData: Record<string, string> = {};

    for (const meta of REMOTE_CONFIG_KEYS) {
      const doc = await adminFirestore.collection(CONFIG_COLLECTION).doc(meta.key).get();
      const data = doc.data();
      exportData[meta.key] = data?.value ?? '';
    }

    return NextResponse.json(exportData);
  } catch (error) {
    console.error('Error exporting remote config:', error);
    return NextResponse.json(
      { error: 'Error al exportar la configuración remota' },
      { status: 500 }
    );
  }
}
