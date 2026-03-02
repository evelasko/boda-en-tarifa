'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { TimelineEvent, TimelineVenue, CreateTimelineEventInput } from '@/types/timeline';

interface EventFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: TimelineEvent | null;
  venues: TimelineVenue[];
  onSave: (data: CreateTimelineEventInput) => Promise<void>;
}

/** Convert ISO 8601 datetime to datetime-local input value in Europe/Madrid timezone. */
function toLocalInput(iso: string): string {
  if (!iso) return '';
  try {
    const date = new Date(iso);
    // Format as YYYY-MM-DDTHH:mm in Madrid timezone
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Madrid',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(date);

    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
    return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
  } catch {
    return '';
  }
}

/** Convert datetime-local value to ISO 8601 string with +02:00 (CEST) offset. */
function toISO(localValue: string): string {
  if (!localValue) return '';
  return `${localValue}:00+02:00`;
}

/** Derive day number from a datetime-local value based on the wedding dates. */
function deriveDayNumber(localValue: string): number {
  if (!localValue) return 1;
  const dateStr = localValue.split('T')[0]; // YYYY-MM-DD
  if (dateStr === '2026-05-29') return 1;
  if (dateStr === '2026-05-30') return 2;
  if (dateStr === '2026-05-31') return 3;
  return 1;
}

export default function EventFormModal({
  open,
  onOpenChange,
  event,
  venues,
  onSave,
}: EventFormModalProps) {
  const isEditing = !!event;

  const [id, setId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [venueId, setVenueId] = useState('');
  const [ctaLabel, setCtaLabel] = useState('');
  const [ctaDeepLink, setCtaDeepLink] = useState('');
  const [dayNumber, setDayNumber] = useState('1');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      if (event) {
        setId(event.id);
        setTitle(event.title);
        setDescription(event.description);
        setStartTime(toLocalInput(event.startTime));
        setEndTime(toLocalInput(event.endTime));
        setVenueId(event.venueId);
        setCtaLabel(event.ctaLabel ?? '');
        setCtaDeepLink(event.ctaDeepLink ?? '');
        setDayNumber(String(event.dayNumber));
      } else {
        setId('');
        setTitle('');
        setDescription('');
        setStartTime('');
        setEndTime('');
        setVenueId('');
        setCtaLabel('');
        setCtaDeepLink('');
        setDayNumber('1');
      }
      setErrors({});
    }
  }, [open, event]);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!id.trim()) errs.id = 'El ID es obligatorio';
    if (!title.trim()) errs.title = 'El título es obligatorio';
    if (!description.trim()) errs.description = 'La descripción es obligatoria';
    if (!startTime) errs.startTime = 'La hora de inicio es obligatoria';
    if (!endTime) errs.endTime = 'La hora de fin es obligatoria';
    if (!venueId) errs.venueId = 'El lugar es obligatorio';
    if (startTime && endTime && new Date(toISO(endTime)) <= new Date(toISO(startTime))) {
      errs.endTime = 'La hora de fin debe ser posterior al inicio';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      await onSave({
        id: id.trim(),
        title: title.trim(),
        description: description.trim(),
        startTime: toISO(startTime),
        endTime: toISO(endTime),
        venueId,
        dayNumber: Number(dayNumber),
        ...(ctaLabel.trim() ? { ctaLabel: ctaLabel.trim() } : {}),
        ...(ctaDeepLink.trim() ? { ctaDeepLink: ctaDeepLink.trim() } : {}),
      });
      onOpenChange(false);
    } catch {
      setErrors({ form: 'Error al guardar. Inténtalo de nuevo.' });
    } finally {
      setSaving(false);
    }
  }

  // Auto-calculate day number when startTime changes
  function handleStartTimeChange(value: string) {
    setStartTime(value);
    const derived = deriveDayNumber(value);
    setDayNumber(String(derived));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Evento' : 'Añadir Evento'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.form && (
            <p className="text-sm text-red-600 bg-red-50 rounded p-2">{errors.form}</p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="event-id">ID *</Label>
              <Input
                id="event-id"
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="fri-ceremony"
                disabled={isEditing}
              />
              {errors.id && <p className="text-xs text-red-600">{errors.id}</p>}
            </div>
            <div className="space-y-2">
              <Label>Día *</Label>
              <Select value={dayNumber} onValueChange={setDayNumber}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Día 1 — 29 May</SelectItem>
                  <SelectItem value="2">Día 2 — 30 May</SelectItem>
                  <SelectItem value="3">Día 3 — 31 May</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-title">Título *</Label>
            <Input
              id="event-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ceremonia"
            />
            {errors.title && <p className="text-xs text-red-600">{errors.title}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-description">Descripción *</Label>
            <textarea
              id="event-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ceremonia al atardecer en la playa"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            {errors.description && <p className="text-xs text-red-600">{errors.description}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="event-start">Hora de inicio * (Madrid)</Label>
              <Input
                id="event-start"
                type="datetime-local"
                value={startTime}
                onChange={(e) => handleStartTimeChange(e.target.value)}
              />
              {errors.startTime && <p className="text-xs text-red-600">{errors.startTime}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-end">Hora de fin * (Madrid)</Label>
              <Input
                id="event-end"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
              {errors.endTime && <p className="text-xs text-red-600">{errors.endTime}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Lugar *</Label>
            {venues.length > 0 ? (
              <Select value={venueId} onValueChange={setVenueId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar lugar" />
                </SelectTrigger>
                <SelectContent>
                  {venues.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={venueId}
                onChange={(e) => setVenueId(e.target.value)}
                placeholder="chiringuito"
              />
            )}
            {errors.venueId && <p className="text-xs text-red-600">{errors.venueId}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="event-cta-label">CTA Label (opcional)</Label>
              <Input
                id="event-cta-label"
                value={ctaLabel}
                onChange={(e) => setCtaLabel(e.target.value)}
                placeholder="Ver ubicacion"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-cta-link">CTA Deep Link (opcional)</Label>
              <Input
                id="event-cta-link"
                value={ctaDeepLink}
                onChange={(e) => setCtaDeepLink(e.target.value)}
                placeholder="boda://venue/playa"
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Añadir evento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
