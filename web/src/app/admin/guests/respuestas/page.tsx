'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  ClipboardList,
  Link2,
  Loader2,
  RefreshCw,
  Search,
} from 'lucide-react';
import RsvpResponsesTable from '@/components/admin/RsvpResponsesTable';
import EditRsvpResponseModal, {
  type EditRsvpResponsePayload,
} from '@/components/admin/EditRsvpResponseModal';
import type {
  AdminRsvpDetailListResponse,
  AdminRsvpDetailRow,
  AdminRsvpLinkBucket,
} from '@/types/admin-rsvp-response';
import type { AttendanceStatus, RsvpSubmissionSource } from '@/types/rsvp';
import { RSVP_SOURCE_LABELS } from '@/lib/rsvp-display-labels';

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

function StatCard({
  label,
  value,
  variant,
}: {
  label: string;
  value: number;
  variant?: 'sage' | 'ocean' | 'muted';
}) {
  const colorClasses = {
    sage: 'text-sage',
    ocean: 'text-ocean',
    muted: 'text-charcoal/50',
  };
  return (
    <div className="rounded-lg border border-charcoal/10 bg-white px-4 py-3">
      <p className="text-xs text-charcoal/50">{label}</p>
      <p
        className={`type-heading-6 mt-0.5 ${variant ? colorClasses[variant] : 'text-charcoal'}`}
      >
        {value}
      </p>
    </div>
  );
}

export default function AdminRsvpResponsesPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<AdminRsvpDetailRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterAttendance, setFilterAttendance] = useState<AttendanceStatus | 'all'>('all');
  const [filterSubmitted, setFilterSubmitted] = useState<'all' | 'true' | 'false'>('all');
  const [filterLinkStatus, setFilterLinkStatus] = useState<AdminRsvpLinkBucket | 'all'>('all');
  const [filterSource, setFilterSource] = useState<RsvpSubmissionSource | 'all'>('all');
  const [editOpen, setEditOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<AdminRsvpDetailRow | null>(null);

  const fetchRows = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/admin/rsvp-responses/details', user);
      if (!res.ok) throw new Error('fetch');
      const data = (await res.json()) as AdminRsvpDetailListResponse;
      setRows(data.rows);
    } catch {
      setError('No se pudieron cargar las respuestas RSVP');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const filteredRows = useMemo(() => {
    let result = rows;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((r) => {
        if (r.rsvpUid.toLowerCase().includes(q)) return true;
        if (r.userEmail.toLowerCase().includes(q)) return true;
        if (r.displayName.toLowerCase().includes(q)) return true;
        if (r.dietaryRestrictions.toLowerCase().includes(q)) return true;
        if (r.roomSharing.toLowerCase().includes(q)) return true;
        if (r.linkedGuest?.fullName.toLowerCase().includes(q)) return true;
        if (r.linkedGuest?.email.toLowerCase().includes(q)) return true;
        if (r.suggestedGuest?.fullName.toLowerCase().includes(q)) return true;
        if (r.suggestedGuest?.email.toLowerCase().includes(q)) return true;
        return false;
      });
    }
    if (filterAttendance !== 'all') {
      result = result.filter((r) => r.attendance === filterAttendance);
    }
    if (filterSubmitted === 'true') {
      result = result.filter((r) => r.isSubmitted);
    } else if (filterSubmitted === 'false') {
      result = result.filter((r) => !r.isSubmitted);
    }
    if (filterLinkStatus !== 'all') {
      result = result.filter((r) => r.linkStatus === filterLinkStatus);
    }
    if (filterSource !== 'all') {
      result = result.filter((r) => r.source === filterSource);
    }
    return result;
  }, [rows, search, filterAttendance, filterSubmitted, filterLinkStatus, filterSource]);

  const handleEditRow = useCallback((row: AdminRsvpDetailRow) => {
    setEditingRow(row);
    setEditOpen(true);
  }, []);

  const handleSaveEdit = useCallback(
    async ({ rsvpUid, responses }: EditRsvpResponsePayload) => {
      if (!user) throw new Error('No autenticado');
      const res = await apiFetch(`/api/admin/rsvp-responses/${rsvpUid}`, user, {
        method: 'PATCH',
        body: JSON.stringify({ responses }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? 'No se pudo actualizar la respuesta RSVP');
      }
      await fetchRows();
    },
    [user, fetchRows]
  );

  const stats = useMemo(
    () => ({
      total: rows.length,
      submitted: rows.filter((r) => r.isSubmitted).length,
      draft: rows.filter((r) => !r.isSubmitted).length,
      linked: rows.filter((r) => r.linkStatus === 'linked').length,
    }),
    [rows]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/admin/guests"
            className="inline-flex items-center text-sm text-ocean hover:underline mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver a invitados
          </Link>
          <h1 className="type-heading-4 text-charcoal">Respuestas RSVP</h1>
          <p className="text-charcoal/60 type-body-small mt-1 max-w-2xl">
            Todas las respuestas del formulario con detalle de asistencia, alojamiento y
            preferencias. Para enlazar respuestas con invitados, usa Enlazar RSVP.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/guests/rsvp">
              <Link2 className="mr-1.5 h-4 w-4" />
              Enlazar RSVP
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={fetchRows} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="ml-2">Actualizar</span>
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-lg px-4 py-3 text-sm">
          <span>{error}</span>
          <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setError(null)}>
            Cerrar
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Enviados" value={stats.submitted} variant="sage" />
        <StatCard label="Borradores" value={stats.draft} variant="muted" />
        <StatCard label="Enlazados" value={stats.linked} variant="ocean" />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-charcoal/40" />
          <Input
            placeholder="Buscar por nombre, email, dieta, habitación…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={filterAttendance}
          onValueChange={(v) => setFilterAttendance(v as AttendanceStatus | 'all')}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Asistencia" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toda asistencia</SelectItem>
            <SelectItem value="yes">Asiste</SelectItem>
            <SelectItem value="no">No asiste</SelectItem>
            <SelectItem value="maybe">Quizás</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filterSubmitted}
          onValueChange={(v) => setFilterSubmitted(v as 'all' | 'true' | 'false')}
        >
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="true">Enviado</SelectItem>
            <SelectItem value="false">Borrador</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filterLinkStatus}
          onValueChange={(v) => setFilterLinkStatus(v as AdminRsvpLinkBucket | 'all')}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Enlace" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos enlaces</SelectItem>
            <SelectItem value="linked">Enlazadas</SelectItem>
            <SelectItem value="auto_match">Coincidencia email</SelectItem>
            <SelectItem value="needs_review">Revisión</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filterSource}
          onValueChange={(v) => setFilterSource(v as RsvpSubmissionSource | 'all')}
        >
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Origen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos orígenes</SelectItem>
            <SelectItem value="web">{RSVP_SOURCE_LABELS.web}</SelectItem>
            <SelectItem value="whatsapp">{RSVP_SOURCE_LABELS.whatsapp}</SelectItem>
            <SelectItem value="manual">{RSVP_SOURCE_LABELS.manual}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading && rows.length === 0 ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-ocean" />
        </div>
      ) : (
        <>
          <p className="text-sm text-charcoal/50 flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            {filteredRows.length} respuesta{filteredRows.length !== 1 ? 's' : ''}
            {filteredRows.length !== rows.length && ` (de ${rows.length})`}
          </p>
          <RsvpResponsesTable rows={filteredRows} onEditRow={handleEditRow} />
        </>
      )}

      <EditRsvpResponseModal
        open={editOpen}
        onOpenChange={setEditOpen}
        row={editingRow}
        onSave={handleSaveEdit}
      />
    </div>
  );
}
