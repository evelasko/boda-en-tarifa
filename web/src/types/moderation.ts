export type FeedPostSource = 'unfiltered' | 'import' | 'share_extension';

export interface FeedPost {
  id: string;
  authorUid: string;
  authorName: string;
  authorPhotoUrl?: string;
  imageUrls: string[];
  caption?: string;
  source: FeedPostSource;
  isHidden: boolean;
  createdAt: string;
}

export interface Notice {
  id: string;
  authorUid: string;
  authorName: string;
  authorPhotoUrl?: string;
  body: string;
  authorWhatsappNumber: string;
  isHidden: boolean;
  createdAt: string;
}

export interface ModerationStats {
  totalPosts: number;
  visiblePosts: number;
  hiddenPosts: number;
  totalNotices: number;
  hiddenNotices: number;
  sourceBreakdown: {
    unfiltered: number;
    import: number;
    share_extension: number;
  };
}

export const SOURCE_LABELS: Record<FeedPostSource, string> = {
  unfiltered: 'Sin filtro',
  import: 'Importada',
  share_extension: 'Compartida',
};
