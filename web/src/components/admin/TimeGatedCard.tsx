'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Clock,
  Lock,
  Unlock,
  Edit3,
  X,
  Save,
  Loader2,
  UtensilsCrossed,
  LayoutGrid,
} from 'lucide-react';
import MenuEditor from './MenuEditor';
import SeatingUploader from './SeatingUploader';
import TimeGatedPreview from './TimeGatedPreview';
import type { TimeGatedItem, MenuPayload, SeatingPayload } from '@/types/time-gated';
import { CONTENT_TYPE_LABELS } from '@/types/time-gated';

interface TimeGatedCardProps {
  item: TimeGatedItem;
  onUpdateMeta: (id: string, title: string, unlockAt: string) => Promise<void>;
  onUpdatePayload: (id: string, payload: MenuPayload | SeatingPayload) => Promise<void>;
  onUploadImage: (id: string, file: File) => Promise<void>;
  onClearImage: (id: string) => Promise<void>;
  savingMeta: boolean;
  savingPayload: boolean;
  uploadingImage: boolean;
}

export default function TimeGatedCard({
  item,
  onUpdateMeta,
  onUpdatePayload,
  onUploadImage,
  onClearImage,
  savingMeta,
  savingPayload,
  uploadingImage,
}: TimeGatedCardProps) {
  const [editing, setEditing] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [unlockAt, setUnlockAt] = useState(toLocalDatetime(item.unlockAt));

  const now = new Date();
  const unlockDate = new Date(item.unlockAt);
  const isUnlocked = unlockDate <= now;

  const icon =
    item.contentType === 'menu' ? (
      <UtensilsCrossed className="h-5 w-5" />
    ) : (
      <LayoutGrid className="h-5 w-5" />
    );

  async function handleSaveMeta() {
    // Convert local datetime to Europe/Madrid offset (+02:00 CEST)
    const isoWithOffset = unlockAt + ':00+02:00';
    await onUpdateMeta(item.id, title, isoWithOffset);
    setEditing(false);
  }

  function handleCancelEdit() {
    setTitle(item.title);
    setUnlockAt(toLocalDatetime(item.unlockAt));
    setEditing(false);
  }

  return (
    <div className="bg-white rounded-lg border border-charcoal/10 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-charcoal/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isUnlocked ? 'bg-sage/10 text-sage' : 'bg-ocean/10 text-ocean'}`}>
              {icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="type-body-base font-semibold text-charcoal">
                  {CONTENT_TYPE_LABELS[item.contentType]}
                </h2>
                <Badge
                  variant={isUnlocked ? 'default' : 'secondary'}
                  className={isUnlocked ? 'bg-sage text-white' : ''}
                >
                  {isUnlocked ? (
                    <>
                      <Unlock className="mr-1 h-3 w-3" />
                      Desbloqueado
                    </>
                  ) : (
                    <>
                      <Lock className="mr-1 h-3 w-3" />
                      Bloqueado
                    </>
                  )}
                </Badge>
              </div>
              <p className="type-body-small text-charcoal/50">{item.title}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowEditor(!showEditor)}>
              <Edit3 className="mr-1.5 h-3.5 w-3.5" />
              {showEditor ? 'Ocultar editor' : 'Editar contenido'}
            </Button>
          </div>
        </div>
      </div>

      {/* Metadata section */}
      <div className="px-5 py-4 border-b border-charcoal/5">
        {editing ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="type-body-small text-charcoal/60 mb-1 block">Título</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div>
                <label className="type-body-small text-charcoal/60 mb-1 block">
                  Hora de desbloqueo (Europe/Madrid, CEST)
                </label>
                <Input
                  type="datetime-local"
                  value={unlockAt}
                  min="2026-05-28T00:00"
                  max="2026-05-31T23:59"
                  onChange={(e) => setUnlockAt(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveMeta} disabled={savingMeta}>
                {savingMeta ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-1.5 h-4 w-4" />
                )}
                Guardar
              </Button>
              <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                <X className="mr-1.5 h-4 w-4" />
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-charcoal/60">
                <Clock className="h-4 w-4" />
                <span className="type-body-small">
                  {unlockDate.toLocaleDateString('es-ES', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  CEST
                </span>
              </div>
              {item.eventId && (
                <span className="type-body-small text-charcoal/40">
                  Evento: {item.eventId}
                </span>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
              <Edit3 className="mr-1.5 h-3.5 w-3.5" />
              Editar
            </Button>
          </div>
        )}
      </div>

      {/* Preview */}
      <div className="px-5 py-4 border-b border-charcoal/5">
        <TimeGatedPreview item={item} />
      </div>

      {/* Content editor (collapsible) */}
      {showEditor && (
        <div className="px-5 py-4 bg-charcoal/[0.02]">
          {item.contentType === 'menu' ? (
            <MenuEditor
              payload={(item.payload as MenuPayload) ?? { items: [], notes: '' }}
              onSave={(payload) => onUpdatePayload(item.id, payload)}
              saving={savingPayload}
            />
          ) : (
            <SeatingUploader
              payload={(item.payload as SeatingPayload) ?? {}}
              onUpload={(file) => onUploadImage(item.id, file)}
              onClearImage={() => onClearImage(item.id)}
              uploading={uploadingImage}
            />
          )}
        </div>
      )}
    </div>
  );
}

/** Convert ISO string to datetime-local input value (YYYY-MM-DDTHH:mm) */
function toLocalDatetime(iso: string): string {
  // Parse as Europe/Madrid — the stored datetime already has the +02:00 offset
  const d = new Date(iso);
  // Format for datetime-local input using Madrid timezone
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
}
