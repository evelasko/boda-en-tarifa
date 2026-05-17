'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import type {
  AttendanceStatus,
  MainCoursePreference,
  NightOption,
  RSVPResponse,
  TransportationNeed,
} from '@/types/rsvp';
import type { GuestWithRSVP } from '@/types/guest';
import { RSVPValidation } from '@/lib/rsvp-validation';

const NIGHT_OPTIONS: Array<{ value: NightOption; label: string }> = [
  { value: 'friday', label: 'Viernes' },
  { value: 'saturday', label: 'Sábado' },
  { value: 'sunday', label: 'Domingo (me quedo y me vuelvo el lunes)' },
  { value: 'other', label: 'Otra combinación' },
];

const TRANSPORT_OPTIONS: Array<{ value: TransportationNeed; label: string }> = [
  { value: 'find_ride', label: 'Necesita ayuda para encontrar plaza' },
  { value: 'offer_ride', label: 'Puede ofrecer coche' },
  { value: 'no_help', label: 'No necesita ayuda' },
  { value: 'not_sure', label: 'Aún no lo sabe' },
];

const MAIN_COURSE_OPTIONS: Array<{ value: MainCoursePreference; label: string }> = [
  { value: 'fish', label: 'Pescado' },
  { value: 'meat', label: 'Carne' },
  { value: 'vegetarian', label: 'Vegetariano' },
];

type ManualRsvpPayload = {
  responses: Partial<RSVPResponse>;
  notes?: string;
};

interface ManualRsvpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guest: GuestWithRSVP | null;
  guests: GuestWithRSVP[];
  onSave: (payload: ManualRsvpPayload) => Promise<void>;
}

function checkboxCardClass(checked: boolean): string {
  return checked
    ? 'flex cursor-pointer items-start gap-2 rounded-md border border-sage bg-sage/10 px-3 py-2'
    : 'flex cursor-pointer items-start gap-2 rounded-md border border-charcoal/15 px-3 py-2';
}

