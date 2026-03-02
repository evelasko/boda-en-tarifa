'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { cloudinaryThumbnailUrl } from '@/lib/cloudinary';
import type { FeedPost } from '@/types/moderation';
import { SOURCE_LABELS } from '@/types/moderation';

interface FeedPostGridProps {
  posts: FeedPost[];
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  onToggleHidden: (post: FeedPost) => void;
  onViewDetail: (post: FeedPost) => void;
  togglingIds: Set<string>;
}

export default function FeedPostGrid({
  posts,
  selectedIds,
  onSelectionChange,
  onToggleHidden,
  onViewDetail,
  togglingIds,
}: FeedPostGridProps) {
  function toggleOne(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange(next);
  }

  if (posts.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-charcoal/10 p-12 text-center">
        <p className="text-charcoal/50">No se encontraron publicaciones</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {posts.map((post) => (
        <div
          key={post.id}
          className={`group relative bg-white rounded-lg border overflow-hidden transition-shadow hover:shadow-md ${
            post.isHidden ? 'border-charcoal/20 opacity-60' : 'border-charcoal/10'
          } ${selectedIds.has(post.id) ? 'ring-2 ring-ocean' : ''}`}
        >
          {/* Selection checkbox */}
          <div className="absolute top-2 left-2 z-10">
            <Checkbox
              checked={selectedIds.has(post.id)}
              onCheckedChange={() => toggleOne(post.id)}
              className="bg-white/80 backdrop-blur-sm"
              aria-label={`Seleccionar publicación de ${post.authorName}`}
            />
          </div>

          {/* Image thumbnail */}
          <button
            onClick={() => onViewDetail(post)}
            className="w-full aspect-square relative overflow-hidden cursor-pointer"
          >
            {post.imageUrls.length > 0 ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={cloudinaryThumbnailUrl(post.imageUrls[0])}
                alt={post.caption || `Foto de ${post.authorName}`}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-charcoal/5 flex items-center justify-center">
                <span className="text-charcoal/30 text-sm">Sin imagen</span>
              </div>
            )}
            {post.imageUrls.length > 1 && (
              <Badge
                variant="secondary"
                className="absolute top-2 right-2 text-[10px] px-1.5"
              >
                +{post.imageUrls.length - 1}
              </Badge>
            )}
            {post.isHidden && (
              <div className="absolute inset-0 bg-charcoal/30 flex items-center justify-center">
                <EyeOff className="h-6 w-6 text-white" />
              </div>
            )}
          </button>

          {/* Info footer */}
          <div className="p-2.5 space-y-1.5">
            <div className="flex items-center justify-between gap-1">
              <p className="text-xs font-medium text-charcoal truncate">
                {post.authorName}
              </p>
              <Badge variant="outline" className="text-[10px] px-1.5 shrink-0">
                {SOURCE_LABELS[post.source]}
              </Badge>
            </div>
            {post.caption && (
              <p className="text-[11px] text-charcoal/60 line-clamp-1">
                {post.caption}
              </p>
            )}
            <div className="flex items-center justify-between">
              <time className="text-[10px] text-charcoal/40">
                {new Date(post.createdAt).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </time>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => onToggleHidden(post)}
                disabled={togglingIds.has(post.id)}
                title={post.isHidden ? 'Mostrar' : 'Ocultar'}
              >
                {togglingIds.has(post.id) ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : post.isHidden ? (
                  <Eye className="h-3.5 w-3.5 text-sage" />
                ) : (
                  <EyeOff className="h-3.5 w-3.5 text-charcoal/40" />
                )}
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
