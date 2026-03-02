'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, MapPin, Save, Loader2 } from 'lucide-react';
import type { AdminVenue } from '@/types/content-admin';

interface VenueEditorProps {
  venues: AdminVenue[];
  onSave: (venues: AdminVenue[]) => Promise<void>;
  saving: boolean;
}

export default function VenueEditor({ venues: initial, onSave, saving }: VenueEditorProps) {
  const [venues, setVenues] = useState<AdminVenue[]>(initial);
  const dirty = JSON.stringify(venues) !== JSON.stringify(initial);

  function update(index: number, patch: Partial<AdminVenue>) {
    setVenues((prev) => prev.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  }

  function remove(index: number) {
    setVenues((prev) => prev.filter((_, i) => i !== index));
  }

  function add() {
    setVenues((prev) => [
      ...prev,
      { id: '', name: '', latitude: 0, longitude: 0 },
    ]);
  }

  async function handleSave() {
    // Validate
    for (const v of venues) {
      if (!v.id.trim() || !v.name.trim()) return;
      if (v.latitude < -90 || v.latitude > 90) return;
      if (v.longitude < -180 || v.longitude > 180) return;
    }
    const ids = venues.map((v) => v.id);
    if (new Set(ids).size !== ids.length) return;
    await onSave(venues);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-ocean" />
          <h2 className="type-body-base font-semibold text-charcoal">Venues de la boda</h2>
          <span className="text-xs bg-charcoal/10 text-charcoal/60 rounded-full px-2 py-0.5">
            {venues.length}
          </span>
        </div>
        <Button size="sm" onClick={handleSave} disabled={!dirty || saving}>
          {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
          Guardar cambios
        </Button>
      </div>

      <div className="space-y-4">
        {venues.map((venue, i) => (
          <div key={i} className="bg-white rounded-lg border border-charcoal/10 p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-1 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="type-body-small text-charcoal/60 mb-1 block">Nombre</label>
                    <Input
                      value={venue.name}
                      onChange={(e) => update(i, { name: e.target.value })}
                      placeholder="Nombre del venue"
                    />
                  </div>
                  <div>
                    <label className="type-body-small text-charcoal/60 mb-1 block">Identificador (slug)</label>
                    <Input
                      value={venue.id}
                      onChange={(e) => update(i, { id: e.target.value })}
                      placeholder="chiringuito"
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="type-body-small text-charcoal/60 mb-1 block">Latitud</label>
                    <Input
                      type="number"
                      step="0.0001"
                      value={venue.latitude}
                      onChange={(e) => update(i, { latitude: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label className="type-body-small text-charcoal/60 mb-1 block">Longitud</label>
                    <Input
                      type="number"
                      step="0.0001"
                      value={venue.longitude}
                      onChange={(e) => update(i, { longitude: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div>
                  <label className="type-body-small text-charcoal/60 mb-1 block">Indicaciones a pie</label>
                  <Textarea
                    value={venue.walkingDirections ?? ''}
                    onChange={(e) => update(i, { walkingDirections: e.target.value || undefined })}
                    placeholder="Cómo llegar caminando..."
                    rows={2}
                  />
                </div>
                <div>
                  <label className="type-body-small text-charcoal/60 mb-1 block">Nota de terreno</label>
                  <Input
                    value={venue.terrainNote ?? ''}
                    onChange={(e) => update(i, { terrainNote: e.target.value || undefined })}
                    placeholder="Arena — recomendamos calzado plano"
                  />
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-charcoal/40 hover:text-red-600 mt-6"
                onClick={() => remove(i)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Button variant="outline" size="sm" onClick={add}>
        <Plus className="mr-1.5 h-4 w-4" />
        Añadir venue
      </Button>
    </div>
  );
}
