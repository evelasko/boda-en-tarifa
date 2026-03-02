'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Unlock, Eye } from 'lucide-react';
import { cloudinaryThumbnailUrl } from '@/lib/cloudinary';
import type { TimeGatedItem, MenuPayload, SeatingPayload } from '@/types/time-gated';

interface TimeGatedPreviewProps {
  item: TimeGatedItem;
}

export default function TimeGatedPreview({ item }: TimeGatedPreviewProps) {
  const [showUnlocked, setShowUnlocked] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-charcoal/50" />
          <span className="type-body-small font-medium text-charcoal">Vista previa</span>
        </div>
        <div className="flex gap-1">
          <Button
            variant={showUnlocked ? 'ghost' : 'default'}
            size="sm"
            onClick={() => setShowUnlocked(false)}
            className="text-xs"
          >
            <Lock className="mr-1 h-3 w-3" />
            Bloqueado
          </Button>
          <Button
            variant={showUnlocked ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setShowUnlocked(true)}
            className="text-xs"
          >
            <Unlock className="mr-1 h-3 w-3" />
            Desbloqueado
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-charcoal/10 bg-charcoal/[0.02] p-4 min-h-[120px]">
        {showUnlocked ? (
          <UnlockedPreview item={item} />
        ) : (
          <LockedPreview item={item} />
        )}
      </div>
    </div>
  );
}

function LockedPreview({ item }: { item: TimeGatedItem }) {
  const unlockDate = new Date(item.unlockAt);
  const now = new Date();
  const diff = unlockDate.getTime() - now.getTime();
  const isUnlocked = diff <= 0;

  if (isUnlocked) {
    return (
      <div className="text-center py-4">
        <Unlock className="mx-auto h-8 w-8 text-sage mb-2" />
        <p className="type-body-base text-sage font-medium">Ya desbloqueado</p>
        <p className="type-body-small text-charcoal/50 mt-1">
          Se desbloqueó el {unlockDate.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    );
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  return (
    <div className="text-center py-4">
      <Lock className="mx-auto h-8 w-8 text-charcoal/30 mb-2" />
      <p className="type-body-base text-charcoal/60 font-medium">Coming Soon</p>
      <p className="type-body-small text-charcoal/40 mt-1">{item.title}</p>
      <div className="flex items-center justify-center gap-3 mt-3">
        <div className="text-center">
          <span className="text-xl font-bold text-charcoal">{days}</span>
          <span className="block text-[10px] text-charcoal/40 uppercase">días</span>
        </div>
        <span className="text-charcoal/20">:</span>
        <div className="text-center">
          <span className="text-xl font-bold text-charcoal">{hours}</span>
          <span className="block text-[10px] text-charcoal/40 uppercase">horas</span>
        </div>
      </div>
    </div>
  );
}

function UnlockedPreview({ item }: { item: TimeGatedItem }) {
  if (item.contentType === 'menu') {
    const payload = item.payload as MenuPayload | undefined;
    if (!payload?.items?.length) {
      return (
        <p className="text-charcoal/40 type-body-small text-center py-4">
          No hay platos configurados aún.
        </p>
      );
    }
    return (
      <div className="space-y-2">
        {payload.items.map((dish, i) => (
          <div key={i} className="flex items-start justify-between gap-2 py-1.5 border-b border-charcoal/5 last:border-0">
            <div>
              <p className="type-body-small font-medium text-charcoal">{dish.name}</p>
              {dish.description && (
                <p className="type-body-small text-charcoal/50">{dish.description}</p>
              )}
            </div>
            {dish.dietary.length > 0 && (
              <div className="flex gap-1 shrink-0">
                {dish.dietary.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-[10px] px-1.5">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        ))}
        {payload.notes && (
          <p className="type-body-small text-charcoal/50 italic pt-2">{payload.notes}</p>
        )}
      </div>
    );
  }

  if (item.contentType === 'seating') {
    const payload = item.payload as SeatingPayload | undefined;
    if (!payload?.imagePublicId) {
      return (
        <p className="text-charcoal/40 type-body-small text-center py-4">
          No hay imagen de mesas subida aún.
        </p>
      );
    }
    return (
      <div className="text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cloudinaryThumbnailUrl(payload.imagePublicId, 600)}
          alt="Plano de mesas"
          className="rounded-lg max-h-64 mx-auto object-contain"
        />
      </div>
    );
  }

  return <p className="text-charcoal/40 type-body-small">Tipo de contenido desconocido.</p>;
}
