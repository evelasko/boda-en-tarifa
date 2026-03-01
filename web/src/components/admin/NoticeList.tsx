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
import { Eye, EyeOff, Loader2, MessageSquare } from 'lucide-react';
import type { Notice } from '@/types/moderation';

interface NoticeListProps {
  notices: Notice[];
  onToggleHidden: (notice: Notice) => void;
  togglingIds: Set<string>;
}

export default function NoticeList({
  notices,
  onToggleHidden,
  togglingIds,
}: NoticeListProps) {
  const [detailNotice, setDetailNotice] = useState<Notice | null>(null);

  if (notices.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-charcoal/10 p-12 text-center">
        <MessageSquare className="mx-auto h-8 w-8 text-charcoal/30 mb-2" />
        <p className="text-charcoal/50">No se encontraron anuncios</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {notices.map((notice) => (
          <div
            key={notice.id}
            className={`bg-white rounded-lg border p-4 transition-colors ${
              notice.isHidden ? 'border-charcoal/20 opacity-60' : 'border-charcoal/10'
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Avatar */}
              {notice.authorPhotoUrl ? (
                <img
                  src={notice.authorPhotoUrl}
                  alt={notice.authorName}
                  className="w-8 h-8 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-charcoal/10 flex items-center justify-center text-xs font-medium text-charcoal/60 shrink-0">
                  {notice.authorName.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm text-charcoal">
                    {notice.authorName}
                  </span>
                  <time className="text-[11px] text-charcoal/40">
                    {new Date(notice.createdAt).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </time>
                  <Badge
                    variant={notice.isHidden ? 'secondary' : 'default'}
                    className="text-[10px] px-1.5"
                  >
                    {notice.isHidden ? 'Oculto' : 'Visible'}
                  </Badge>
                </div>
                <p className="text-sm text-charcoal/70 line-clamp-2">
                  {notice.body}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => setDetailNotice(notice)}
                >
                  Ver más
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onToggleHidden(notice)}
                  disabled={togglingIds.has(notice.id)}
                  title={notice.isHidden ? 'Mostrar' : 'Ocultar'}
                >
                  {togglingIds.has(notice.id) ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : notice.isHidden ? (
                    <Eye className="h-4 w-4 text-sage" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-charcoal/40" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Notice detail modal */}
      <Dialog open={!!detailNotice} onOpenChange={() => setDetailNotice(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalle del anuncio</DialogTitle>
          </DialogHeader>

          {detailNotice && (
            <div className="space-y-4">
              {/* Author */}
              <div className="flex items-center gap-3">
                {detailNotice.authorPhotoUrl ? (
                  <img
                    src={detailNotice.authorPhotoUrl}
                    alt={detailNotice.authorName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-charcoal/10 flex items-center justify-center text-sm font-medium text-charcoal/60">
                    {detailNotice.authorName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-medium text-charcoal">{detailNotice.authorName}</p>
                  <p className="text-xs text-charcoal/50">
                    {new Date(detailNotice.createdAt).toLocaleDateString('es-ES', {
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

              {/* Body */}
              <p className="text-charcoal/80 type-body-base whitespace-pre-wrap">
                {detailNotice.body}
              </p>

              {/* WhatsApp */}
              {detailNotice.authorWhatsappNumber && (
                <div className="text-sm text-charcoal/60">
                  <span className="font-medium">WhatsApp:</span>{' '}
                  <a
                    href={`https://wa.me/${detailNotice.authorWhatsappNumber.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-ocean hover:underline"
                  >
                    {detailNotice.authorWhatsappNumber}
                  </a>
                </div>
              )}

              {/* Status */}
              <div className="flex items-center gap-2">
                <Badge variant={detailNotice.isHidden ? 'secondary' : 'default'}>
                  {detailNotice.isHidden ? 'Oculto' : 'Visible'}
                </Badge>
              </div>

              {/* Actions */}
              <div className="flex justify-end pt-2 border-t border-charcoal/10">
                <Button
                  variant={detailNotice.isHidden ? 'default' : 'outline'}
                  onClick={() => {
                    onToggleHidden(detailNotice);
                    setDetailNotice(null);
                  }}
                  disabled={togglingIds.has(detailNotice.id)}
                >
                  {togglingIds.has(detailNotice.id) ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : detailNotice.isHidden ? (
                    <Eye className="mr-2 h-4 w-4" />
                  ) : (
                    <EyeOff className="mr-2 h-4 w-4" />
                  )}
                  {detailNotice.isHidden ? 'Mostrar en el tablón' : 'Ocultar del tablón'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
