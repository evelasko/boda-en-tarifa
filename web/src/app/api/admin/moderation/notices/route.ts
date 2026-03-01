import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/admin-api-auth';
import type { Notice } from '@/types/moderation';

const COLLECTION = 'notices';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const authorName = searchParams.get('authorName')?.toLowerCase();
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const snap = await adminFirestore
      .collection(COLLECTION)
      .orderBy('createdAt', 'desc')
      .get();

    let notices: Notice[] = snap.docs.map((doc) => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate?.()
        ? data.createdAt.toDate().toISOString()
        : (data.createdAt ?? new Date().toISOString());

      return {
        id: doc.id,
        authorUid: data.authorUid ?? '',
        authorName: data.authorName ?? '',
        authorPhotoUrl: data.authorPhotoUrl,
        body: data.body ?? '',
        authorWhatsappNumber: data.authorWhatsappNumber ?? '',
        isHidden: data.isHidden ?? false,
        createdAt,
      };
    });

    if (status === 'visible') {
      notices = notices.filter((n) => !n.isHidden);
    } else if (status === 'hidden') {
      notices = notices.filter((n) => n.isHidden);
    }

    if (authorName) {
      notices = notices.filter((n) => n.authorName.toLowerCase().includes(authorName));
    }

    if (dateFrom) {
      const from = new Date(dateFrom);
      notices = notices.filter((n) => new Date(n.createdAt) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      notices = notices.filter((n) => new Date(n.createdAt) <= to);
    }

    return NextResponse.json(notices);
  } catch (error) {
    console.error('Error fetching notices:', error);
    return NextResponse.json(
      { error: 'Error al obtener los anuncios' },
      { status: 500 }
    );
  }
}
