import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/admin-api-auth';
import { FieldValue } from 'firebase-admin/firestore';

const COLLECTION = 'time_gated_content';
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? 'bodaentarifa';
const CLOUDINARY_UPLOAD_PRESET = 'wedding_upload';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;

  if (id !== 'seating-reveal') {
    return NextResponse.json(
      { error: 'La carga de imágenes solo está disponible para seating-reveal' },
      { status: 400 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó un archivo' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'El archivo es demasiado grande (máximo 10 MB)' },
        { status: 400 }
      );
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no soportado. Use JPG, PNG o WebP.' },
        { status: 400 }
      );
    }

    // Upload to Cloudinary (unsigned)
    const cloudinaryForm = new FormData();
    cloudinaryForm.append('file', file);
    cloudinaryForm.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    cloudinaryForm.append('folder', 'time-gated/seating');

    const cloudinaryRes = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: 'POST', body: cloudinaryForm }
    );

    if (!cloudinaryRes.ok) {
      const err = await cloudinaryRes.text();
      console.error('Cloudinary upload error:', err);
      return NextResponse.json(
        { error: 'Error al subir la imagen a Cloudinary' },
        { status: 502 }
      );
    }

    const cloudinaryData = await cloudinaryRes.json();
    const publicId: string = cloudinaryData.public_id;

    // Update Firestore payload
    await adminFirestore.doc(`${COLLECTION}/${id}`).update({
      'payload.imagePublicId': publicId,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ publicId });
  } catch (error) {
    console.error(`Error uploading media for ${id}:`, error);
    return NextResponse.json(
      { error: 'Error al subir el contenido multimedia' },
      { status: 500 }
    );
  }
}
