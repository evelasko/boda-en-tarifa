'use client';

import { useEffect, useState } from 'react';
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
import type { MainCoursePreference } from '@/types/rsvp';
import type { AdminRsvpDetailRow } from '@/types/admin-rsvp-response';
import type { AdminRsvpEditableResponses } from '@/lib/admin-rsvp-update';

const MAIN_COURSE_OPTIONS: Array<{ value: MainCoursePreference; label: string }> = [
  { value: 'fish', label: 'Pescado' },
  { value: 'meat', label: 'Carne' },
  { value: 'vegetarian', label: 'Vegetariano' },
];

function checkboxCardClass(checked: boolean): string {
  return checked
    ? 'flex cursor-pointer items-start gap-2 rounded-md border border-sage bg-sage/10 px-3 py-2'
    : 'flex cursor-pointer items-start gap-2 rounded-md border border-charcoal/15 px-3 py-2';
}

export type EditRsvpResponsePayload = {
  rsvpUid: string;
  responses: AdminRsvpEditableResponses;
};

interface EditRsvpResponseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: AdminRsvpDetailRow | null;
  onSave: (payload: EditRsvpResponsePayload) => Promise<void>;
}

export default function EditRsvpResponseModal({
  open,
  onOpenChange,
  row,
  onSave,
}: EditRsvpResponseModalProps) {
  const [mainCoursePreference, setMainCoursePreference] = useState<MainCoursePreference | undefined>();
  const [dietaryRestrictions, setDietaryRestrictions] = useState('');
  const [roomSharing, setRoomSharing] = useState('');
  const [sundayBrunch, setSundayBrunch] = useState(false);
  const [mainCourseError, setMainCourseError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !row) return;
    setMainCoursePreference(row.mainCoursePreference ?? undefined);
    setDietaryRestrictions(row.dietaryRestrictions);
    setRoomSharing(row.roomSharing);
    setSundayBrunch(row.sundayBrunch === true);
    setMainCourseError(null);
    setSubmitError(null);
  }, [open, row]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!row) return;

    setSubmitError(null);
    if (!mainCoursePreference) {
      setMainCourseError('Por favor, selecciona tu preferencia para el plato principal');
      return;
    }
    setMainCourseError(null);

    const trimmedDiet = dietaryRestrictions.trim();
    const payload: AdminRsvpEditableResponses = {
      mainCoursePreference,
      dietaryRestrictions: trimmedDiet === '' ? null : trimmedDiet,
      roomSharing,
      sundayBrunch,
    };

    setSaving(true);
    try {
      await onSave({ rsvpUid: row.rsvpUid, responses: payload });
      onOpenChange(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No se pudo actualizar la respuesta RSVP';
      setSubmitError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto text-charcoal sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Editar respuesta{row ? ` — ${row.displayName}` : ''}
          </DialogTitle>
        </DialogHeader>

        {submitError && (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {submitError}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label>Plato principal *</Label>
            <div className="grid gap-2 sm:grid-cols-3">
              {MAIN_COURSE_OPTIONS.map((opt) => {
                const checked = mainCoursePreference === opt.value;
                return (
                  <label key={opt.value} className={checkboxCardClass(checked)}>
                    <input
                      type="radio"
                      name="edit-main-course"
                      checked={checked}
                      onChange={() => {
                        setMainCoursePreference(opt.value);
                        setMainCourseError(null);
                      }}
                    />
                    <span className="text-sm">{opt.label}</span>
                  </label>
                );
              })}
            </div>
            {mainCourseError && (
              <p className="text-xs text-red-600">{mainCourseError}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="edit-dietary">Alergias o necesidades alimentarias</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto px-2 py-1 text-xs text-charcoal/70"
                onClick={() => setDietaryRestrictions('')}
              >
                Quitar restricción
              </Button>
            </div>
            <Textarea
              id="edit-dietary"
              className="text-charcoal placeholder:text-charcoal/45"
              rows={3}
              value={dietaryRestrictions}
              onChange={(e) => setDietaryRestrictions(e.target.value)}
              placeholder="Opcional"
            />
            <p className="text-xs text-charcoal/55">
              Deja vacío para quitar la restricción alimentaria del documento.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-roomSharing">¿Con quién comparte habitación?</Label>
            <Input
              id="edit-roomSharing"
              className="text-charcoal placeholder:text-charcoal/45"
              value={roomSharing}
              onChange={(e) => setRoomSharing(e.target.value)}
              placeholder="Nombre, individual, o pendiente"
            />
          </div>

          <label className="flex items-start gap-3 rounded-md border border-charcoal/15 px-3 py-2">
            <Checkbox
              checked={sundayBrunch}
              onCheckedChange={(value) => setSundayBrunch(value === true)}
            />
            <span className="text-sm">¿Contamos con esta persona para el brunch del domingo?</span>
          </label>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving || !row}>
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
