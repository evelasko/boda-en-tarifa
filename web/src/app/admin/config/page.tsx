'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, Upload, RefreshCw, Loader2 } from 'lucide-react';
import ConfigTable from '@/components/admin/ConfigTable';
import ConfigExportModal from '@/components/admin/ConfigExportModal';
import type { RemoteConfigEntry } from '@/types/remote-config';

async function apiFetch(
  path: string,
  user: { getIdToken: () => Promise<string> },
  options?: RequestInit
) {
  const token = await user.getIdToken();
  return fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  });
}

export default function ConfigPage() {
  const { user } = useAuth();

  const [entries, setEntries] = useState<RemoteConfigEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);

  const fetchEntries = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/admin/config', user);
      if (!res.ok) throw new Error('Error fetching config');
      const data = await res.json();
      setEntries(data);
    } catch {
      setError('Error al cargar la configuración remota');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleSave = useCallback(
    async (key: string, value: string) => {
      if (!user) return;
      const res = await apiFetch(`/api/admin/config/${key}`, user, {
        method: 'PUT',
        body: JSON.stringify({ value }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al guardar');
      }

      const updated: RemoteConfigEntry = await res.json();
      setEntries((prev) =>
        prev.map((e) => (e.key === key ? updated : e))
      );
    },
    [user]
  );

  const fetchExport = useCallback(async (): Promise<Record<string, string>> => {
    if (!user) throw new Error('No autenticado');
    const res = await apiFetch('/api/admin/config/export', user);
    if (!res.ok) throw new Error('Error al exportar');
    return res.json();
  }, [user]);

  const populatedCount = entries.filter((e) => e.value && e.value.trim()).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="type-heading-4 text-charcoal">Remote Config</h1>
          <p className="text-charcoal/60 type-body-small mt-1">
            Gestión centralizada de los valores de Firebase Remote Config
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={fetchEntries} disabled={loading}>
            <RefreshCw className={`mr-1.5 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button size="sm" onClick={() => setExportOpen(true)} disabled={loading}>
            <Upload className="mr-1.5 h-4 w-4" />
            Exportar para Firebase
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-lg border border-charcoal/10 p-4">
          <div className="flex items-center gap-2 text-charcoal/60 type-body-small mb-1">
            <Settings className="h-4 w-4" />
            <span>Total claves</span>
          </div>
          <p className="text-2xl font-bold text-charcoal">{entries.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-charcoal/10 p-4">
          <div className="text-charcoal/60 type-body-small mb-1">Con valor</div>
          <p className="text-2xl font-bold text-sage">{populatedCount}</p>
        </div>
        <div className="bg-white rounded-lg border border-charcoal/10 p-4">
          <div className="text-charcoal/60 type-body-small mb-1">Sin valor</div>
          <p className="text-2xl font-bold text-charcoal/50">
            {entries.length - populatedCount}
          </p>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-ocean/5 border border-ocean/20 rounded-lg px-4 py-3">
        <p className="text-sm text-charcoal/70">
          Los valores se guardan en Firestore (<code className="bg-charcoal/5 px-1 rounded text-xs">remote_config/</code>).
          Usa el botón <strong>Exportar para Firebase</strong> para copiar todos los valores
          y pegarlos en la{' '}
          <a
            href="https://console.firebase.google.com/project/_/config"
            target="_blank"
            rel="noopener noreferrer"
            className="text-ocean underline underline-offset-2"
          >
            Consola de Firebase Remote Config
          </a>.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-lg px-4 py-3 text-sm">
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={fetchEntries} className="ml-auto">
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Reintentar
          </Button>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-ocean" />
        </div>
      ) : (
        <>
          {entries.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-charcoal/40 mb-2">
              <Badge variant="outline" className="text-ocean border-ocean/30 text-[10px]">
                JSON
              </Badge>
              <span>= valor JSON editado con editor</span>
              <Badge variant="outline" className="text-sage border-sage/30 text-[10px] ml-2">
                String
              </Badge>
              <span>= valor de texto simple</span>
            </div>
          )}
          <ConfigTable entries={entries} onSave={handleSave} />
        </>
      )}

      {/* Export modal */}
      <ConfigExportModal
        open={exportOpen}
        onOpenChange={setExportOpen}
        fetchExport={fetchExport}
      />
    </div>
  );
}
