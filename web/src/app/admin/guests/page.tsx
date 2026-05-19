'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Users,
  Plus,
  Upload,
  Download,
  Link as LinkIcon,
  Trash2,
  Search,
  Loader2,
  RefreshCw,
  FileSpreadsheet,
} from 'lucide-react';
import GuestTable from '@/components/admin/GuestTable';
import GuestFormModal from '@/components/admin/GuestFormModal';
import CSVImportModal from '@/components/admin/CSVImportModal';
import MagicLinkModal from '@/components/admin/MagicLinkModal';
import ManualRsvpModal, { type ManualRsvpPayload } from '@/components/admin/ManualRsvpModal';
import type { GuestWithRSVP, CreateGuestInput, CSVGuestRow } from '@/types/guest';

type SheetSyncOutcome = {
  created: number;
  updated: number;
  unchanged: number;
  errors: Array<{ sheetRow: number; messages: string[] }>;
  dryRun: boolean;
};

async function apiFetch(path: string, user: { getIdToken: () => Promise<string> }, options?: RequestInit) {
  const token = await user.getIdToken();
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  });
  return res;
}

export default function GuestsPage() {
  const { user } = useAuth();

  const [guests, setGuests] = useState<GuestWithRSVP[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [filterSide, setFilterSide] = useState<string>('all');
  const [filterRsvp, setFilterRsvp] = useState<string>('all');
  const [filterClaimed, setFilterClaimed] = useState<string>('all');

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modals
  const [formOpen, setFormOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<GuestWithRSVP | null>(null);
  const [csvOpen, setCsvOpen] = useState(false);
  const [magicLinkOpen, setMagicLinkOpen] = useState(false);
  const [magicLinkGuest, setMagicLinkGuest] = useState<string>('');
  const [magicLinkUrl, setMagicLinkUrl] = useState<string | null>(null);
  const [magicLinkWhatsappShareUrl, setMagicLinkWhatsappShareUrl] = useState<string | null>(null);
  const [magicLinkSmsShareUrl, setMagicLinkSmsShareUrl] = useState<string | null>(null);
  const [magicLinkLoading, setMagicLinkLoading] = useState(false);
  const [magicLinkError, setMagicLinkError] = useState<string | null>(null);
  const [manualRsvpGuest, setManualRsvpGuest] = useState<GuestWithRSVP | null>(null);
  const [manualRsvpSuccess, setManualRsvpSuccess] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<GuestWithRSVP | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const [sheetSyncOpen, setSheetSyncOpen] = useState(false);
  const [sheetSyncDryRun, setSheetSyncDryRun] = useState(false);
  const [sheetSyncLoading, setSheetSyncLoading] = useState(false);
  const [sheetSyncOutcome, setSheetSyncOutcome] = useState<SheetSyncOutcome | null>(null);
  const [sheetSyncError, setSheetSyncError] = useState<string | null>(null);

  const fetchGuests = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/admin/guests', user);
      if (!res.ok) throw new Error('Error fetching guests');
      const data = await res.json();
      setGuests(data);
    } catch {
      setError('Error al cargar los invitados');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchGuests();
  }, [fetchGuests]);

  // Client-side filtering
  const filteredGuests = useMemo(() => {
    let result = guests;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (g) =>
          g.fullName.toLowerCase().includes(q) ||
          (g.preferredName ?? '').toLowerCase().includes(q) ||
          g.email.toLowerCase().includes(q)
      );
    }
    if (filterSide !== 'all') {
      result = result.filter((g) => g.side === filterSide);
    }
    if (filterRsvp !== 'all') {
      result = result.filter(
        (g) =>
          g.rsvpStatus === filterRsvp &&
          (filterRsvp !== 'no_response' || !g.child)
      );
    }
    if (filterClaimed !== 'all') {
      result = result.filter((g) => g.profileClaimed === (filterClaimed === 'true'));
    }
    return result;
  }, [guests, search, filterSide, filterRsvp, filterClaimed]);

  // Stats
  const stats = useMemo(() => ({
    total: guests.length,
    attending: guests.filter((g) => g.rsvpStatus === 'yes').length,
    noResponse: guests.filter((g) => g.rsvpStatus === 'no_response' && !g.child).length,
    claimed: guests.filter((g) => g.profileClaimed).length,
  }), [guests]);

  // Handlers
  async function handleSaveGuest(data: CreateGuestInput & { tableName?: string; seatNumber?: number }) {
    if (!user) return;
    const { tableName, seatNumber, ...guestData } = data;

    if (editingGuest) {
      const res = await apiFetch(`/api/admin/guests/${editingGuest.uid}`, user, {
        method: 'PUT',
        body: JSON.stringify({ ...guestData, tableName, seatNumber }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al actualizar');
      }
    } else {
      const res = await apiFetch('/api/admin/guests', user, {
        method: 'POST',
        body: JSON.stringify(guestData),
      });
      const created = await res.json();
      if (!res.ok) {
        throw new Error(created.error || 'Error al crear');
      }
      if (tableName || seatNumber) {
        await apiFetch(`/api/admin/guests/${created.uid}`, user, {
          method: 'PUT',
          body: JSON.stringify({ tableName, seatNumber }),
        });
      }
    }

    await fetchGuests();
  }

  function handleEdit(guest: GuestWithRSVP) {
    setEditingGuest(guest);
    setFormOpen(true);
  }

  function handleAdd() {
    setEditingGuest(null);
    setFormOpen(true);
  }

  async function handleDelete(guest: GuestWithRSVP) {
    if (!user) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/admin/guests/${guest.uid}`, user, { method: 'DELETE' });
      setDeleteConfirm(null);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(guest.uid);
        return next;
      });
      await fetchGuests();
    } catch {
      setError('Error al eliminar el invitado');
    } finally {
      setDeleting(false);
    }
  }

  async function handleBulkDelete() {
    if (!user || selectedIds.size === 0) return;
    setBulkDeleting(true);
    try {
      await Promise.all(
        Array.from(selectedIds).map((uid) =>
          apiFetch(`/api/admin/guests/${uid}`, user, { method: 'DELETE' })
        )
      );
      setSelectedIds(new Set());
      setBulkDeleteConfirm(false);
      await fetchGuests();
    } catch {
      setError('Error al eliminar invitados');
    } finally {
      setBulkDeleting(false);
    }
  }

  async function handleMagicLink(guest: GuestWithRSVP) {
    if (!user) return;
    setMagicLinkGuest(guest.fullName);
    setMagicLinkUrl(null);
    setMagicLinkWhatsappShareUrl(null);
    setMagicLinkSmsShareUrl(null);
    setMagicLinkError(null);
    setMagicLinkLoading(true);
    setMagicLinkOpen(true);

    try {
      const res = await apiFetch(`/api/admin/guests/${guest.uid}/magic-link`, user, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Error generating magic link');
      const data = await res.json();
      setMagicLinkUrl(data.magicLinkUrl);
      setMagicLinkWhatsappShareUrl(data.whatsappShareUrl ?? null);
      setMagicLinkSmsShareUrl(data.smsShareUrl ?? null);
    } catch {
      setMagicLinkError('Error al generar el magic link');
    } finally {
      setMagicLinkLoading(false);
    }
  }

  async function handleBulkMagicLinks() {
    if (!user || selectedIds.size === 0) return;

    const selectedGuests = guests.filter((g) => selectedIds.has(g.uid));
    const results: Array<{
      uid: string;
      fullName: string;
      email: string;
      phoneE164: string;
      whatsappNumber: string;
      whatsappShareUrl: string;
      smsShareUrl: string;
      magicLinkUrl: string;
    }> = [];

    for (const guest of selectedGuests) {
      try {
        const res = await apiFetch(`/api/admin/guests/${guest.uid}/magic-link`, user, {
          method: 'POST',
        });
        if (res.ok) {
          const data = await res.json();
          results.push({
            uid: guest.uid,
            fullName: guest.fullName,
            email: guest.email,
            phoneE164: data.guestPhoneE164 ?? guest.phoneE164 ?? '',
            whatsappNumber: data.guestWhatsappNumber ?? guest.whatsappNumber ?? '',
            whatsappShareUrl: data.whatsappShareUrl ?? '',
            smsShareUrl: data.smsShareUrl ?? '',
            magicLinkUrl: data.magicLinkUrl,
          });
        }
      } catch {
        // Skip failed ones
      }
    }

    if (results.length > 0) {
      const csv = [
        'uid,fullName,email,phoneE164,whatsappNumber,whatsappShareUrl,smsShareUrl,magicLinkUrl',
        ...results.map(
          (r) =>
            `${r.uid},"${r.fullName}",${r.email},${r.phoneE164},${r.whatsappNumber},${r.whatsappShareUrl},${r.smsShareUrl},${r.magicLinkUrl}`
        ),
      ].join('\n');
      downloadCSV(csv, `magic-links-${new Date().toISOString().slice(0, 10)}.csv`);
    }
  }

  async function handleSheetSync() {
    if (!user) return;
    setSheetSyncLoading(true);
    setSheetSyncError(null);
    setSheetSyncOutcome(null);
    try {
      const res = await apiFetch('/api/admin/guests/sync-sheet', user, {
        method: 'POST',
        body: JSON.stringify({ dryRun: sheetSyncDryRun }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSheetSyncError(typeof data.error === 'string' ? data.error : 'Error al sincronizar');
        return;
      }
      setSheetSyncOutcome(data as SheetSyncOutcome);
      if (!sheetSyncDryRun) {
        await fetchGuests();
      }
    } catch {
      setSheetSyncError('Error al sincronizar la hoja');
    } finally {
      setSheetSyncLoading(false);
    }
  }

  async function handleCSVImport(rows: Array<{ row: number; data: CSVGuestRow }>) {
    if (!user) return;
    const res = await apiFetch('/api/admin/guests/import', user, {
      method: 'POST',
      body: JSON.stringify({ rows }),
    });
    if (!res.ok) throw new Error('Import failed');
    await fetchGuests();
  }

  async function handleExport() {
    if (!user) return;
    const params = new URLSearchParams();
    if (filterSide !== 'all') params.set('side', filterSide);
    if (filterRsvp !== 'all') params.set('rsvpStatus', filterRsvp);
    if (filterClaimed !== 'all') params.set('profileClaimed', filterClaimed);
    if (search) params.set('search', search);

    const token = await user.getIdToken();
    const res = await fetch(`/api/admin/guests/export?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invitados-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleOpenManualRsvp(guest: GuestWithRSVP) {
    setManualRsvpSuccess(null);
    setManualRsvpGuest(guest);
  }

  async function handleSaveManualRsvp(payload: ManualRsvpPayload) {
    if (!user || !manualRsvpGuest) return;
    setError(null);
    const res = await apiFetch(`/api/admin/guests/${manualRsvpGuest.uid}/rsvp`, user, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const fieldErrors = body.fieldErrors as Record<string, string> | undefined;
      if (fieldErrors && Object.keys(fieldErrors).length > 0) {
        throw new Error(Object.values(fieldErrors)[0]);
      }
      throw new Error(body.error || 'No se pudo guardar el RSVP manual');
    }

    await fetchGuests();
    setManualRsvpSuccess(`RSVP manual guardado para ${manualRsvpGuest.fullName}.`);
    setManualRsvpGuest(null);
  }

  const existingEmails = useMemo(
    () => new Set(guests.map((g) => g.email.toLowerCase())),
    [guests]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="type-heading-4 text-charcoal">Invitados</h1>
          <p className="text-charcoal/60 type-body-small mt-1">
            Gestión completa de la lista de invitados
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/guests/respuestas">
              <LinkIcon className="mr-1.5 h-4 w-4" />
              Respuestas RSVP
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSheetSyncOutcome(null);
              setSheetSyncError(null);
              setSheetSyncOpen(true);
            }}
          >
            <FileSpreadsheet className="mr-1.5 h-4 w-4" />
            Sincronizar hoja
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCsvOpen(true)}>
            <Upload className="mr-1.5 h-4 w-4" />
            Importar CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-1.5 h-4 w-4" />
            Exportar
          </Button>
          <Button size="sm" onClick={handleAdd}>
            <Plus className="mr-1.5 h-4 w-4" />
            Añadir invitado
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total" value={stats.total} icon={<Users className="h-4 w-4" />} />
        <StatCard label="Asisten" value={stats.attending} variant="sage" />
        <StatCard label="Sin respuesta" value={stats.noResponse} variant="muted" />
        <StatCard label="Perfil reclamado" value={stats.claimed} variant="ocean" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-charcoal/40" />
          <Input
            placeholder="Buscar por nombre, email o teléfono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterSide} onValueChange={setFilterSide}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Lado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los lados</SelectItem>
            <SelectItem value="novioA">Novio A (Enrique)</SelectItem>
            <SelectItem value="novioB">Novio B (Manuel)</SelectItem>
            <SelectItem value="ambos">Ambos</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterRsvp} onValueChange={setFilterRsvp}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="RSVP" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos RSVP</SelectItem>
            <SelectItem value="yes">Asiste</SelectItem>
            <SelectItem value="no">No asiste</SelectItem>
            <SelectItem value="maybe">Quizás</SelectItem>
            <SelectItem value="no_response">Sin respuesta</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterClaimed} onValueChange={setFilterClaimed}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Perfil" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="true">Reclamado</SelectItem>
            <SelectItem value="false">No reclamado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 bg-ocean/5 border border-ocean/20 rounded-lg px-4 py-2.5">
          <Badge variant="secondary">{selectedIds.size} seleccionado{selectedIds.size !== 1 ? 's' : ''}</Badge>
          <div className="flex gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkMagicLinks}
            >
              <LinkIcon className="mr-1.5 h-3.5 w-3.5" />
              Generar Magic Links
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => setBulkDeleteConfirm(true)}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Eliminar
            </Button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-lg px-4 py-3 text-sm">
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={fetchGuests} className="ml-auto">
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Reintentar
          </Button>
        </div>
      )}

      {manualRsvpSuccess && (
        <div className="flex items-center gap-2 text-sage bg-sage/10 border border-sage/20 rounded-lg px-4 py-3 text-sm">
          <span>{manualRsvpSuccess}</span>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-ocean" />
        </div>
      ) : (
        <GuestTable
          guests={filteredGuests}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onEdit={handleEdit}
          onDelete={(g) => setDeleteConfirm(g)}
          onMagicLink={handleMagicLink}
          onManualRsvp={handleOpenManualRsvp}
        />
      )}

      {/* Modals */}
      <GuestFormModal
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingGuest(null);
        }}
        guest={editingGuest}
        onSave={handleSaveGuest}
        existingSeating={editingGuest?.seating ?? null}
      />

      <Dialog
        open={sheetSyncOpen}
        onOpenChange={(open) => {
          setSheetSyncOpen(open);
          if (!open) {
            setSheetSyncOutcome(null);
            setSheetSyncError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Sincronizar con Google Sheet</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-charcoal/70">
            Lee la pestaña configurada en el servidor y actualiza invitados y mesas en Firestore.
            Las filas eliminadas de la hoja no borran invitados en la base de datos.
          </p>
          <div className="flex items-center gap-2 py-2">
            <Checkbox
              id="sheet-dry-run"
              checked={sheetSyncDryRun}
              onCheckedChange={(v) => setSheetSyncDryRun(v === true)}
            />
            <Label htmlFor="sheet-dry-run" className="text-sm font-normal cursor-pointer">
              Solo simular (dry run, no guardar cambios)
            </Label>
          </div>
          {sheetSyncError && (
            <div className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{sheetSyncError}</div>
          )}
          {sheetSyncOutcome && (
            <div className="rounded-md border border-charcoal/10 bg-charcoal/5 px-3 py-2 text-sm space-y-1">
              {sheetSyncOutcome.dryRun && (
                <p className="font-medium text-charcoal/80">Simulación — no se guardó nada</p>
              )}
              <p>Creados: {sheetSyncOutcome.created}</p>
              <p>Actualizados: {sheetSyncOutcome.updated}</p>
              <p>Sin cambios: {sheetSyncOutcome.unchanged}</p>
              {sheetSyncOutcome.errors.length > 0 && (
                <div className="mt-2 pt-2 border-t border-charcoal/10">
                  <p className="font-medium text-red-700 mb-1">
                    Errores ({sheetSyncOutcome.errors.length} filas)
                  </p>
                  <ul className="max-h-40 overflow-y-auto space-y-1 text-charcoal/80">
                    {sheetSyncOutcome.errors.map((e) => (
                      <li key={e.sheetRow}>
                        Fila {e.sheetRow}: {e.messages.join('; ')}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setSheetSyncOpen(false)}
              disabled={sheetSyncLoading}
            >
              Cerrar
            </Button>
            <Button onClick={handleSheetSync} disabled={sheetSyncLoading}>
              {sheetSyncLoading ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  Sincronizando…
                </>
              ) : sheetSyncDryRun ? (
                'Simular'
              ) : (
                'Sincronizar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CSVImportModal
        open={csvOpen}
        onOpenChange={setCsvOpen}
        onImport={handleCSVImport}
        existingEmails={existingEmails}
      />

      <MagicLinkModal
        open={magicLinkOpen}
        onOpenChange={setMagicLinkOpen}
        guestName={magicLinkGuest}
        magicLinkUrl={magicLinkUrl}
        whatsappShareUrl={magicLinkWhatsappShareUrl}
        smsShareUrl={magicLinkSmsShareUrl}
        loading={magicLinkLoading}
        error={magicLinkError}
      />

      <ManualRsvpModal
        open={Boolean(manualRsvpGuest)}
        onOpenChange={(open) => {
          if (!open) setManualRsvpGuest(null);
        }}
        guest={manualRsvpGuest}
        guests={guests}
        onSave={handleSaveManualRsvp}
      />

      {/* Delete confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-charcoal/70">
            ¿Seguro que quieres eliminar a <strong>{deleteConfirm?.fullName}</strong>?
            Esto también eliminará su RSVP y asignación de asiento.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} disabled={deleting}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              disabled={deleting}
            >
              {deleting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk delete confirmation */}
      <Dialog open={bulkDeleteConfirm} onOpenChange={setBulkDeleteConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar eliminación masiva</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-charcoal/70">
            ¿Seguro que quieres eliminar <strong>{selectedIds.size}</strong> invitado{selectedIds.size !== 1 ? 's' : ''}?
            Se eliminarán también sus RSVPs y asignaciones de asiento.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDeleteConfirm(false)} disabled={bulkDeleting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleBulkDelete} disabled={bulkDeleting}>
              {bulkDeleting ? 'Eliminando...' : `Eliminar ${selectedIds.size}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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

function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
