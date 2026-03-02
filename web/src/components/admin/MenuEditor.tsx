'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, GripVertical, Save, Loader2, UtensilsCrossed } from 'lucide-react';
import type { MenuPayload, MenuItem } from '@/types/time-gated';
import { DIETARY_TAGS } from '@/types/time-gated';

interface MenuEditorProps {
  payload: MenuPayload;
  onSave: (payload: MenuPayload) => Promise<void>;
  saving: boolean;
}

const EMPTY_ITEM: MenuItem = { name: '', description: '', dietary: [] };

export default function MenuEditor({ payload: initial, onSave, saving }: MenuEditorProps) {
  const [items, setItems] = useState<MenuItem[]>(initial.items ?? []);
  const [notes, setNotes] = useState(initial.notes ?? '');
  const dirty =
    JSON.stringify({ items, notes }) !== JSON.stringify({ items: initial.items ?? [], notes: initial.notes ?? '' });

  function updateItem(index: number, patch: Partial<MenuItem>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function addItem() {
    setItems((prev) => [...prev, { ...EMPTY_ITEM }]);
  }

  function moveItem(from: number, to: number) {
    if (to < 0 || to >= items.length) return;
    setItems((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(from, 1);
      copy.splice(to, 0, moved);
      return copy;
    });
  }

  function toggleDietary(index: number, tag: string) {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const has = item.dietary.includes(tag);
        return {
          ...item,
          dietary: has ? item.dietary.filter((t) => t !== tag) : [...item.dietary, tag],
        };
      })
    );
  }

  async function handleSave() {
    for (const item of items) {
      if (!item.name.trim()) return;
    }
    await onSave({ items, notes: notes.trim() || undefined });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="h-5 w-5 text-ocean" />
          <h3 className="type-body-base font-semibold text-charcoal">Platos del menú</h3>
          <span className="text-xs bg-charcoal/10 text-charcoal/60 rounded-full px-2 py-0.5">
            {items.length}
          </span>
        </div>
        <Button size="sm" onClick={handleSave} disabled={!dirty || saving}>
          {saving ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-1.5 h-4 w-4" />
          )}
          Guardar menú
        </Button>
      </div>

      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="bg-white rounded-lg border border-charcoal/10 p-4 space-y-3">
            <div className="flex items-start gap-2">
              <div className="flex flex-col gap-1 pt-2">
                <button
                  type="button"
                  className="text-charcoal/30 hover:text-charcoal/60 disabled:opacity-30"
                  disabled={i === 0}
                  onClick={() => moveItem(i, i - 1)}
                  aria-label="Mover arriba"
                >
                  <GripVertical className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="type-body-small text-charcoal/60 mb-1 block">Nombre del plato *</label>
                    <Input
                      value={item.name}
                      onChange={(e) => updateItem(i, { name: e.target.value })}
                      placeholder="Tataki de atún"
                    />
                  </div>
                  <div>
                    <label className="type-body-small text-charcoal/60 mb-1 block">Descripción</label>
                    <Input
                      value={item.description ?? ''}
                      onChange={(e) => updateItem(i, { description: e.target.value || undefined })}
                      placeholder="Con salsa ponzu y sésamo"
                    />
                  </div>
                </div>
                <div>
                  <label className="type-body-small text-charcoal/60 mb-1 block">Etiquetas dietéticas</label>
                  <div className="flex flex-wrap gap-1.5">
                    {DIETARY_TAGS.map((tag) => {
                      const active = item.dietary.includes(tag);
                      return (
                        <Badge
                          key={tag}
                          variant={active ? 'default' : 'outline'}
                          className={`cursor-pointer select-none transition-colors ${
                            active
                              ? 'bg-sage text-white hover:bg-sage/80'
                              : 'hover:bg-charcoal/5'
                          }`}
                          onClick={() => toggleDietary(i, tag)}
                        >
                          {tag}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-charcoal/40 hover:text-red-600 mt-2"
                onClick={() => removeItem(i)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Button variant="outline" size="sm" onClick={addItem}>
        <Plus className="mr-1.5 h-4 w-4" />
        Añadir plato
      </Button>

      <div>
        <label className="type-body-small text-charcoal/60 mb-1 block">
          Notas generales (dietéticas, alérgenos, etc.)
        </label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Opciones vegetarianas disponibles. Consulta con los novios si tienes alergias."
          rows={3}
        />
      </div>
    </div>
  );
}
