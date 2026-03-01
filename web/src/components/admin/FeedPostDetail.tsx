'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { cloudinaryUrl } from '@/lib/cloudinary';
import type { FeedPost } from '@/types/moderation';
import { SOURCE_LABELS } from '@/types/moderation';

interface FeedPostDetailProps {
  post: FeedPost | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToggleHidden: (post: FeedPost) => void;
  toggling: boolean;
}

export default function FeedPostDetail({
  post,
  open,
  onOpenChange,
  onToggleHidden,
  toggling,
}: FeedPostDetailProps) {
  const [imageIndex, setImageIndex] = useState(0);

  if (!post) return null;

  const hasMultipleImages = post.imageUrls.length > 1;
  const safeIndex = Math.min(imageIndex, post.imageUrls.length - 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalle de publicación</DialogTitle>
        </DialogHeader>

        {/* Image carousel */}
        {post.imageUrls.length > 0 && (
          <div className="relative rounded-lg overflow-hidden bg-charcoal/5">
            <img
              src={cloudinaryUrl(post.imageUrls[safeIndex])}
              alt={post.caption || `Foto de ${post.authorName}`}
              className="w-full max-h-[50vh] object-contain"
            />
            {hasMultipleImages && (
              <>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 bg-white/80 backdrop-blur-sm"
                  onClick={() => setImageIndex((i) => Math.max(0, i - 1))}
                  disabled={safeIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 bg-white/80 backdrop-blur-sm"
                  onClick={() => setImageIndex((i) => Math.min(post.imageUrls.length - 1, i + 1))}
                  disabled={safeIndex >= post.imageUrls.length - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {post.imageUrls.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setImageIndex(i)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        i === safeIndex ? 'bg-white' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Post info */}
        <div className="space-y-4">
          {/* Author info */}
          <div className="flex items-center gap-3">
            {post.authorPhotoUrl ? (
              <img
                src={post.authorPhotoUrl}
                alt={post.authorName}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-charcoal/10 flex items-center justify-center text-sm font-medium text-charcoal/60">
                {post.authorName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-medium text-charcoal">{post.authorName}</p>
              <p className="text-xs text-charcoal/50">
                {new Date(post.createdAt).toLocaleDateString('es-ES', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>

          {/* Caption */}
          {post.caption && (
            <p className="text-charcoal/80 type-body-base">{post.caption}</p>
          )}

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{SOURCE_LABELS[post.source]}</Badge>
            <Badge variant={post.isHidden ? 'secondary' : 'default'}>
              {post.isHidden ? 'Oculta' : 'Visible'}
            </Badge>
            {post.imageUrls.length > 1 && (
              <Badge variant="outline">{post.imageUrls.length} imágenes</Badge>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end pt-2 border-t border-charcoal/10">
            <Button
              variant={post.isHidden ? 'default' : 'outline'}
              onClick={() => onToggleHidden(post)}
              disabled={toggling}
            >
              {toggling ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : post.isHidden ? (
                <Eye className="mr-2 h-4 w-4" />
              ) : (
                <EyeOff className="mr-2 h-4 w-4" />
              )}
              {post.isHidden ? 'Mostrar en el feed' : 'Ocultar del feed'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
