import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/admin-api-auth';
import type { FeedPost, FeedPostSource } from '@/types/moderation';

const COLLECTION = 'feed_posts';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const source = searchParams.get('source') as FeedPostSource | null;
    const authorName = searchParams.get('authorName')?.toLowerCase();
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const snap = await adminFirestore
      .collection(COLLECTION)
      .orderBy('createdAt', 'desc')
      .get();

    let posts: FeedPost[] = snap.docs.map((doc) => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate?.()
        ? data.createdAt.toDate().toISOString()
        : (data.createdAt ?? new Date().toISOString());

      return {
        id: doc.id,
        authorUid: data.authorUid ?? '',
        authorName: data.authorName ?? '',
        authorPhotoUrl: data.authorPhotoUrl,
        imageUrls: data.imageUrls ?? [],
        caption: data.caption,
        source: data.source ?? 'unfiltered',
        isHidden: data.isHidden ?? false,
        createdAt,
      };
    });

    if (status === 'visible') {
      posts = posts.filter((p) => !p.isHidden);
    } else if (status === 'hidden') {
      posts = posts.filter((p) => p.isHidden);
    }

    if (source) {
      posts = posts.filter((p) => p.source === source);
    }

    if (authorName) {
      posts = posts.filter((p) => p.authorName.toLowerCase().includes(authorName));
    }

    if (dateFrom) {
      const from = new Date(dateFrom);
      posts = posts.filter((p) => new Date(p.createdAt) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      posts = posts.filter((p) => new Date(p.createdAt) <= to);
    }

    return NextResponse.json(posts);
  } catch (error) {
    console.error('Error fetching feed posts:', error);
    return NextResponse.json(
      { error: 'Error al obtener las publicaciones' },
      { status: 500 }
    );
  }
}
