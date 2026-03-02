'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, Phone, Users, Save, Loader2 } from 'lucide-react';
import type { QuickContacts, ContactEntry } from '@/types/content-admin';

interface QuickContactsEditorProps {
  contacts: QuickContacts;
  onSave: (contacts: QuickContacts) => Promise<void>;
  saving: boolean;
}

function emptyContact(role: string): ContactEntry {
  return { name: '', phone: '', role };
}

export default function QuickContactsEditor({ contacts: initial, onSave, saving }: QuickContactsEditorProps) {
  const [contacts, setContacts] = useState<QuickContacts>(initial);
  const dirty = JSON.stringify(contacts) !== JSON.stringify(initial);

  function updateTaxi(index: number, patch: Partial<ContactEntry>) {
    setContacts((prev) => ({
      ...prev,
      taxis: prev.taxis.map((c, i) => (i === index ? { ...c, ...patch } : c)),
    }));
  }

  function updateCoordinator(index: number, patch: Partial<ContactEntry>) {
    setContacts((prev) => ({
      ...prev,
      coordinators: prev.coordinators.map((c, i) => (i === index ? { ...c, ...patch } : c)),
    }));
  }

  function removeTaxi(index: number) {
    setContacts((prev) => ({ ...prev, taxis: prev.taxis.filter((_, i) => i !== index) }));
  }

  function removeCoordinator(index: number) {
    setContacts((prev) => ({ ...prev, coordinators: prev.coordinators.filter((_, i) => i !== index) }));
  }

  async function handleSave() {
    for (const c of [...contacts.taxis, ...contacts.coordinators]) {
      if (!c.name.trim() || !c.phone.trim()) return;
    }
    await onSave(contacts);
  }

  function renderContactRow(
    entry: ContactEntry,
    index: number,
    onUpdate: (i: number, patch: Partial<ContactEntry>) => void,
    onRemove: (i: number) => void,
  ) {
    return (
      <div key={index} className="bg-white rounded-lg border border-charcoal/10 p-3 space-y-2">
        <div className="flex items-start gap-2">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="type-body-small text-charcoal/60 mb-1 block">Nombre</label>
              <Input
                value={entry.name}
                onChange={(e) => onUpdate(index, { name: e.target.value })}
                placeholder="Nombre del contacto"
              />
            </div>
            <div>
              <label className="type-body-small text-charcoal/60 mb-1 block">Teléfono</label>
              <Input
                type="tel"
                value={entry.phone}
                onChange={(e) => {
                  const phone = e.target.value;
                  const digits = phone.replace(/[^0-9]/g, '');
                  const whatsappUrl = digits ? `https://wa.me/${digits}` : undefined;
                  onUpdate(index, { phone, whatsappUrl });
                }}
                placeholder="+34600000000"
              />
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-charcoal/40 hover:text-red-600 mt-6"
            onClick={() => onRemove(index)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className="type-body-small text-charcoal/60 mb-1 block">WhatsApp URL</label>
            <Input
              type="url"
              value={entry.whatsappUrl ?? ''}
              onChange={(e) => onUpdate(index, { whatsappUrl: e.target.value || undefined })}
              placeholder="https://wa.me/34..."
              className="text-sm"
            />
          </div>
          <div>
            <label className="type-body-small text-charcoal/60 mb-1 block">Rol</label>
            <Input
              value={entry.role ?? ''}
              onChange={(e) => onUpdate(index, { role: e.target.value || undefined })}
              placeholder="taxi / coordinator"
              className="text-sm"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Phone className="h-5 w-5 text-ocean" />
          <h2 className="type-body-base font-semibold text-charcoal">Contactos rápidos</h2>
          <span className="text-xs bg-charcoal/10 text-charcoal/60 rounded-full px-2 py-0.5">
            {contacts.taxis.length + contacts.coordinators.length}
          </span>
        </div>
        <Button size="sm" onClick={handleSave} disabled={!dirty || saving}>
          {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
          Guardar cambios
        </Button>
      </div>

      {/* Taxis */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-charcoal/50" />
          <h3 className="type-body-small font-medium text-charcoal/80">
            Taxis
          </h3>
          <span className="text-xs bg-charcoal/5 text-charcoal/50 rounded-full px-2 py-0.5">
            {contacts.taxis.length}
          </span>
        </div>
        <div className="space-y-2">
          {contacts.taxis.map((entry, i) =>
            renderContactRow(entry, i, updateTaxi, removeTaxi)
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            setContacts((prev) => ({ ...prev, taxis: [...prev.taxis, emptyContact('taxi')] }))
          }
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Añadir taxi
        </Button>
      </div>

      <Separator />

      {/* Coordinators */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-charcoal/50" />
          <h3 className="type-body-small font-medium text-charcoal/80">
            Coordinadores
          </h3>
          <span className="text-xs bg-charcoal/5 text-charcoal/50 rounded-full px-2 py-0.5">
            {contacts.coordinators.length}
          </span>
        </div>
        <div className="space-y-2">
          {contacts.coordinators.map((entry, i) =>
            renderContactRow(entry, i, updateCoordinator, removeCoordinator)
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            setContacts((prev) => ({
              ...prev,
              coordinators: [...prev.coordinators, emptyContact('coordinator')],
            }))
          }
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Añadir coordinador
        </Button>
      </div>
    </div>
  );
}
