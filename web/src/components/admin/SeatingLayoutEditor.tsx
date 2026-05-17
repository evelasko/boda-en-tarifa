'use client';

import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Save, Trash2, Loader2, GripVertical } from 'lucide-react';
import type { SeatingLayout, SeatingLayoutInput } from '@/types/seating-layout';

type DraftRow = number[];
type Draft = {
  rows: DraftRow[];
  names: Record<string, string>;
  maxSeats: number;
};

interface Props {
  initial: SeatingLayout;
}

async function fetchWithAuth(
  path: string,
  user: { getIdToken: () => Promise<string> },
  init?: RequestInit,
): Promise<Response> {
  const token = await user.getIdToken();
  return fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  });
}

function nextAvailableTableNumber(rows: DraftRow[]): number {
  const used = new Set<number>(rows.flat());
  for (let n = 1; n <= 100; n++) {
    if (!used.has(n)) return n;
  }
  return rows.flat().reduce((max, n) => Math.max(max, n), 0) + 1;
}

export default function SeatingLayoutEditor({ initial }: Props) {
  const { user } = useAuth();
  const [draft, setDraft] = useState<Draft>({
    rows: initial.rows.map((r) => [...r]),
    names: { ...initial.names },
    maxSeats: initial.maxSeats,
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [dragging, setDragging] = useState<{ rowIdx: number; cellIdx: number } | null>(null);

  const allTableNumbers = useMemo(() => draft.rows.flat(), [draft.rows]);

  const isDirty = useMemo(() => {
    if (draft.maxSeats !== initial.maxSeats) return true;
    if (JSON.stringify(draft.rows) !== JSON.stringify(initial.rows)) return true;
    const draftKeys = Object.keys(draft.names).sort();
    const initKeys = Object.keys(initial.names).sort();
    if (draftKeys.join(',') !== initKeys.join(',')) return true;
    for (const k of draftKeys) {
      if (draft.names[k] !== initial.names[k]) return true;
    }
    return false;
  }, [draft, initial]);

  const addRow = useCallback(() => {
    setDraft((d) => ({ ...d, rows: [...d.rows, []] }));
  }, []);

  const removeRow = useCallback((rowIdx: number) => {
    setDraft((d) => {
      const removedNumbers = d.rows[rowIdx] ?? [];
      const newNames = { ...d.names };
      for (const n of removedNumbers) delete newNames[String(n)];
      return {
        ...d,
        rows: d.rows.filter((_, i) => i !== rowIdx),
        names: newNames,
      };
    });
  }, []);

  const addTable = useCallback((rowIdx: number) => {
    setDraft((d) => {
      const n = nextAvailableTableNumber(d.rows);
      const rows = d.rows.map((r, i) => (i === rowIdx ? [...r, n] : r));
      const names = { ...d.names, [String(n)]: `Mesa ${n}` };
      return { ...d, rows, names };
    });
  }, []);

  const removeTable = useCallback((rowIdx: number, cellIdx: number) => {
    setDraft((d) => {
      const target = d.rows[rowIdx]?.[cellIdx];
      const rows = d.rows.map((r, i) =>
        i === rowIdx ? r.filter((_, j) => j !== cellIdx) : r,
      );
      const names = { ...d.names };
      if (typeof target === 'number') delete names[String(target)];
      return { ...d, rows, names };
    });
  }, []);

  const renameTable = useCallback((tableNumber: number, value: string) => {
    setDraft((d) => ({
      ...d,
      names: { ...d.names, [String(tableNumber)]: value },
    }));
  }, []);

  const setMaxSeats = useCallback((value: string) => {
    const parsed = Number(value);
    setDraft((d) => ({ ...d, maxSeats: Number.isFinite(parsed) ? parsed : d.maxSeats }));
  }, []);

  const handleDragStart = useCallback((rowIdx: number, cellIdx: number) => {
    setDragging({ rowIdx, cellIdx });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    (rowIdx: number, cellIdx: number) => {
      if (!dragging) return;
      setDraft((d) => {
        const fromRow = d.rows[dragging.rowIdx];
        if (!fromRow) return d;
        const moved = fromRow[dragging.cellIdx];
        if (typeof moved !== 'number') return d;

        const rows = d.rows.map((r) => [...r]);
        rows[dragging.rowIdx].splice(dragging.cellIdx, 1);
        const targetRow = rows[rowIdx];
        if (!targetRow) return d;
        let insertAt = cellIdx;
        if (dragging.rowIdx === rowIdx && cellIdx > dragging.cellIdx) {
          insertAt = cellIdx - 1;
        }
        targetRow.splice(insertAt, 0, moved);
        return { ...d, rows };
      });
      setDragging(null);
    },
    [dragging],
  );

  const handleDropAtEnd = useCallback(
    (rowIdx: number) => {
      if (!dragging) return;
      setDraft((d) => {
        const fromRow = d.rows[dragging.rowIdx];
        if (!fromRow) return d;
        const moved = fromRow[dragging.cellIdx];
        if (typeof moved !== 'number') return d;

        const rows = d.rows.map((r) => [...r]);
        rows[dragging.rowIdx].splice(dragging.cellIdx, 1);
        rows[rowIdx].push(moved);
        return { ...d, rows };
      });
      setDragging(null);
    },
    [dragging],
  );

  const save = useCallback(async () => {
    if (!user) {
      toast.error('No autenticado');
      return;
    }
    setSaving(true);
    setErrors([]);
    try {
      const payload: SeatingLayoutInput = {
        rows: draft.rows,
        names: draft.names,
        maxSeats: draft.maxSeats,
      };
      const res = await fetchWithAuth('/api/admin/seating/layout', user, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
          details?: string[];
        };
        const details = body.details ?? (body.error ? [body.error] : ['Error al guardar']);
        setErrors(details);
        toast.error('No se pudo guardar el plano');
        return;
      }
      toast.success('Plano de mesas guardado');
      window.location.reload();
    } catch (err) {
      console.error(err);
      setErrors([err instanceof Error ? err.message : 'Error desconocido']);
      toast.error('No se pudo guardar el plano');
    } finally {
      setSaving(false);
    }
  }, [draft, user]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="type-heading-4 text-charcoal">Configurar mesas</h1>
          <p className="text-charcoal/60 type-body-small mt-1">
            Define las filas, los nombres y el aforo máximo por mesa. Arrastra una mesa para
            reordenar dentro de una fila o moverla a otra.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-charcoal/70">
            <span>Aforo máx. por mesa</span>
            <Input
              type="number"
              min={1}
              max={20}
              value={draft.maxSeats}
              onChange={(e) => setMaxSeats(e.target.value)}
              className="w-20"
            />
          </label>
          <Button onClick={save} disabled={saving || !isDirty}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar
          </Button>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 space-y-1">
          <p className="text-sm font-medium text-red-800">No se pudo guardar:</p>
          <ul className="text-sm text-red-700 list-disc list-inside">
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-4">
        {draft.rows.map((row, rowIdx) => (
          <div
            key={rowIdx}
            className="bg-white border border-charcoal/10 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs uppercase tracking-wide text-charcoal/50">
                Fila {rowIdx + 1} · {row.length} mesa{row.length === 1 ? '' : 's'}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addTable(rowIdx)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Añadir mesa
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeRow(rowIdx)}
                  className="text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Quitar fila
                </Button>
              </div>
            </div>
            <div
              className="flex flex-wrap gap-2 min-h-[3.5rem] items-center"
              onDragOver={handleDragOver}
              onDrop={() => handleDropAtEnd(rowIdx)}
            >
              {row.map((tableNumber, cellIdx) => (
                <TableChip
                  key={`${tableNumber}-${cellIdx}`}
                  tableNumber={tableNumber}
                  name={draft.names[String(tableNumber)] ?? ''}
                  onRename={(v) => renameTable(tableNumber, v)}
                  onRemove={() => removeTable(rowIdx, cellIdx)}
                  onDragStart={() => handleDragStart(rowIdx, cellIdx)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(rowIdx, cellIdx)}
                  isDragging={
                    dragging?.rowIdx === rowIdx && dragging?.cellIdx === cellIdx
                  }
                />
              ))}
              {row.length === 0 && (
                <p className="text-sm text-charcoal/40 italic">
                  Suelta una mesa aquí o pulsa &ldquo;Añadir mesa&rdquo;.
                </p>
              )}
            </div>
          </div>
        ))}
        <Button variant="outline" onClick={addRow} className="w-full">
          <Plus className="h-4 w-4" />
          Añadir fila
        </Button>
      </div>

      <div className="bg-cream/60 border border-charcoal/10 rounded-md p-4 text-sm text-charcoal/70 space-y-1">
        <p>
          <strong>{allTableNumbers.length}</strong> mesa{allTableNumbers.length === 1 ? '' : 's'} en total.
          Los números se asignan automáticamente al añadir una mesa nueva.
        </p>
        <p className="text-xs text-charcoal/50">
          El diagrama dibuja sólo asientos asignados (los huecos vacíos no se muestran). El
          aforo máximo se usa como tope al editar.
        </p>
      </div>
    </div>
  );
}

interface TableChipProps {
  tableNumber: number;
  name: string;
  onRename: (value: string) => void;
  onRemove: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  isDragging: boolean;
}

function TableChip({
  tableNumber,
  name,
  onRename,
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging,
}: TableChipProps) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={(e) => {
        e.stopPropagation();
        onDrop();
      }}
      className={`flex items-center gap-2 border border-charcoal/15 rounded-md bg-sand/30 px-2 py-1.5 ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <GripVertical className="h-4 w-4 text-charcoal/40 cursor-grab" />
      <span className="font-bold text-charcoal text-sm">#{tableNumber}</span>
      <Input
        value={name}
        onChange={(e) => onRename(e.target.value)}
        className="h-7 text-sm w-40"
        aria-label={`Nombre de la mesa ${tableNumber}`}
      />
      <button
        type="button"
        onClick={onRemove}
        className="text-charcoal/40 hover:text-red-600 p-1"
        aria-label={`Quitar mesa ${tableNumber}`}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
