import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/admin-api-auth';
import type { ModerationStats, FeedPostSource } from '@/types/moderation';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const [postsSnap, noticesSnap] = await Promise.all([
      adminFirestore.collection('feed_posts').get(),
      adminFirestore.collection('notices').get(),
    ]);

    const sourceBreakdown: Record<FeedPostSource, number> = {
      unfiltered: 0,
      import: 0,
      share_extension: 0,
    };

    let hiddenPosts = 0;

    postsSnap.docs.forEach((doc) => {
      const data = doc.data();
      if (data.isHidden) hiddenPosts++;
      const source = (data.source ?? 'unfiltered') as FeedPostSource;
      if (source in sourceBreakdown) {
        sourceBreakdown[source]++;
      }
    });

    let hiddenNotices = 0;
    noticesSnap.docs.forEach((doc) => {
      if (doc.data().isHidden) hiddenNotices++;
    });

    const stats: ModerationStats = {
      totalPosts: postsSnap.size,
      visiblePosts: postsSnap.size - hiddenPosts,
      hiddenPosts,
      totalNotices: noticesSnap.size,
      hiddenNotices,
      sourceBreakdown,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching moderation stats:', error);
    return NextResponse.json(
      { error: 'Error al obtener las estadísticas de moderación' },
      { status: 500 }
    );
  }
}
