import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/admin-api-auth';
import { FieldValue } from 'firebase-admin/firestore';
import { REMOTE_CONFIG_KEYS, CONFIG_COLLECTION } from '@/types/remote-config';
import type { RemoteConfigEntry } from '@/types/remote-config';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const { key } = await params;
  const meta = REMOTE_CONFIG_KEYS.find((k) => k.key === key);

  if (!meta) {
    return NextResponse.json(
      { error: `Clave de configuración no encontrada: ${key}` },
      { status: 404 }
    );
  }

  try {
    const doc = await adminFirestore.collection(CONFIG_COLLECTION).doc(key).get();
    const data = doc.data();

    const updatedAt = data?.updatedAt?.toDate?.()
      ? data.updatedAt.toDate().toISOString()
      : (data?.updatedAt ?? null);

    const entry: RemoteConfigEntry = {
      key: meta.key,
      type: meta.type,
      description: meta.description,
      value: data?.value ?? '',
      updatedAt,
      updatedBy: data?.updatedBy ?? null,
      sourcePage: meta.sourcePage,
      sourceLabel: meta.sourceLabel,
    };

    return NextResponse.json(entry);
  } catch (error) {
    console.error(`Error fetching config key ${key}:`, error);
    return NextResponse.json(
      { error: 'Error al obtener el valor de configuración' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const { key } = await params;
  const meta = REMOTE_CONFIG_KEYS.find((k) => k.key === key);

  if (!meta) {
    return NextResponse.json(
      { error: `Clave de configuración no encontrada: ${key}` },
      { status: 404 }
    );
  }

  try {
    const body = await request.json();
    const { value } = body;

    if (typeof value !== 'string') {
      return NextResponse.json(
        { error: 'El campo "value" es obligatorio y debe ser una cadena de texto' },
        { status: 400 }
      );
    }

    if (meta.type === 'json' && value.trim() !== '') {
      try {
        JSON.parse(value);
      } catch {
        return NextResponse.json(
          { error: 'El valor no es un JSON válido' },
          { status: 400 }
        );
      }
    }

    if (meta.key === 'development_trigger_time' && value.trim() !== '') {
      const parsed = Date.parse(value);
      if (isNaN(parsed)) {
        return NextResponse.json(
          { error: 'El valor debe ser una fecha ISO 8601 válida' },
          { status: 400 }
        );
      }
    }

    await adminFirestore.collection(CONFIG_COLLECTION).doc(key).set(
      {
        value,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: auth.email,
      },
      { merge: true }
    );

    const doc = await adminFirestore.collection(CONFIG_COLLECTION).doc(key).get();
    const data = doc.data();

    const updatedAt = data?.updatedAt?.toDate?.()
      ? data.updatedAt.toDate().toISOString()
      : new Date().toISOString();

    const entry: RemoteConfigEntry = {
      key: meta.key,
      type: meta.type,
      description: meta.description,
      value: data?.value ?? value,
      updatedAt,
      updatedBy: data?.updatedBy ?? auth.email,
      sourcePage: meta.sourcePage,
      sourceLabel: meta.sourceLabel,
    };

    return NextResponse.json(entry);
  } catch (error) {
    console.error(`Error updating config key ${key}:`, error);
    return NextResponse.json(
      { error: 'Error al actualizar el valor de configuración' },
      { status: 500 }
    );
  }
}
