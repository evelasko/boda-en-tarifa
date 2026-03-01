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
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import type { GuestWithRSVP, CreateGuestInput, GuestSide, RelationshipStatus } from '@/types/guest';

interface GuestFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guest: GuestWithRSVP | null;
  onSave: (data: CreateGuestInput & { tableName?: string; seatNumber?: number }) => Promise<void>;
  existingSeating?: { tableName: string; seatNumber: number } | null;
}

export default function GuestFormModal({
  open,
  onOpenChange,
  guest,
  onSave,
  existingSeating,
}: GuestFormModalProps) {
  const isEditing = !!guest;

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [side, setSide] = useState<GuestSide>('ambos');
  const [relationToGrooms, setRelationToGrooms] = useState('');
  const [relationshipStatus, setRelationshipStatus] = useState<RelationshipStatus>('soltero');
  const [isDirectoryVisible, setIsDirectoryVisible] = useState(true);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [tableName, setTableName] = useState('');
  const [seatNumber, setSeatNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      if (guest) {
        setFullName(guest.fullName);
        setEmail(guest.email);
        setSide(guest.side);
        setRelationToGrooms(guest.relationToGrooms);
        setRelationshipStatus(guest.relationshipStatus);
        setIsDirectoryVisible(guest.isDirectoryVisible);
        setWhatsappNumber(guest.whatsappNumber || '');
        setTableName(existingSeating?.tableName || '');
        setSeatNumber(existingSeating?.seatNumber?.toString() || '');
      } else {
        setFullName('');
        setEmail('');
        setSide('ambos');
        setRelationToGrooms('');
        setRelationshipStatus('soltero');
        setIsDirectoryVisible(true);
        setWhatsappNumber('');
        setTableName('');
        setSeatNumber('');
      }
      setErrors({});
    }
  }, [open, guest, existingSeating]);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = 'El nombre es obligatorio';
    if (!email.trim()) errs.email = 'El email es obligatorio';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      errs.email = 'Formato de email inválido';
    if (!relationToGrooms.trim()) errs.relationToGrooms = 'La relación es obligatoria';
    if (seatNumber && isNaN(Number(seatNumber)))
      errs.seatNumber = 'El número de asiento debe ser un número';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      await onSave({
        fullName: fullName.trim(),
        email: email.trim(),
        side,
        relationToGrooms: relationToGrooms.trim(),
        relationshipStatus,
        isDirectoryVisible,
        whatsappNumber: whatsappNumber.trim() || undefined,
        tableName: tableName.trim() || undefined,
        seatNumber: seatNumber ? Number(seatNumber) : undefined,
      });
      onOpenChange(false);
    } catch {
      setErrors({ form: 'Error al guardar. Inténtalo de nuevo.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Invitado' : 'Añadir Invitado'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.form && (
            <p className="text-sm text-red-600 bg-red-50 rounded p-2">{errors.form}</p>
          )}

          <div className="space-y-2">
            <Label htmlFor="fullName">Nombre completo *</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nombre y apellidos"
            />
            {errors.fullName && <p className="text-xs text-red-600">{errors.fullName}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@ejemplo.com"
            />
            {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Lado *</Label>
              <Select value={side} onValueChange={(v) => setSide(v as GuestSide)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="novioA">Novio A (Enrique)</SelectItem>
                  <SelectItem value="novioB">Novio B (Manuel)</SelectItem>
                  <SelectItem value="ambos">Ambos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Estado sentimental *</Label>
              <Select
                value={relationshipStatus}
                onValueChange={(v) => setRelationshipStatus(v as RelationshipStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="soltero">Soltero</SelectItem>
                  <SelectItem value="enPareja">En Pareja</SelectItem>
                  <SelectItem value="buscando">Buscando</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="relationToGrooms">Relación con los novios *</Label>
            <Input
              id="relationToGrooms"
              value={relationToGrooms}
              onChange={(e) => setRelationToGrooms(e.target.value)}
              placeholder="Ej: Primo, Compañero de trabajo, Amigo de la infancia"
            />
            {errors.relationToGrooms && (
              <p className="text-xs text-red-600">{errors.relationToGrooms}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp (opcional)</Label>
            <Input
              id="whatsapp"
              type="tel"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="+34 600 000 000"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="directoryVisible">Visible en directorio</Label>
            <Switch
              id="directoryVisible"
              checked={isDirectoryVisible}
              onCheckedChange={setIsDirectoryVisible}
            />
          </div>

          {isEditing && guest && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium text-charcoal/70">Campos del invitado (solo lectura)</p>
                {guest.photoUrl && (
                  <div className="flex items-center gap-2 text-sm text-charcoal/60">
                    <span className="font-medium">Foto:</span>
                    <span className="truncate">{guest.photoUrl}</span>
                  </div>
                )}
                {guest.funFact && (
                  <div className="text-sm text-charcoal/60">
                    <span className="font-medium">Fun fact:</span> {guest.funFact}
                  </div>
                )}
                <div className="text-sm text-charcoal/60">
                  <span className="font-medium">Perfil reclamado:</span>{' '}
                  {guest.profileClaimed ? 'Sí' : 'No'}
                </div>
              </div>
            </>
          )}

          <Separator />

          <p className="text-sm font-medium text-charcoal/70">Asiento</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tableName">Mesa</Label>
              <Input
                id="tableName"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                placeholder="Ej: Mesa 1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seatNumber">Nº de asiento</Label>
              <Input
                id="seatNumber"
                type="number"
                value={seatNumber}
                onChange={(e) => setSeatNumber(e.target.value)}
                placeholder="Ej: 3"
                min={1}
              />
              {errors.seatNumber && (
                <p className="text-xs text-red-600">{errors.seatNumber}</p>
              )}
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
              {saving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Añadir invitado'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
