'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Clock,
  Download,
  RefreshCw,
  Loader2,
  Lock,
  Unlock,
} from 'lucide-react';
import { toast } from 'sonner';
import TimeGatedCard from '@/components/admin/TimeGatedCard';
import type { TimeGatedItem, MenuPayload, SeatingPayload } from '@/types/time-gated';

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

export default function TimeGatedContentPage() {
  const { user } = useAuth();

  const [items, setItems] = useState<TimeGatedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingMeta, setSavingMeta] = useState<string | null>(null);
  const [savingPayload, setSavingPayload] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/admin/content/time-gated', user);
      if (!res.ok) throw new Error('Error fetching');
      const data = await res.json();
      setItems(data.items ?? []);
    } catch {
      setError('Error al cargar el contenido programado');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  async function handleUpdateMeta(id: string, title: string, unlockAt: string) {
    if (!user) return;
    setSavingMeta(id);
    try {
      const res = await apiFetch(`/api/admin/content/time-gated/${id}`, user, {
        method: 'PUT',
        body: JSON.stringify({ title, unlockAt }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al guardar');
      }
      const updated = await res.json();
      setItems((prev) => prev.map((it) => (it.id === id ? updated : it)));
      toast.success('Metadatos actualizados');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al actualizar');
    } finally {
      setSavingMeta(null);
    }
  }

  async function handleUpdatePayload(id: string, payload: MenuPayload | SeatingPayload) {
    if (!user) return;
    setSavingPayload(id);
    try {
      const res = await apiFetch(`/api/admin/content/time-gated/${id}`, user, {
        method: 'PUT',
        body: JSON.stringify({ payload }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al guardar');
      }
      const updated = await res.json();
      setItems((prev) => prev.map((it) => (it.id === id ? updated : it)));
      toast.success('Contenido actualizado');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al guardar el contenido');
    } finally {
      setSavingPayload(null);
    }
  }

  async function handleUploadImage(id: string, file: File) {
    if (!user) return;
    setUploadingImage(id);
    try {
      const token = await user.getIdToken();
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`/api/admin/content/time-gated/${id}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al subir');
      }

      const { publicId } = await res.json();
      setItems((prev) =>
        prev.map((it) =>
          it.id === id
            ? { ...it, payload: { ...(it.payload ?? {}), imagePublicId: publicId } }
            : it
        )
      );
      toast.success('Imagen subida correctamente');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al subir la imagen');
    } finally {
      setUploadingImage(null);
    }
  }

  async function handleClearImage(id: string) {
    if (!user) return;
    setSavingPayload(id);
    try {
      const res = await apiFetch(`/api/admin/content/time-gated/${id}`, user, {
        method: 'PUT',
        body: JSON.stringify({ payload: {} }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al eliminar');
      }
      const updated = await res.json();
      setItems((prev) => prev.map((it) => (it.id === id ? updated : it)));
      toast.success('Imagen eliminada');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al eliminar la imagen');
    } finally {
      setSavingPayload(null);
    }
  }

  async function handleExportJson() {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/admin/content/time-gated/export-json', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'time_gates_json.json';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('JSON exportado');
    } catch {
      toast.error('Error al exportar el JSON');
    }
  }

  const now = new Date();
  const lockedCount = items.filter((it) => new Date(it.unlockAt) > now).length;
  const unlockedCount = items.length - lockedCount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="type-heading-4 text-charcoal">Contenido Programado</h1>
          <p className="text-charcoal/60 type-body-small mt-1">
            Gestiona el contenido con fecha de publicación — menú y asignación de mesas
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchAll}>
            <RefreshCw className="mr-1.5 h-4 w-4" />
            Actualizar
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportJson}>
            <Download className="mr-1.5 h-4 w-4" />
            Exportar JSON
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label="Total"
          value={items.length}
          icon={<Clock className="h-4 w-4" />}
        />
        <StatCard
          label="Bloqueados"
          value={lockedCount}
          icon={<Lock className="h-4 w-4" />}
          variant="ocean"
        />
        <StatCard
          label="Desbloqueados"
          value={unlockedCount}
          icon={<Unlock className="h-4 w-4" />}
          variant="sage"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-lg px-4 py-3 text-sm">
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={fetchAll} className="ml-auto">
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Reintentar
          </Button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-ocean" />
        </div>
      ) : (
        <div className="space-y-6">
          {items.map((item) => (
            <TimeGatedCard
              key={item.id}
              item={item}
              onUpdateMeta={handleUpdateMeta}
              onUpdatePayload={handleUpdatePayload}
              onUploadImage={handleUploadImage}
              onClearImage={handleClearImage}
              savingMeta={savingMeta === item.id}
              savingPayload={savingPayload === item.id}
              uploadingImage={uploadingImage === item.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  variant,
}: {
  label: string;
  value: number;
  icon?: React.ReactNode;
  variant?: 'sage' | 'ocean' | 'muted';
}) {
  const colorClasses = {
    sage: 'text-sage',
    ocean: 'text-ocean',
    muted: 'text-charcoal/50',
  };
  const valueColor = variant ? colorClasses[variant] : 'text-charcoal';

  return (
    <div className="bg-white rounded-lg border border-charcoal/10 p-4">
      <div className="flex items-center gap-2 text-charcoal/60 type-body-small mb-1">
        {icon}
        <span>{label}</span>
      </div>
      <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
    </div>
  );
}
