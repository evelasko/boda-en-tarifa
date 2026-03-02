'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { RefreshCw, Loader2, Bell, Send, Clock } from 'lucide-react';
import NotificationComposer from '@/components/admin/NotificationComposer';
import NotificationHistory from '@/components/admin/NotificationHistory';
import ScheduledNotifications from '@/components/admin/ScheduledNotifications';
import type { SentNotification, ScheduledNotification } from '@/types/notification';

async function apiFetch(
  path: string,
  user: { getIdToken: () => Promise<string> }
) {
  const token = await user.getIdToken();
  return fetch(path, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export default function NotificationsPage() {
  const { user } = useAuth();

  const [history, setHistory] = useState<SentNotification[]>([]);
  const [scheduled, setScheduled] = useState<ScheduledNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const [historyRes, scheduledRes] = await Promise.all([
        apiFetch('/api/admin/notifications/history', user),
        apiFetch('/api/admin/notifications/scheduled', user),
      ]);

      if (!historyRes.ok || !scheduledRes.ok) {
        throw new Error('Error al cargar datos');
      }

      const [historyData, scheduledData] = await Promise.all([
        historyRes.json(),
        scheduledRes.json(),
      ]);

      setHistory(historyData);
      setScheduled(scheduledData);
    } catch {
      setError('Error al cargar las notificaciones');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const manualCount = history.filter((n) => n.status === 'sent').length;
  const scheduledSent = scheduled.filter((n) => n.sent).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="type-heading-4 text-charcoal">Notificaciones</h1>
          <p className="text-charcoal/60 type-body-small mt-1">
            Broadcasting push y programación automática
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
          disabled={loading}
        >
          <RefreshCw className={`mr-1.5 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-lg border border-charcoal/10 p-4">
          <div className="flex items-center gap-2 text-charcoal/60 type-body-small mb-1">
            <Send className="h-4 w-4" />
            <span>Manuales enviadas</span>
          </div>
          <p className="text-2xl font-bold text-charcoal">{manualCount}</p>
        </div>
        <div className="bg-white rounded-lg border border-charcoal/10 p-4">
          <div className="flex items-center gap-2 text-charcoal/60 type-body-small mb-1">
            <Clock className="h-4 w-4" />
            <span>Programadas</span>
          </div>
          <p className="text-2xl font-bold text-ocean">{scheduled.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-charcoal/10 p-4">
          <div className="flex items-center gap-2 text-charcoal/60 type-body-small mb-1">
            <Bell className="h-4 w-4" />
            <span>Auto enviadas</span>
          </div>
          <p className="text-2xl font-bold text-sage">
            {scheduledSent}/{scheduled.length}
          </p>
        </div>
      </div>

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
        <>
          {/* Composer */}
          {user && (
            <NotificationComposer user={user} onSent={fetchData} />
          )}

          {/* History */}
          <NotificationHistory notifications={history} loading={loading} />

          {/* Scheduled */}
          <ScheduledNotifications notifications={scheduled} loading={loading} />
        </>
      )}
    </div>
  );
}