export default function ManualRsvpModal({
  open,
  onOpenChange,
  guest,
  guests,
  onSave,
}: ManualRsvpModalProps) {
  const [responses, setResponses] = useState<Partial<RSVPResponse>>({});
  const [notes, setNotes] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const primaryGuestName = useMemo(() => {
    const uid = guest?.connectedTo?.trim();
    if (!uid) return null;
    const primary = guests.find((g) => g.uid === uid);
    return primary?.fullName ?? uid;
  }, [guest, guests]);

  useEffect(() => {
    if (!open || !guest) return;
    setResponses({
      displayName: guest.fullName ?? '',
      attendance: undefined,
      nightsStaying: [],
      transportationNeeds: [],
      roomSharing: '',
      dietaryRestrictions: '',
      mainCoursePreference: undefined,
      sundayBrunch: undefined,
    });
    setNotes('');
    setFieldErrors({});
    setSubmitError(null);
  }, [open, guest]);

  const blockingMessages = useMemo(
    () => RSVPValidation.listBlockingMessages(responses),
    [responses]
  );

  function toggleArrayValue<K extends 'nightsStaying' | 'transportationNeeds'>(
    key: K,
    value: RSVPResponse[K] extends Array<infer U> ? U : never,
    checked: boolean
  ) {
    setResponses((prev) => {
      const current = (prev[key] as string[] | undefined) ?? [];
      const next = checked
        ? [...current, value as string]
        : current.filter((item) => item !== value);
      return { ...prev, [key]: next };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    const errors = RSVPValidation.validateResponse(responses);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    try {
      await onSave({
        responses,
        notes: notes.trim() || undefined,
      });
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo guardar el RSVP manual';
      setSubmitError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto text-charcoal sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            RSVP manual{guest ? ` — ${guest.fullName}` : ''}
          </DialogTitle>
        </DialogHeader>

        {primaryGuestName && (
          <p className="rounded-md border border-ocean/30 bg-ocean/10 px-3 py-2 text-sm text-charcoal/80">
            Vinculado a <strong>{primaryGuestName}</strong>.
          </p>
        )}

        {submitError && (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {submitError}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="manual-displayName">Nombre para lista *</Label>
            <Input
              id="manual-displayName"
              className="text-charcoal placeholder:text-charcoal/45"
              value={responses.displayName ?? ''}
              onChange={(e) => setResponses((prev) => ({ ...prev, displayName: e.target.value }))}
              placeholder="Nombre y apellidos"
            />
            {fieldErrors.displayName && (
              <p className="text-xs text-red-600">{fieldErrors.displayName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>¿Vas a venir a la boda? *</Label>
            <div className="grid gap-2 sm:grid-cols-3">
              {(
                [
                  { value: 'yes', label: 'Sí' },
                  { value: 'no', label: 'No' },
                  { value: 'maybe', label: 'Quizás' },
                ] as const
              ).map((opt) => {
                const checked = responses.attendance === opt.value;
                return (
                  <label key={opt.value} className={checkboxCardClass(checked)}>
                    <input
                      type="radio"
                      name="manual-attendance"
                      checked={checked}
                      onChange={() =>
                        setResponses((prev) => ({
                          ...prev,
                          attendance: opt.value as AttendanceStatus,
                        }))
                      }
                    />
                    <span className="text-sm">{opt.label}</span>
                  </label>
                );
              })}
            </div>
            {fieldErrors.attendance && (
              <p className="text-xs text-red-600">{fieldErrors.attendance}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Noches en Cádiz *</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {NIGHT_OPTIONS.map((opt) => {
                const checked = responses.nightsStaying?.includes(opt.value) ?? false;
                return (
                  <label key={opt.value} className={checkboxCardClass(checked)}>
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(value) =>
                        toggleArrayValue('nightsStaying', opt.value, value === true)
                      }
                    />
                    <span className="text-sm">{opt.label}</span>
                  </label>
                );
              })}
            </div>
            {fieldErrors.nightsStaying && (
              <p className="text-xs text-red-600">{fieldErrors.nightsStaying}</p>
            )}
          </div>

          {(responses.nightsStaying ?? []).includes('other') && (
            <div className="space-y-2">
              <Label htmlFor="manual-otherNights">Especifica la otra combinación *</Label>
              <Input
                id="manual-otherNights"
                className="text-charcoal placeholder:text-charcoal/45"
                value={responses.otherNightsCombination ?? ''}
                onChange={(e) =>
                  setResponses((prev) => ({
                    ...prev,
                    otherNightsCombination: e.target.value,
                  }))
                }
                placeholder="Describe la combinación de noches"
              />
              {fieldErrors.otherNightsCombination && (
                <p className="text-xs text-red-600">{fieldErrors.otherNightsCombination}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="manual-roomSharing">¿Con quién comparte habitación?</Label>
            <Input
              id="manual-roomSharing"
              className="text-charcoal placeholder:text-charcoal/45"
              value={responses.roomSharing ?? ''}
              onChange={(e) => setResponses((prev) => ({ ...prev, roomSharing: e.target.value }))}
              placeholder="Nombre, individual, o pendiente"
            />
          </div>

          <div className="space-y-2">
            <Label>Ayuda con transporte *</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {TRANSPORT_OPTIONS.map((opt) => {
                const checked = responses.transportationNeeds?.includes(opt.value) ?? false;
                return (
                  <label key={opt.value} className={checkboxCardClass(checked)}>
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(value) =>
                        toggleArrayValue('transportationNeeds', opt.value, value === true)
                      }
                    />
                    <span className="text-sm">{opt.label}</span>
                  </label>
                );
              })}
            </div>
            {fieldErrors.transportationNeeds && (
              <p className="text-xs text-red-600">{fieldErrors.transportationNeeds}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="manual-dietary">Alergias o necesidades alimentarias</Label>
            <Textarea
              id="manual-dietary"
              className="text-charcoal placeholder:text-charcoal/45"
              rows={3}
              value={responses.dietaryRestrictions ?? ''}
              onChange={(e) =>
                setResponses((prev) => ({ ...prev, dietaryRestrictions: e.target.value }))
              }
              placeholder="Opcional"
            />
          </div>

          <div className="space-y-2">
            <Label>Plato principal *</Label>
            <div className="grid gap-2 sm:grid-cols-3">
              {MAIN_COURSE_OPTIONS.map((opt) => {
                const checked = responses.mainCoursePreference === opt.value;
                return (
                  <label key={opt.value} className={checkboxCardClass(checked)}>
                    <input
                      type="radio"
                      name="manual-main-course"
                      checked={checked}
                      onChange={() =>
                        setResponses((prev) => ({
                          ...prev,
                          mainCoursePreference: opt.value,
                        }))
                      }
                    />
                    <span className="text-sm">{opt.label}</span>
                  </label>
                );
              })}
            </div>
            {fieldErrors.mainCoursePreference && (
              <p className="text-xs text-red-600">{fieldErrors.mainCoursePreference}</p>
            )}
          </div>

          <label className="flex items-start gap-3 rounded-md border border-charcoal/15 px-3 py-2">
            <Checkbox
              checked={responses.sundayBrunch === true}
              onCheckedChange={(value) =>
                setResponses((prev) => ({ ...prev, sundayBrunch: value === true }))
              }
            />
            <span className="text-sm">¿Contamos con esta persona para el brunch del domingo?</span>
          </label>

          <div className="space-y-2">
            <Label htmlFor="manual-notes">Notas (opcional)</Label>
            <Textarea
              id="manual-notes"
              className="text-charcoal placeholder:text-charcoal/45"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Datos transcritos del RSVP de María"
            />
          </div>

          {blockingMessages.length > 0 && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Completa estos campos para guardar: {blockingMessages.join(' · ')}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar RSVP'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export type { ManualRsvpPayload };
