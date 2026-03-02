'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MapPin,
  Phone,
  Star,
  Wind,
  Download,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import VenueEditor from '@/components/admin/VenueEditor';
import QuickContactsEditor from '@/components/admin/QuickContactsEditor';
import RecommendationsEditor from '@/components/admin/RecommendationsEditor';
import WindTipsEditor from '@/components/admin/WindTipsEditor';
import type { AdminVenue, QuickContacts, Recommendation, WindTips } from '@/types/content-admin';

async function apiFetch(path: string, user: { getIdToken: () => Promise<string> }, options?: RequestInit) {
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

export default function ContentPage() {
  const { user } = useAuth();

  const [venues, setVenues] = useState<AdminVenue[]>([]);
  const [contacts, setContacts] = useState<QuickContacts>({ taxis: [], coordinators: [] });
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [windTips, setWindTips] = useState<WindTips>({ levante: [], poniente: [], other: [] });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingSection, setSavingSection] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const [venuesRes, contactsRes, recsRes, tipsRes] = await Promise.all([
        apiFetch('/api/admin/content/venues', user),
        apiFetch('/api/admin/content/contacts', user),
        apiFetch('/api/admin/content/recommendations', user),
        apiFetch('/api/admin/content/wind-tips', user),
      ]);
      if (!venuesRes.ok || !contactsRes.ok || !recsRes.ok || !tipsRes.ok) {
        throw new Error('Error fetching content');
      }
      const [venuesData, contactsData, recsData, tipsData] = await Promise.all([
        venuesRes.json(),
        contactsRes.json(),
        recsRes.json(),
        tipsRes.json(),
      ]);
      setVenues(venuesData.items ?? []);
      setContacts({ taxis: contactsData.taxis ?? [], coordinators: contactsData.coordinators ?? [] });
      setRecommendations(recsData.items ?? []);
      setWindTips({ levante: tipsData.levante ?? [], poniente: tipsData.poniente ?? [], other: tipsData.other ?? [] });
    } catch {
      setError('Error al cargar el contenido');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Save handlers
  async function handleSaveVenues(items: AdminVenue[]) {
    if (!user) return;
    setSavingSection('venues');
    try {
      const res = await apiFetch('/api/admin/content/venues', user, {
        method: 'PUT',
        body: JSON.stringify({ items }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al guardar');
      }
      const data = await res.json();
      setVenues(data.items);
      toast.success('Venues guardados');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al guardar los venues');
    } finally {
      setSavingSection(null);
    }
  }

  async function handleSaveContacts(data: QuickContacts) {
    if (!user) return;
    setSavingSection('contacts');
    try {
      const res = await apiFetch('/api/admin/content/contacts', user, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al guardar');
      }
      const result = await res.json();
      setContacts({ taxis: result.taxis, coordinators: result.coordinators });
      toast.success('Contactos guardados');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al guardar los contactos');
    } finally {
      setSavingSection(null);
    }
  }

  async function handleSaveRecommendations(items: Recommendation[]) {
    if (!user) return;
    setSavingSection('recommendations');
    try {
      const res = await apiFetch('/api/admin/content/recommendations', user, {
        method: 'PUT',
        body: JSON.stringify({ items }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al guardar');
      }
      const data = await res.json();
      setRecommendations(data.items);
      toast.success('Recomendaciones guardadas');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al guardar las recomendaciones');
    } finally {
      setSavingSection(null);
    }
  }

  async function handleSaveWindTips(data: WindTips) {
    if (!user) return;
    setSavingSection('wind-tips');
    try {
      const res = await apiFetch('/api/admin/content/wind-tips', user, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al guardar');
      }
      const result = await res.json();
      setWindTips({ levante: result.levante, poniente: result.poniente, other: result.other });
      toast.success('Consejos de viento guardados');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al guardar los consejos de viento');
    } finally {
      setSavingSection(null);
    }
  }

  async function handleDownloadRecommendations() {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/admin/content/recommendations/download', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'recommendations.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Error al descargar las recomendaciones');
    }
  }

  async function handleExportAll() {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/admin/content/export-json', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `content-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Error al exportar el contenido');
    }
  }

  const stats = useMemo(() => ({
    venues: venues.length,
    contacts: contacts.taxis.length + contacts.coordinators.length,
    recommendations: recommendations.length,
    windTips: windTips.levante.length + windTips.poniente.length + windTips.other.length,
  }), [venues, contacts, recommendations, windTips]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="type-heading-4 text-charcoal">Contenido</h1>
          <p className="text-charcoal/60 type-body-small mt-1">
            Gestiona venues, contactos, recomendaciones y consejos de viento
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchAll}>
            <RefreshCw className="mr-1.5 h-4 w-4" />
            Actualizar
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportAll}>
            <Download className="mr-1.5 h-4 w-4" />
            Exportar todo JSON
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Venues" value={stats.venues} icon={<MapPin className="h-4 w-4" />} />
        <StatCard label="Contactos" value={stats.contacts} icon={<Phone className="h-4 w-4" />} variant="ocean" />
        <StatCard label="Recomendaciones" value={stats.recommendations} icon={<Star className="h-4 w-4" />} variant="sage" />
        <StatCard label="Consejos de viento" value={stats.windTips} icon={<Wind className="h-4 w-4" />} variant="muted" />
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

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-ocean" />
        </div>
      ) : (
        <Tabs defaultValue="venues" className="space-y-4">
          <TabsList>
            <TabsTrigger value="venues">
              Venues
              <Badge variant="secondary" className="ml-2 text-[10px] px-1.5">{stats.venues}</Badge>
            </TabsTrigger>
            <TabsTrigger value="contacts">
              Contactos
              <Badge variant="secondary" className="ml-2 text-[10px] px-1.5">{stats.contacts}</Badge>
            </TabsTrigger>
            <TabsTrigger value="recommendations">
              Recomendaciones
              <Badge variant="secondary" className="ml-2 text-[10px] px-1.5">{stats.recommendations}</Badge>
            </TabsTrigger>
            <TabsTrigger value="wind-tips">
              Viento
              <Badge variant="secondary" className="ml-2 text-[10px] px-1.5">{stats.windTips}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="venues">
            <VenueEditor venues={venues} onSave={handleSaveVenues} saving={savingSection === 'venues'} />
          </TabsContent>
          <TabsContent value="contacts">
            <QuickContactsEditor contacts={contacts} onSave={handleSaveContacts} saving={savingSection === 'contacts'} />
          </TabsContent>
          <TabsContent value="recommendations">
            <RecommendationsEditor
              recommendations={recommendations}
              onSave={handleSaveRecommendations}
              onDownload={handleDownloadRecommendations}
              saving={savingSection === 'recommendations'}
            />
          </TabsContent>
          <TabsContent value="wind-tips">
            <WindTipsEditor tips={windTips} onSave={handleSaveWindTips} saving={savingSection === 'wind-tips'} />
          </TabsContent>
        </Tabs>
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
