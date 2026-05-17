'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  Loader2,
  RefreshCw,
  Search,
  Link2,
  Unlink,
  Check,
} from 'lucide-react';
import type {
  AdminRsvpResponseRow,
  AdminRsvpListResponse,
  AdminRsvpLinkBucket,
} from '@/types/admin-rsvp-response';
import type { GuestWithRSVP } from '@/types/guest';

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

function attendanceLabel(a: AdminRsvpResponseRow['attendance']): string {
  if (a === 'yes') return 'Asiste';
  if (a === 'no') return 'No asiste';
  if (a === 'maybe') return 'Quizás';
  return '—';
}

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString('es-ES', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

function RsvpTable({
  rows,
  tab,
  busyUids,
  onApplyAuto,
  onOpenLink,
  onUnlink,
}: {
  rows: AdminRsvpResponseRow[];
  tab: AdminRsvpLinkBucket;
  busyUids: Set<string>;
  onApplyAuto: (row: AdminRsvpResponseRow) => void;
  onOpenLink: (row: AdminRsvpResponseRow) => void;
  onUnlink: (row: AdminRsvpResponseRow) => void;
}) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-charcoal/60 py-10 text-center border border-dashed border-charcoal/15 rounded-lg">
        No hay respuestas en esta categoría.
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-charcoal/10 bg-white overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-charcoal/3 hover:bg-charcoal/3">
            <TableHead className="font-semibold">UID RSVP</TableHead>
            <TableHead className="font-semibold">Email</TableHead>
            <TableHead className="font-semibold">Nombre</TableHead>
            <TableHead className="font-semibold">Asistencia</TableHead>
            <TableHead className="font-semibold">Estado</TableHead>
            <TableHead className="font-semibold">Invitado</TableHead>
            <TableHead className="font-semibold">Actualizado</TableHead>
            <TableHead className="text-right font-semibold">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const busy = busyUids.has(row.rsvpUid);
            const guestCell =
              tab === 'linked'
                ? row.linkedGuest
                : tab === 'auto_match'
                  ? row.suggestedGuest
                  : row.linkedGuest ?? row.suggestedGuest;

            return (
              <TableRow key={row.rsvpUid}>
                <TableCell className="font-mono text-xs max-w-[140px] truncate text-charcoal" title={row.rsvpUid}>
                  {row.rsvpUid}
                </TableCell>
                <TableCell className="max-w-[180px] truncate text-charcoal" title={row.userEmail}>
                  {row.userEmail || '—'}
                </TableCell>
                <TableCell className="max-w-[160px] truncate text-charcoal">{row.displayName}</TableCell>
                <TableCell>{attendanceLabel(row.attendance)}</TableCell>
                <TableCell>
                  {row.isSubmitted ? (
                    <Badge variant="secondary" className="bg-sage/15 text-sage border-sage/20">
                      Enviado
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-charcoal/70">
                      Borrador
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="max-w-[220px] text-charcoal">
                  {guestCell ? (
                    <div className="text-sm">
                      <div className="font-medium truncate" title={guestCell.fullName}>
                        {guestCell.fullName}
                      </div>
                      <div className="text-charcoal/50 text-xs font-mono truncate" title={guestCell.uid}>
                        {guestCell.uid}
                      </div>
                      {guestCell.email ? (
                        <div className="text-xs text-charcoal/60 truncate">{guestCell.email}</div>
                      ) : null}
                    </div>
                  ) : (
                    <span className="text-charcoal/40">—</span>
                  )}
                </TableCell>
                <TableCell className="text-charcoal/70 text-xs whitespace-nowrap">
                  {formatWhen(row.lastUpdatedAt)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-wrap justify-end gap-1.5">
                    {tab === 'auto_match' && row.suggestedGuest ? (
                      <Button
                        size="sm"
                        variant="default"
                        className="h-8"
                        disabled={busy}
                        onClick={() => onApplyAuto(row)}
                      >
                        {busy ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <>
                            <Check className="h-3.5 w-3.5 mr-1" />
                            Aplicar
                          </>
                        )}
                      </Button>
                    ) : null}
                    {tab === 'needs_review' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8"
                        disabled={busy}
                        onClick={() => onOpenLink(row)}
                      >
                        <Link2 className="h-3.5 w-3.5 mr-1" />
                        Enlazar
                      </Button>
                    ) : null}
                    {tab === 'linked' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-red-700 hover:text-red-800 hover:bg-red-50"
                        disabled={busy}
                        onClick={() => onUnlink(row)}
                      >
                        {busy ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <>
                            <Unlink className="h-3.5 w-3.5 mr-1" />
                            Quitar
                          </>
                        )}
                      </Button>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export default function AdminGuestRsvpLinkPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<AdminRsvpResponseRow[]>([]);
  const [counts, setCounts] = useState<AdminRsvpListResponse['counts'] | null>(null);
  const [guests, setGuests] = useState<GuestWithRSVP[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<AdminRsvpLinkBucket>('needs_review');
  const [busyUids, setBusyUids] = useState<Set<string>>(() => new Set());

  const [linkRow, setLinkRow] = useState<AdminRsvpResponseRow | null>(null);
  const [guestPickSearch, setGuestPickSearch] = useState('');
  const [selectedGuestUid, setSelectedGuestUid] = useState<string | null>(null);
  const [linkNotes, setLinkNotes] = useState('');

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const [rsvpRes, guestsRes] = await Promise.all([
        apiFetch('/api/admin/rsvp-responses?status=all', user),
        apiFetch('/api/admin/guests', user),
      ]);
      if (!rsvpRes.ok) throw new Error('rsvp');
      if (!guestsRes.ok) throw new Error('guests');
      const data = (await rsvpRes.json()) as AdminRsvpListResponse;
      const guestData = (await guestsRes.json()) as GuestWithRSVP[];
      setRows(data.rows);
      setCounts(data.counts);
      setGuests(guestData);
    } catch {
      setError('No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = rows.filter((r) => r.linkStatus === tab);
    if (q) {
      list = list.filter((r) => {
        if (r.rsvpUid.toLowerCase().includes(q)) return true;
        if (r.userEmail.toLowerCase().includes(q)) return true;
        if (r.displayName.toLowerCase().includes(q)) return true;
        if (r.linkedGuest?.fullName.toLowerCase().includes(q)) return true;
        if (r.linkedGuest?.email.toLowerCase().includes(q)) return true;
        if (r.suggestedGuest?.fullName.toLowerCase().includes(q)) return true;
        if (r.suggestedGuest?.email.toLowerCase().includes(q)) return true;
        return false;
      });
    }
    return list;
  }, [rows, tab, search]);

  function setBusy(rsvpUid: string, on: boolean) {
    setBusyUids((prev) => {
      const next = new Set(prev);
      if (on) next.add(rsvpUid);
      else next.delete(rsvpUid);
      return next;
    });
  }

  async function applyLink(
    row: AdminRsvpResponseRow,
    guestUid: string,
    source: 'manual' | 'auto_email',
    notes?: string
  ) {
    if (!user) return;
    setBusy(row.rsvpUid, true);
    try {
      const body: Record<string, string> = { rsvpUid: row.rsvpUid, guestUid, source };
      if (notes?.trim()) body.notes = notes.trim();
      const res = await apiFetch('/api/admin/rsvp-responses/link', user, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(typeof err.error === 'string' ? err.error : 'link');
      }
      await fetchAll();
      setLinkRow(null);
      setSelectedGuestUid(null);
      setGuestPickSearch('');
      setLinkNotes('');
    } catch {
      setError('No se pudo enlazar. Reintenta.');
    } finally {
      setBusy(row.rsvpUid, false);
    }
  }

  async function handleUnlink(row: AdminRsvpResponseRow) {
    if (!user) return;
    setBusy(row.rsvpUid, true);
    try {
      const res = await apiFetch('/api/admin/rsvp-responses/unlink', user, {
        method: 'POST',
        body: JSON.stringify({ rsvpUid: row.rsvpUid }),
      });
      if (!res.ok) throw new Error('unlink');
      await fetchAll();
    } catch {
      setError('No se pudo quitar el enlace');
    } finally {
      setBusy(row.rsvpUid, false);
    }
  }

  const pickerGuests = useMemo(() => {
    const q = guestPickSearch.trim().toLowerCase();
    if (!q) return guests.slice(0, 80);
    return guests
      .filter(
        (g) =>
          g.fullName.toLowerCase().includes(q) ||
          g.email.toLowerCase().includes(q) ||
          g.uid.toLowerCase().includes(q)
      )
      .slice(0, 80);
  }, [guests, guestPickSearch]);

  function openLinkDialog(row: AdminRsvpResponseRow) {
    setLinkRow(row);
    setGuestPickSearch(row.userEmail?.trim() ?? '');
    setSelectedGuestUid(null);
    setLinkNotes('');
  }

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
          <h1 className="type-heading-4 text-charcoal">Enlazar RSVP</h1>
          <p className="text-charcoal/60 type-body-small mt-1 max-w-2xl">
            Enlaza cada respuesta (UID de autenticación) con un invitado de la lista. Las
            coincidencias únicas por email se pueden aplicar con un clic; el resto requiere
            revisión manual. Los enlaces se guardan en el documento RSVP y no se pierden al
            sincronizar la hoja.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAll} disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          <span className="ml-2">Actualizar</span>
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-lg px-4 py-3 text-sm">
          <span>{error}</span>
          <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setError(null)}>
            Cerrar
          </Button>
        </div>
      )}

      {loading && !counts ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-ocean" />
        </div>
      ) : (
        <>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-charcoal/40" />
            <Input
              className="pl-9"
              placeholder="Buscar en esta pestaña…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v as AdminRsvpLinkBucket)}
            className="space-y-4"
          >
            <TabsList className="flex flex-wrap h-auto gap-1 bg-charcoal/5 p-1 rounded-lg">
              <TabsTrigger
                value="linked"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                Enlazadas
                {counts ? (
                  <Badge variant="secondary" className="ml-2 text-[10px] px-1.5">
                    {counts.linked}
                  </Badge>
                ) : null}
              </TabsTrigger>
              <TabsTrigger
                value="auto_match"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                Coincidencia email
                {counts ? (
                  <Badge variant="secondary" className="ml-2 text-[10px] px-1.5">
                    {counts.auto_match}
                  </Badge>
                ) : null}
              </TabsTrigger>
              <TabsTrigger
                value="needs_review"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                Revisión
                {counts ? (
                  <Badge variant="secondary" className="ml-2 text-[10px] px-1.5">
                    {counts.needs_review}
                  </Badge>
                ) : null}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="linked" className="mt-0">
              <RsvpTable
                rows={filteredRows}
                tab="linked"
                busyUids={busyUids}
                onApplyAuto={() => {}}
                onOpenLink={() => {}}
                onUnlink={handleUnlink}
              />
            </TabsContent>
            <TabsContent value="auto_match" className="mt-0">
              <RsvpTable
                rows={filteredRows}
                tab="auto_match"
                busyUids={busyUids}
                onApplyAuto={(row) => {
                  if (row.suggestedGuest) void applyLink(row, row.suggestedGuest.uid, 'auto_email');
                }}
                onOpenLink={() => {}}
                onUnlink={() => {}}
              />
            </TabsContent>
            <TabsContent value="needs_review" className="mt-0">
              <RsvpTable
                rows={filteredRows}
                tab="needs_review"
                busyUids={busyUids}
                onApplyAuto={() => {}}
                onOpenLink={openLinkDialog}
                onUnlink={() => {}}
              />
            </TabsContent>
          </Tabs>
        </>
      )}

      <Dialog
        open={!!linkRow}
        onOpenChange={(open) => {
          if (!open) {
            setLinkRow(null);
            setSelectedGuestUid(null);
            setGuestPickSearch('');
            setLinkNotes('');
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Enlazar con invitado</DialogTitle>
          </DialogHeader>
          {linkRow ? (
            <div className="space-y-3 text-sm">
              <p className="text-charcoal/70">
                RSVP{' '}
                <span className="font-mono text-xs break-all">{linkRow.rsvpUid}</span>
                {linkRow.userEmail ? (
                  <>
                    {' '}
                    · <span className="font-medium">{linkRow.userEmail}</span>
                  </>
                ) : null}
              </p>
              <div className="space-y-2">
                <Label htmlFor="guest-pick-search">Buscar invitado</Label>
                <Input
                  id="guest-pick-search"
                  value={guestPickSearch}
                  onChange={(e) => setGuestPickSearch(e.target.value)}
                  placeholder="Nombre, email o UID…"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="link-notes">Notas (opcional)</Label>
                <Textarea
                  id="link-notes"
                  value={linkNotes}
                  onChange={(e) => setLinkNotes(e.target.value)}
                  placeholder="Motivo del enlace, incidencias…"
                  rows={2}
                  className="resize-none"
                />
              </div>
              <div className="border border-charcoal/10 rounded-md max-h-56 overflow-y-auto divide-y divide-charcoal/5">
                {pickerGuests.length === 0 ? (
                  <p className="p-3 text-charcoal/50 text-sm">Sin resultados</p>
                ) : (
                  pickerGuests.map((g) => (
                    <button
                      key={g.uid}
                      type="button"
                      className={`w-full text-left px-3 py-2.5 text-sm hover:bg-ocean/5 transition-colors ${
                        selectedGuestUid === g.uid ? 'bg-ocean/10' : ''
                      }`}
                      onClick={() => setSelectedGuestUid(g.uid)}
                    >
                      <div className="font-medium">{g.fullName}</div>
                      <div className="text-xs text-charcoal/50 font-mono">{g.uid}</div>
                      {g.email ? (
                        <div className="text-xs text-charcoal/60">{g.email}</div>
                      ) : null}
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : null}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setLinkRow(null);
                setSelectedGuestUid(null);
                setLinkNotes('');
              }}
            >
              Cancelar
            </Button>
            <Button
              disabled={!linkRow || !selectedGuestUid || busyUids.has(linkRow?.rsvpUid ?? '')}
              onClick={() => {
                if (linkRow && selectedGuestUid) {
                  void applyLink(linkRow, selectedGuestUid, 'manual', linkNotes);
                }
              }}
            >
              {linkRow && busyUids.has(linkRow.rsvpUid) ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Enlazando…
                </>
              ) : (
                'Confirmar enlace'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
