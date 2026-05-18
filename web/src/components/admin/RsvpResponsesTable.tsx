'use client';

import { useMemo, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  Pencil,
} from 'lucide-react';
import type { AdminRsvpDetailRow } from '@/types/admin-rsvp-response';
import { RSVP_STATUS_LABELS } from '@/types/guest';
import type { AttendanceStatus } from '@/types/rsvp';
import {
  formatMainCourse,
  formatNightOptionsCompact,
  formatNightOptionsFull,
} from '@/lib/rsvp-display-labels';

type SortField =
  | 'displayName'
  | 'attendance'
  | 'mainCoursePreference'
  | 'lastUpdatedAt'
  | 'isSubmitted';
type SortDirection = 'asc' | 'desc';

interface RsvpResponsesTableProps {
  rows: AdminRsvpDetailRow[];
  onEditRow?: (row: AdminRsvpDetailRow) => void;
}

const PAGE_SIZE = 20;

function rsvpDotClass(attendance: AttendanceStatus | null): string {
  switch (attendance) {
    case 'yes':
      return 'bg-sage';
    case 'no':
      return 'bg-red-500';
    case 'maybe':
      return 'bg-amber-400';
    default:
      return 'bg-charcoal/35';
  }
}

function guestTooltipText(row: AdminRsvpDetailRow): string {
  if (row.linkedGuest) {
    return `Invitado enlazado: ${row.linkedGuest.fullName}`;
  }
  if (row.suggestedGuest) {
    return `Coincidencia sugerida: ${row.suggestedGuest.fullName}`;
  }
  return 'Sin enlazar a invitado';
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

function truncate(text: string, max: number): string {
  const t = text.trim();
  if (!t) return '—';
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

export default function RsvpResponsesTable({ rows, onEditRow }: RsvpResponsesTableProps) {
  const [sortField, setSortField] = useState<SortField>('lastUpdatedAt');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [page, setPage] = useState(0);

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'lastUpdatedAt') {
        cmp = a.lastUpdatedAt.localeCompare(b.lastUpdatedAt);
      } else if (sortField === 'isSubmitted') {
        cmp = Number(a.isSubmitted) - Number(b.isSubmitted);
      } else if (sortField === 'attendance') {
        const aVal = a.attendance ?? '';
        const bVal = b.attendance ?? '';
        cmp = aVal.localeCompare(bVal);
      } else if (sortField === 'mainCoursePreference') {
        const aVal = a.mainCoursePreference ?? '';
        const bVal = b.mainCoursePreference ?? '';
        cmp = aVal.localeCompare(bVal);
      } else {
        cmp = a.displayName.localeCompare(b.displayName, 'es');
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return copy;
  }, [rows, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const paginated = sorted.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  function handleSort(field: SortField) {
    setPage(0);
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir(field === 'lastUpdatedAt' ? 'desc' : 'asc');
    }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ChevronsUpDown className="ml-1 h-3.5 w-3.5 opacity-40" />;
    return sortDir === 'asc' ? (
      <ChevronUp className="ml-1 h-3.5 w-3.5" />
    ) : (
      <ChevronDown className="ml-1 h-3.5 w-3.5" />
    );
  }

  function SortableHeader({ field, children }: { field: SortField; children: React.ReactNode }) {
    return (
      <TableHead>
        <button
          type="button"
          onClick={() => handleSort(field)}
          className="flex items-center text-charcoal/80 hover:text-charcoal transition-colors font-medium whitespace-nowrap"
        >
          {children}
          <SortIcon field={field} />
        </button>
      </TableHead>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="overflow-x-auto rounded-lg border border-charcoal/10 bg-white">
        <Table className="text-charcoal">
          <TableHeader>
            <TableRow className="bg-cream/50 border-charcoal/10">
              <SortableHeader field="displayName">Nombre</SortableHeader>
              <SortableHeader field="attendance">Asistencia</SortableHeader>
              <SortableHeader field="mainCoursePreference">Plato</SortableHeader>
              <TableHead>Dieta</TableHead>
              <TableHead>Noches</TableHead>
              <TableHead>Habitación</TableHead>
              <TableHead>Invitado enlazado</TableHead>
              <SortableHeader field="isSubmitted">Estado</SortableHeader>
              <SortableHeader field="lastUpdatedAt">Actualizado</SortableHeader>
              {onEditRow && (
                <TableHead className="text-right font-medium">Acciones</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={onEditRow ? 10 : 9}
                  className="text-center py-12 text-charcoal/50"
                >
                  No se encontraron respuestas RSVP
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((row) => {
                const attendanceLabel =
                  row.attendance != null
                    ? RSVP_STATUS_LABELS[row.attendance]
                    : 'Sin respuesta';
                const dietFull = row.dietaryRestrictions.trim() || '—';
                const roomFull = row.roomSharing.trim() || '—';
                const nightsCompact = formatNightOptionsCompact(row.nightsStaying);
                const nightsFull = formatNightOptionsFull(
                  row.nightsStaying,
                  row.otherNightsCombination
                );

                return (
                  <TableRow key={row.rsvpUid} className="text-charcoal hover:bg-cream/40">
                    <TableCell className="min-w-[160px]">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="block cursor-default">
                            <span className="font-medium text-charcoal">{row.displayName}</span>
                            {row.userEmail && (
                              <span className="block text-xs text-charcoal/65 truncate max-w-[200px]">
                                {row.userEmail}
                              </span>
                            )}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top">{guestTooltipText(row)}</TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex items-center gap-2 cursor-default">
                            <span
                              className={`h-2.5 w-2.5 rounded-full shrink-0 ${rsvpDotClass(row.attendance)}`}
                            />
                            <span className="text-sm text-charcoal">{attendanceLabel}</span>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>{attendanceLabel}</TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-charcoal">
                      {formatMainCourse(row.mainCoursePreference)}
                    </TableCell>
                    <TableCell className="max-w-[140px] text-sm text-charcoal" title={dietFull}>
                      {truncate(row.dietaryRestrictions, 40)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-charcoal">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-default font-medium tracking-wide text-charcoal">
                            {nightsCompact}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>{nightsFull}</TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell className="max-w-[120px] text-sm text-charcoal" title={roomFull}>
                      {truncate(row.roomSharing, 30)}
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap text-charcoal">
                      {row.linkedGuest?.fullName ?? '—'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={row.isSubmitted ? 'default' : 'secondary'}
                        className={row.isSubmitted ? 'bg-sage/90 hover:bg-sage/90' : ''}
                      >
                        {row.isSubmitted ? 'Enviado' : 'Borrador'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-charcoal/80 whitespace-nowrap tabular-nums">
                      {formatWhen(row.lastUpdatedAt)}
                    </TableCell>
                    {onEditRow && (
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditRow(row)}
                        >
                          <Pencil className="h-3.5 w-3.5 mr-1" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {sorted.length > PAGE_SIZE && (
        <div className="flex items-center justify-between mt-3 text-sm text-charcoal/60">
          <span>
            {safePage * PAGE_SIZE + 1}–{Math.min((safePage + 1) * PAGE_SIZE, sorted.length)} de{' '}
            {sorted.length}
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={safePage === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={safePage >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </TooltipProvider>
  );
}
