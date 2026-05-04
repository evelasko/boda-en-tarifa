'use client';

import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  MoreHorizontal,
  Pencil,
  Trash2,
  Link as LinkIcon,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
} from 'lucide-react';
import type { GuestWithRSVP, RelationshipStatus } from '@/types/guest';
import {
  SIDE_GROOM_NAMES,
  RELATIONSHIP_STATUS_LABELS,
  RSVP_STATUS_LABELS,
} from '@/types/guest';
import type { AttendanceStatus } from '@/types/rsvp';

type SortField =
  | 'fullName'
  | 'contact'
  | 'side'
  | 'rsvpStatus'
  | 'profileClaimed'
  | 'relationshipStatus'
  | 'seating';
type SortDirection = 'asc' | 'desc';

interface GuestTableProps {
  guests: GuestWithRSVP[];
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  onEdit: (guest: GuestWithRSVP) => void;
  onDelete: (guest: GuestWithRSVP) => void;
  onMagicLink: (guest: GuestWithRSVP) => void;
}

const PAGE_SIZE = 20;

const RELATIONSHIP_BADGE_CLASS: Record<RelationshipStatus, string> = {
  soltero: 'border-sky-200 bg-sky-50 text-sky-900',
  enPareja: 'border-pink/50 bg-pink/15 text-charcoal',
  buscando: 'border-violet-200 bg-violet-50 text-violet-900',
};

function contactSortKey(g: GuestWithRSVP): string {
  return [g.email ?? '', g.phoneE164 ?? '', g.whatsappNumber ?? ''].join('\t').toLowerCase();
}

function seatSortKey(g: GuestWithRSVP): string {
  const s = g.seating;
  if (!s) return '';
  const t = (s.tableName ?? '').trim().toLowerCase();
  const n = s.seatNumber ?? 0;
  if (!t && !n) return '';
  return `${t}/${String(n).padStart(6, '0')}`;
}

function hasPhoneContact(g: GuestWithRSVP): boolean {
  return Boolean((g.phoneE164 ?? '').trim() || (g.whatsappNumber ?? '').trim());
}

function hasEmailContact(g: GuestWithRSVP): boolean {
  return Boolean((g.email ?? '').trim());
}

function phoneTooltipText(g: GuestWithRSVP): string {
  const lines: string[] = [];
  if ((g.phoneE164 ?? '').trim()) lines.push(`Tel: ${g.phoneE164}`);
  if ((g.whatsappNumber ?? '').trim()) lines.push(`WhatsApp: ${g.whatsappNumber}`);
  return lines.length > 0 ? lines.join('\n') : 'Sin teléfono ni WhatsApp';
}

function emailTooltipText(g: GuestWithRSVP): string {
  const e = (g.email ?? '').trim();
  return e || 'Sin email';
}

function formatTableSeat(g: GuestWithRSVP): string {
  const s = g.seating;
  if (!s) return '—';
  const t = (s.tableName ?? '').trim();
  const n = s.seatNumber ?? 0;
  if (!t && !n) return '—';
  if (!t) return n ? `—/${n}` : '—';
  if (!n) return t;
  return `${t}/${n}`;
}

