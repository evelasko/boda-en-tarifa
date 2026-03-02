'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Star, Save, Loader2, Download, Info } from 'lucide-react';
import type { Recommendation } from '@/types/content-admin';
import { RECOMMENDATION_CATEGORIES } from '@/types/content-admin';

interface RecommendationsEditorProps {
  recommendations: Recommendation[];
  onSave: (recs: Recommendation[]) => Promise<void>;
  onDownload: () => void;
  saving: boolean;
}

export default function RecommendationsEditor({
  recommendations: initial,
  onSave,
  onDownload,
  saving,
}: RecommendationsEditorProps) {
  const [recs, setRecs] = useState<Recommendation[]>(initial);
  const dirty = JSON.stringify(recs) !== JSON.stringify(initial);

  function update(index: number, patch: Partial<Recommendation>) {
    setRecs((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function remove(index: number) {
    setRecs((prev) => prev.filter((_, i) => i !== index));
  }

  function add() {
    setRecs((prev) => [...prev, { name: '', description: '' }]);
  }

  async function handleSave() {
    for (const r of recs) {
      if (!r.name.trim() || !r.description.trim()) return;
    }
    await onSave(recs);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-ocean" />
          <h2 className="type-body-base font-semibold text-charcoal">Recomendaciones de Tarifa</h2>
          <span className="text-xs bg-charcoal/10 text-charcoal/60 rounded-full px-2 py-0.5">
            {recs.length}
          </span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onDownload}>
            <Download className="mr-1.5 h-4 w-4" />
            Descargar JSON
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!dirty || saving}>
            {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
            Guardar cambios
          </Button>
        </div>
      </div>

      <div className="flex items-start gap-2 bg-ocean/5 border border-ocean/20 rounded-lg px-3 py-2 text-sm text-charcoal/70">
        <Info className="h-4 w-4 text-ocean mt-0.5 shrink-0" />
        <span>
          Las recomendaciones se distribuyen como asset del app, no vía Remote Config.
          Usa &quot;Descargar JSON&quot; para obtener el archivo actualizado.
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {recs.map((rec, i) => (
          <div key={i} className="bg-white rounded-lg border border-charcoal/10 p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <label className="type-body-small text-charcoal/60 mb-1 block">Nombre</label>
                <Input
                  value={rec.name}
                  onChange={(e) => update(i, { name: e.target.value })}
                  placeholder="Nombre del lugar"
                  className="font-medium"
                />
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

            <div>
              <label className="type-body-small text-charcoal/60 mb-1 block">Categoría</label>
              <Select
                value={rec.category ?? '__none__'}
                onValueChange={(v) => update(i, { category: v === '__none__' ? undefined : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sin categoría</SelectItem>
                  {RECOMMENDATION_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="type-body-small text-charcoal/60 mb-1 block">Descripción</label>
              <Textarea
                value={rec.description}
                onChange={(e) => update(i, { description: e.target.value })}
                placeholder="Descripción del lugar..."
                rows={3}
              />
            </div>

            <div>
              <label className="type-body-small text-charcoal/60 mb-1 block">URL del mapa</label>
              <Input
                type="url"
                value={rec.mapUrl ?? ''}
                onChange={(e) => update(i, { mapUrl: e.target.value || undefined })}
                placeholder="https://maps.apple.com/?q=..."
                className="text-sm"
              />
            </div>

            <div>
              <label className="type-body-small text-charcoal/60 mb-1 block">URL de imagen</label>
              <Input
                type="url"
                value={rec.imageUrl ?? ''}
                onChange={(e) => update(i, { imageUrl: e.target.value || undefined })}
                placeholder="https://..."
                className="text-sm"
              />
            </div>
          </div>
        ))}
      </div>

      <Button variant="outline" size="sm" onClick={add}>
        <Plus className="mr-1.5 h-4 w-4" />
        Añadir recomendación
      </Button>
    </div>
  );
}
