'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Download, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { arrayMove } from '@dnd-kit/sortable';
import OverrideToggle from '@/components/admin/OverrideToggle';
import TimelineEditor from '@/components/admin/TimelineEditor';
import EventFormModal from '@/components/admin/EventFormModal';
import type {
  TimelineEvent,
  TimelineVenue,
  TimelineOverride,
  CreateTimelineEventInput,
} from '@/types/timeline';

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

export default function TimelinePage() {
  const { user } = useAuth();

  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [venues, setVenues] = useState<TimelineVenue[]>([]);
  const [override, setOverride] = useState<TimelineOverride>({
    eventId: '',
    active: false,
    updatedAt: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [formOpen, setFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<TimelineEvent | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const [eventsRes, overrideRes, venuesRes] = await Promise.all([
        apiFetch('/api/admin/timeline', user),
        apiFetch('/api/admin/timeline/override', user),
        apiFetch('/api/admin/content/venues', user).catch(() => null),
      ]);

      if (!eventsRes.ok) throw new Error('Error fetching events');
      const eventsData = await eventsRes.json();
      setEvents(eventsData);

      if (overrideRes.ok) {
        const overrideData = await overrideRes.json();
        setOverride(overrideData);
      }

      if (venuesRes?.ok) {
        const venuesData = await venuesRes.json();
        // Venues come from config/venues — may be an array or object with venues key
        const venueList = Array.isArray(venuesData) ? venuesData : (venuesData.venues ?? []);
        setVenues(venueList);
      }
    } catch {
      setError('Error al cargar los datos del timeline');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // CRUD handlers
  async function handleSaveEvent(data: CreateTimelineEventInput) {
    if (!user) return;

    if (editingEvent) {
      // Update
      const res = await apiFetch(`/api/admin/timeline/${editingEvent.id}`, user, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al actualizar');
      }
      toast.success('Evento actualizado');
    } else {
      // Create
      const res = await apiFetch('/api/admin/timeline', user, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al crear');
      }
      toast.success('Evento creado');
    }

    await fetchData();
  }

  async function handleDeleteEvent(event: TimelineEvent) {
    if (!user) return;
    setDeleting(true);
    try {
      const res = await apiFetch(`/api/admin/timeline/${event.id}`, user, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Error deleting');
      setDeleteConfirm(null);
      toast.success('Evento eliminado');
      await fetchData();
    } catch {
      toast.error('Error al eliminar el evento');
    } finally {
      setDeleting(false);
    }
  }

  async function handleOverrideToggle(active: boolean, eventId: string) {
    if (!user) return;
    try {
      const res = await apiFetch('/api/admin/timeline/override', user, {
        method: 'PUT',
        body: JSON.stringify({ active, eventId }),
      });
      if (!res.ok) throw new Error('Error updating override');
      const data = await res.json();
      setOverride({ ...data, updatedAt: new Date().toISOString() });
      toast.success(active ? 'Override activado' : 'Override desactivado');
    } catch {
      toast.error('Error al actualizar el override');
    }
  }

  async function handleReorder(dayNumber: number, oldIndex: number, newIndex: number) {
    if (!user) return;

    // Get events for this day, sorted
    const dayEvents = events
      .filter((e) => e.dayNumber === dayNumber)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    const reordered = arrayMove(dayEvents, oldIndex, newIndex);

    // Optimistic update — swap events in the full list
    const otherEvents = events.filter((e) => e.dayNumber !== dayNumber);
    setEvents([...otherEvents, ...reordered]);

    // Build batch update with swapped start/end times
    const originalTimes = dayEvents.map((e) => ({
      startTime: e.startTime,
      endTime: e.endTime,
    }));

    const batchEvents = reordered.map((event, idx) => ({
      id: event.id,
      startTime: originalTimes[idx].startTime,
      endTime: originalTimes[idx].endTime,
      dayNumber,
    }));

    try {
      const res = await apiFetch('/api/admin/timeline/reorder', user, {
        method: 'PUT',
        body: JSON.stringify({ events: batchEvents }),
      });
      if (!res.ok) throw new Error('Error reordering');
      toast.success('Orden actualizado');
      await fetchData();
    } catch {
      toast.error('Error al reordenar');
      await fetchData(); // Revert optimistic update
    }
  }

  async function handleExport() {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/admin/timeline/export-json', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'event_schedule.json';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('JSON exportado');
    } catch {
      toast.error('Error al exportar');
    }
  }

  function handleEdit(event: TimelineEvent) {
    setEditingEvent(event);
    setFormOpen(true);
  }

  function handleAdd() {
    setEditingEvent(null);
    setFormOpen(true);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="type-heading-4 text-charcoal">Timeline</h1>
          <p className="text-charcoal/60 type-body-small mt-1">
            Gestión del programa de eventos y hero banner
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-1.5 h-4 w-4" />
            Exportar JSON
          </Button>
          <Button size="sm" onClick={handleAdd}>
            <Plus className="mr-1.5 h-4 w-4" />
            Añadir evento
          </Button>
        </div>
      </div>

      {/* Override toggle */}
      <OverrideToggle
        override={override}
        events={events}
        onToggle={handleOverrideToggle}
        disabled={loading || events.length === 0}
      />

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-lg px-4 py-3 text-sm">
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={fetchData} className="ml-auto">
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
        <TimelineEditor
          events={events}
          venues={venues}
          onEdit={handleEdit}
          onDelete={(event) => setDeleteConfirm(event)}
          onReorder={handleReorder}
        />
      )}

      {/* Event form modal */}
      <EventFormModal
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingEvent(null);
        }}
        event={editingEvent}
        venues={venues}
        onSave={handleSaveEvent}
      />

      {/* Delete confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-charcoal/70">
            ¿Seguro que quieres eliminar el evento{' '}
            <strong>{deleteConfirm?.title}</strong>?
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirm(null)}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDeleteEvent(deleteConfirm)}
              disabled={deleting}
            >
              {deleting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