function rsvpDotClass(status: AttendanceStatus | 'no_response'): string {
  switch (status) {
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

export default function GuestTable({
  guests,
  selectedIds,
  onSelectionChange,
  onEdit,
  onDelete,
  onMagicLink,
}: GuestTableProps) {
  const [sortField, setSortField] = useState<SortField>('fullName');
  const [sortDir, setSortDir] = useState<SortDirection>('asc');
  const [page, setPage] = useState(0);

  const sorted = useMemo(() => {
    const copy = [...guests];
    copy.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'contact') {
        cmp = contactSortKey(a).localeCompare(contactSortKey(b));
      } else if (sortField === 'seating') {
        cmp = seatSortKey(a).localeCompare(seatSortKey(b));
      } else {
        const aVal = String(a[sortField] ?? '').toLowerCase();
        const bVal = String(b[sortField] ?? '').toLowerCase();
        cmp = aVal.localeCompare(bVal);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return copy;
  }, [guests, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const paginated = sorted.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  const allSelected = paginated.length > 0 && paginated.every((g) => selectedIds.has(g.uid));
  const someSelected = paginated.some((g) => selectedIds.has(g.uid));

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  }

  function toggleAll() {
    const next = new Set(selectedIds);
    if (allSelected) {
      paginated.forEach((g) => next.delete(g.uid));
    } else {
      paginated.forEach((g) => next.add(g.uid));
    }
    onSelectionChange(next);
  }

  function toggleOne(uid: string) {
    const next = new Set(selectedIds);
    if (next.has(uid)) next.delete(uid);
    else next.add(uid);
    onSelectionChange(next);
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
          className="flex items-center hover:text-charcoal transition-colors font-medium"
        >
          {children}
          <SortIcon field={field} />
        </button>
      </TableHead>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div>
        <div className="rounded-lg border border-charcoal/10 bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-cream/50">
                <TableHead className="w-10">
                  <Checkbox
                    checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                    onCheckedChange={toggleAll}
                    aria-label="Seleccionar todos"
                  />
                </TableHead>
                <SortableHeader field="fullName">Nombre</SortableHeader>
                <SortableHeader field="contact">Contacto</SortableHeader>
                <SortableHeader field="side">Lado</SortableHeader>
                <SortableHeader field="rsvpStatus">RSVP</SortableHeader>
                <SortableHeader field="profileClaimed">Perfil</SortableHeader>
                <SortableHeader field="relationshipStatus">Estado</SortableHeader>
                <SortableHeader field="seating">Mesa</SortableHeader>
                <TableHead className="w-12">
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-charcoal/50">
                    No se encontraron invitados
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((guest) => {
                  const phoneOk = hasPhoneContact(guest);
                  const emailOk = hasEmailContact(guest);
                  return (
                    <TableRow
                      key={guest.uid}
                      className={selectedIds.has(guest.uid) ? 'bg-ocean/5' : ''}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(guest.uid)}
                          onCheckedChange={() => toggleOne(guest.uid)}
                          aria-label={`Seleccionar ${guest.fullName}`}
                        />
                      </TableCell>
                      <TableCell
                        className={`font-medium ${guest.child ? 'text-pink' : 'text-charcoal'}`}
                      >
                        {guest.fullName}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span
                                className="inline-flex cursor-default"
                                aria-label={phoneTooltipText(guest)}
                              >
                                <Phone
                                  className={`h-4 w-4 ${phoneOk ? 'text-sage' : 'text-charcoal/30'}`}
                                  strokeWidth={2}
                                />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="whitespace-pre-line">
                              {phoneTooltipText(guest)}
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span
                                className="inline-flex cursor-default"
                                aria-label={emailTooltipText(guest)}
                              >
                                <Mail
                                  className={`h-4 w-4 ${emailOk ? 'text-sage' : 'text-charcoal/30'}`}
                                  strokeWidth={2}
                                />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top">{emailTooltipText(guest)}</TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs border-charcoal/20 text-charcoal">
                          {SIDE_GROOM_NAMES[guest.side]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span
                              className="inline-flex cursor-default rounded-full p-1"
                              aria-label={RSVP_STATUS_LABELS[guest.rsvpStatus]}
                            >
                              <span
                                className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${rsvpDotClass(guest.rsvpStatus)}`}
                              />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top">{RSVP_STATUS_LABELS[guest.rsvpStatus]}</TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="text-base leading-none" title={guest.profileClaimed ? 'Perfil reclamado' : 'Perfil sin reclamar'}>
                        {guest.profileClaimed ? '✅' : '📭'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs font-medium ${RELATIONSHIP_BADGE_CLASS[guest.relationshipStatus]}`}
                        >
                          {RELATIONSHIP_STATUS_LABELS[guest.relationshipStatus]}
                        </Badge>
                      </TableCell>
                      <TableCell className="type-body-small tabular-nums text-charcoal">
                        {formatTableSeat(guest)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(guest)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onMagicLink(guest)}>
                              <LinkIcon className="mr-2 h-4 w-4" />
                              Magic Link
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onDelete(guest)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 px-1">
            <p className="text-sm text-charcoal/60">
              {sorted.length} invitado{sorted.length !== 1 ? 's' : ''} &middot; Página {safePage + 1} de{' '}
              {totalPages}
            </p>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={safePage === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={safePage >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
