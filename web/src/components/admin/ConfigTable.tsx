'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Pencil,
  ExternalLink,
  Clock,
  AlertCircle,
} from 'lucide-react';
import JsonEditor from './JsonEditor';
import type { RemoteConfigEntry } from '@/types/remote-config';

interface ConfigTableProps {
  entries: RemoteConfigEntry[];
  onSave: (key: string, value: string) => Promise<void>;
}

export default function ConfigTable({ entries, onSave }: ConfigTableProps) {
  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <ConfigCard key={entry.key} entry={entry} onSave={onSave} />
      ))}
    </div>
  );
}

function ConfigCard({
  entry,
  onSave,
}: {
  entry: RemoteConfigEntry;
  onSave: (key: string, value: string) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(entry.value);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // For development_trigger_time: datetime input
  const [dateTimeValue, setDateTimeValue] = useState(() => {
    if (entry.key === 'development_trigger_time' && entry.value) {
      try {
        const d = new Date(entry.value);
        return d.toISOString().slice(0, 16);
      } catch {
        return '';
      }
    }
    return '';
  });

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(entry.value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [entry.value]);

  const handleEdit = useCallback(() => {
    setEditing(true);
    setEditValue(entry.value);
    setSaveError(null);
    if (entry.key === 'development_trigger_time' && entry.value) {
      try {
        const d = new Date(entry.value);
        setDateTimeValue(d.toISOString().slice(0, 16));
      } catch {
        setDateTimeValue('');
      }
    }
  }, [entry]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await onSave(entry.key, editValue);
      setEditing(false);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }, [entry.key, editValue, onSave]);

  const handleDateTimeSave = useCallback(async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const isoValue = dateTimeValue
        ? new Date(dateTimeValue).toISOString()
        : '';
      await onSave(entry.key, isoValue);
      setEditing(false);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }, [entry.key, dateTimeValue, onSave]);

  const handleCancel = useCallback(() => {
    setEditing(false);
    setEditValue(entry.value);
    setSaveError(null);
  }, [entry.value]);

  const valuePreview = getValuePreview(entry);
  const isEmpty = !entry.value || entry.value.trim() === '';

  return (
    <div className="bg-white rounded-lg border border-charcoal/10 overflow-hidden">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <code className="text-sm font-semibold text-charcoal bg-charcoal/5 px-2 py-0.5 rounded">
                {entry.key}
              </code>
              <Badge
                variant="outline"
                className={entry.type === 'json' ? 'text-ocean border-ocean/30' : 'text-sage border-sage/30'}
              >
                {entry.type === 'json' ? 'JSON' : 'String'}
              </Badge>
              {isEmpty && (
                <Badge variant="outline" className="text-charcoal/40 border-charcoal/20">
                  Vacío
                </Badge>
              )}
            </div>
            <p className="text-sm text-charcoal/60 mt-1">{entry.description}</p>

            {/* Source link + timestamp */}
            <div className="flex items-center gap-4 mt-2 text-xs text-charcoal/50">
              {entry.sourcePage && (
                <Link
                  href={entry.sourcePage}
                  className="flex items-center gap-1 text-ocean hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  {entry.sourceLabel}
                </Link>
              )}
              {entry.updatedAt && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDate(entry.updatedAt)}
                  {entry.updatedBy && ` · ${entry.updatedBy}`}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              disabled={isEmpty}
              className="h-8 w-8 p-0"
              title="Copiar valor"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-sage" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEdit}
              className="h-8 w-8 p-0"
              title="Editar"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            {entry.type === 'json' && !isEmpty && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(!expanded)}
                className="h-8 w-8 p-0"
                title={expanded ? 'Colapsar' : 'Expandir'}
              >
                {expanded ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Value preview (collapsed) */}
        {!editing && !expanded && !isEmpty && (
          <div className="mt-3 px-3 py-2 bg-charcoal/2 rounded border border-charcoal/5 overflow-hidden">
            <pre className="text-xs text-charcoal/70 truncate font-mono">
              {valuePreview}
            </pre>
          </div>
        )}
      </div>

      {/* Expanded JSON view */}
      {expanded && !editing && entry.type === 'json' && !isEmpty && (
        <div className="border-t border-charcoal/10 p-4">
          <JsonEditor
            value={formatJsonSafe(entry.value)}
            onChange={() => {}}
            onSave={() => {}}
            onCancel={() => setExpanded(false)}
            readOnly
          />
        </div>
      )}

      {/* Edit mode */}
      {editing && (
        <div className="border-t border-charcoal/10 p-4">
          {saveError && (
            <div className="flex items-start gap-2 text-red-600 text-sm mb-3 bg-red-50 rounded-lg px-3 py-2">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

          {entry.key === 'development_trigger_time' ? (
            <DateTimeEditor
              value={dateTimeValue}
              onChange={setDateTimeValue}
              onSave={handleDateTimeSave}
              onCancel={handleCancel}
              saving={saving}
              currentIsoValue={entry.value}
            />
          ) : (
            <JsonEditor
              value={editValue}
              onChange={setEditValue}
              onSave={handleSave}
              onCancel={handleCancel}
              saving={saving}
            />
          )}
        </div>
      )}
    </div>
  );
}

function DateTimeEditor({
  value,
  onChange,
  onSave,
  onCancel,
  saving,
  currentIsoValue,
}: {
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  currentIsoValue: string;
}) {
  const countdown = getCountdown(value ? new Date(value) : null);

  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium text-charcoal mb-1.5 block">
          Fecha y hora de revelado (Europe/Madrid)
        </label>
        <Input
          type="datetime-local"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="max-w-xs font-mono"
        />
        {value && (
          <p className="text-xs text-charcoal/50 mt-1.5">
            ISO 8601: <code className="bg-charcoal/5 px-1 rounded">{new Date(value).toISOString()}</code>
          </p>
        )}
        {countdown && (
          <p className="text-xs text-ocean mt-1">{countdown}</p>
        )}
      </div>
      {currentIsoValue && (
        <p className="text-xs text-charcoal/40">
          Valor actual: <code className="bg-charcoal/5 px-1 rounded">{currentIsoValue}</code>
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="button" size="sm" onClick={onSave} disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>
    </div>
  );
}

function getValuePreview(entry: RemoteConfigEntry): string {
  if (!entry.value) return '';

  if (entry.type === 'json') {
    try {
      const parsed = JSON.parse(entry.value);
      const compact = JSON.stringify(parsed);
      return compact.length > 120 ? compact.slice(0, 120) + '...' : compact;
    } catch {
      return entry.value.slice(0, 120);
    }
  }

  return entry.value.length > 120 ? entry.value.slice(0, 120) + '...' : entry.value;
}

function formatJsonSafe(value: string): string {
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Europe/Madrid',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function getCountdown(target: Date | null): string | null {
  if (!target) return null;

  const now = new Date();
  const diff = target.getTime() - now.getTime();

  if (diff <= 0) return 'Ya pasó';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) return `Faltan ${days} día${days !== 1 ? 's' : ''} y ${hours} hora${hours !== 1 ? 's' : ''}`;
  return `Faltan ${hours} hora${hours !== 1 ? 's' : ''}`;
}
