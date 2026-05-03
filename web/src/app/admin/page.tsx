'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Users,
  CheckCircle,
  HelpCircle,
  XCircle,
  Loader2,
  RefreshCw,
  MailWarning,
  UserCheck,
  Baby,
  Eye,
  Heart,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import type { GuestWithRSVP } from '@/types/guest';
import { RELATIONSHIP_STATUS_LABELS, SIDE_LABELS } from '@/types/guest';
import { computeAdminOverviewStats } from '@/lib/admin-overview-stats';

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

function StatBar({ label, count, pct }: { label: string; count: number; pct: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm gap-2">
        <span className="text-charcoal/80">{label}</span>
        <span className="text-charcoal/60 tabular-nums shrink-0">
          {count} ({pct}%)
        </span>
      </div>
      <div className="h-2 rounded-full bg-charcoal/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-ocean/80 transition-[width] duration-300"
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
    </div>
  );
}

export default function AdminOverviewPage() {
  const { user } = useAuth();
  const [guests, setGuests] = useState<GuestWithRSVP[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGuests = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/admin/guests', user);
      if (!res.ok) throw new Error('fetch failed');
      const data: GuestWithRSVP[] = await res.json();
      setGuests(data);
    } catch {
      setError('No se pudieron cargar las estadísticas');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchGuests();
  }, [fetchGuests]);

  const s = useMemo(() => computeAdminOverviewStats(guests), [guests]);

  const summaryCards = useMemo(
    () => [
      {
        title: 'Total Invitados',
        value: s.total,
        icon: Users,
        color: 'bg-ocean/10 text-ocean',
      },
      {
        title: 'Confirmados',
        value: s.rsvp.confirmed,
        icon: CheckCircle,
        color: 'bg-sage/10 text-sage',
      },
      {
        title: 'Pendientes',
        value: s.rsvp.pending,
        icon: HelpCircle,
        color: 'bg-sand/10 text-sand',
      },
      {
        title: 'No Asisten',
        value: s.rsvp.declined,
        icon: XCircle,
        color: 'bg-coral/10 text-coral',
      },
    ],
    [s]
  );

  const secondaryCards = useMemo(
    () => [
      {
        title: 'Contacto pendiente',
        value: s.contactPending,
        subtitle: 'Sin email / teléfono aún',
        icon: MailWarning,
        color: 'bg-amber-500/10 text-amber-800',
      },
      {
        title: 'Perfil reclamado',
        value: s.profileClaimed,
        subtitle: `De ${s.total} invitados`,
        icon: UserCheck,
        color: 'bg-ocean/10 text-ocean',
      },
      {
        title: 'Menores',
        value: s.minors,
        subtitle: 'Marcados como menor',
        icon: Baby,
        color: 'bg-sage/10 text-sage',
      },
      {
        title: 'Visibles en directorio',
        value: s.directoryVisible,
        subtitle: 'Listado público activo',
        icon: Eye,
        color: 'bg-charcoal/10 text-charcoal',
      },
    ],
    [s]
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="type-heading-4 text-charcoal">Resumen</h1>
        {!loading && user && (
          <Button variant="outline" size="sm" onClick={() => void fetchGuests()} className="self-start sm:self-auto">
            <RefreshCw className="h-4 w-4 mr-1.5" />
            Actualizar
          </Button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-lg px-4 py-3 text-sm">
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={() => void fetchGuests()} className="ml-auto">
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Reintentar
          </Button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-ocean" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {summaryCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className="bg-white rounded-lg border border-charcoal/10 p-5"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-md ${card.color}`}>
                      <Icon size={20} />
                    </div>
                    <span className="text-sm text-charcoal/60">{card.title}</span>
                  </div>
                  <p className="text-2xl font-bold text-charcoal">{card.value}</p>
                </div>
              );
            })}
          </div>

          {s.rsvp.maybe > 0 && (
            <p className="text-sm text-charcoal/60 -mt-4">
              Respuestas «quizás»: <span className="font-medium text-charcoal">{s.rsvp.maybe}</span>
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {secondaryCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className="bg-white rounded-lg border border-charcoal/10 p-5"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-md ${card.color}`}>
                      <Icon size={20} />
                    </div>
                    <span className="text-sm text-charcoal/60">{card.title}</span>
                  </div>
                  <p className="text-2xl font-bold text-charcoal">{card.value}</p>
                  <p className="text-xs text-charcoal/50 mt-1">{card.subtitle}</p>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="bg-white rounded-lg border border-charcoal/10 p-5">
              <h2 className="type-body-base font-semibold text-charcoal mb-4 flex items-center gap-2">
                <Users className="h-4 w-4 text-ocean" aria-hidden />
                Invitados por lado
              </h2>
              <div className="space-y-3">
                {(['novioA', 'novioB', 'ambos'] as const).map((side) => (
                  <StatBar
                    key={side}
                    label={SIDE_LABELS[side]}
                    count={s.side[side].count}
                    pct={s.side[side].pctOfTotal}
                  />
                ))}
              </div>
            </section>

            <section className="bg-white rounded-lg border border-charcoal/10 p-5">
              <h2 className="type-body-base font-semibold text-charcoal mb-4 flex items-center gap-2">
                <Heart className="h-4 w-4 text-coral" aria-hidden />
                Estado sentimental
              </h2>
              <div className="space-y-3">
                {(['soltero', 'enPareja', 'buscando'] as const).map((r) => (
                  <StatBar
                    key={r}
                    label={RELATIONSHIP_STATUS_LABELS[r]}
                    count={s.relationship[r].count}
                    pct={s.relationship[r].pctOfTotal}
                  />
                ))}
              </div>
            </section>
          </div>

          <section className="bg-white rounded-lg border border-charcoal/10 p-5">
            <h2 className="type-body-base font-semibold text-charcoal mb-2">Edades</h2>
            <p className="text-sm text-charcoal/60 mb-4">
              {s.ages.withAgeCount > 0 ? (
                <>
                  Edad media:{' '}
                  <span className="font-medium text-charcoal">{s.ages.average} años</span>
                  <span className="text-charcoal/50">
                    {' '}
                    (según {s.ages.withAgeCount} invitado{s.ages.withAgeCount !== 1 ? 's' : ''} con edad en ficha)
                  </span>
                </>
              ) : (
                <span>No hay edades numéricas registradas en las fichas.</span>
              )}
              {s.ages.unknownCount > 0 && (
                <span className="block mt-1">
                  Sin edad o no parseable:{' '}
                  <span className="font-medium text-charcoal">{s.ages.unknownCount}</span> invitado
                  {s.ages.unknownCount !== 1 ? 's' : ''}
                </span>
              )}
            </p>
            <div className="space-y-3 max-w-2xl">
              {s.ages.buckets.map((b) => (
                <StatBar key={b.key} label={`${b.label} años`} count={b.count} pct={b.pctOfTotal} />
              ))}
            </div>
            <p className="text-xs text-charcoal/45 mt-4">
              Los tramos y porcentajes son sobre el total de invitados; la columna de edad puede venir vacía o en
              formato no numérico desde la hoja.
            </p>
          </section>
        </>
      )}
    </div>
  );
}
