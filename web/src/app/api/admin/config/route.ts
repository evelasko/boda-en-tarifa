import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/admin-api-auth';
import { REMOTE_CONFIG_KEYS, CONFIG_COLLECTION } from '@/types/remote-config';
import type { RemoteConfigEntry } from '@/types/remote-config';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const entries: RemoteConfigEntry[] = [];

    for (const meta of REMOTE_CONFIG_KEYS) {
      const docRef = adminFirestore.collection(CONFIG_COLLECTION).doc(meta.key);
      const doc = await docRef.get();
      const data = doc.data();

      const updatedAt = data?.updatedAt?.toDate?.()
        ? data.updatedAt.toDate().toISOString()
        : (data?.updatedAt ?? null);

      entries.push({
        key: meta.key,
        type: meta.type,
        description: meta.description,
        value: data?.value ?? '',
        updatedAt,
        updatedBy: data?.updatedBy ?? null,
        sourcePage: meta.sourcePage,
        sourceLabel: meta.sourceLabel,
      });
    }

    return NextResponse.json(entries);
  } catch (error) {
    console.error('Error fetching remote config:', error);
    return NextResponse.json(
      { error: 'Error al obtener la configuración remota' },
      { status: 500 }
    );
  }
}
