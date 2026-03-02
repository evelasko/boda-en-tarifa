'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X, Wind, CloudSun, Sun, Save, Loader2 } from 'lucide-react';
import type { WindTips, WindType } from '@/types/content-admin';
import { WIND_TYPE_LABELS } from '@/types/content-admin';

interface WindTipsEditorProps {
  tips: WindTips;
  onSave: (tips: WindTips) => Promise<void>;
  saving: boolean;
}

const WIND_ICONS: Record<WindType, React.ReactNode> = {
  levante: <Wind className="h-4 w-4" />,
  poniente: <CloudSun className="h-4 w-4" />,
  other: <Sun className="h-4 w-4" />,
};

const WIND_TYPES: WindType[] = ['levante', 'poniente', 'other'];

export default function WindTipsEditor({ tips: initial, onSave, saving }: WindTipsEditorProps) {
  const [tips, setTips] = useState<WindTips>(initial);
  const dirty = JSON.stringify(tips) !== JSON.stringify(initial);
  const totalCount = tips.levante.length + tips.poniente.length + tips.other.length;

  function updateTip(type: WindType, index: number, value: string) {
    setTips((prev) => ({
      ...prev,
      [type]: prev[type].map((t, i) => (i === index ? value : t)),
    }));
  }

  function removeTip(type: WindType, index: number) {
    setTips((prev) => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index),
    }));
  }

  function addTip(type: WindType) {
    setTips((prev) => ({
      ...prev,
      [type]: [...prev[type], ''],
    }));
  }

  async function handleSave() {
    for (const type of WIND_TYPES) {
      if (tips[type].some((t) => !t.trim())) return;
    }
    await onSave(tips);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wind className="h-5 w-5 text-ocean" />
          <h2 className="type-body-base font-semibold text-charcoal">Consejos de viento</h2>
          <span className="text-xs bg-charcoal/10 text-charcoal/60 rounded-full px-2 py-0.5">
            {totalCount}
          </span>
        </div>
        <Button size="sm" onClick={handleSave} disabled={!dirty || saving}>
          {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
          Guardar cambios
        </Button>
      </div>

      <div className="space-y-6">
        {WIND_TYPES.map((type) => (
          <div key={type} className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-charcoal/50">{WIND_ICONS[type]}</span>
              <h3 className="type-body-small font-medium text-charcoal/80">
                {WIND_TYPE_LABELS[type]}
              </h3>
              <span className="text-xs bg-charcoal/5 text-charcoal/50 rounded-full px-2 py-0.5">
                {tips[type].length}
              </span>
            </div>

            <div className="space-y-2">
              {tips[type].map((tip, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="type-body-small text-charcoal/40 w-6 text-right shrink-0">
                    {i + 1}.
                  </span>
                  <Input
                    value={tip}
                    onChange={(e) => updateTip(type, i, e.target.value)}
                    placeholder="Escribe un consejo..."
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-charcoal/30 hover:text-red-600 shrink-0"
                    onClick={() => removeTip(type, i)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <Button variant="outline" size="sm" onClick={() => addTip(type)}>
              <Plus className="mr-1.5 h-4 w-4" />
              Añadir consejo
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
