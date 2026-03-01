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
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  MoreHorizontal,
  Pencil,
  Trash2,
  Link as LinkIcon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { GuestWithRSVP } from '@/types/guest';
import { SIDE_LABELS, RELATIONSHIP_STATUS_LABELS, RSVP_STATUS_LABELS } from '@/types/guest';

type SortField = 'fullName' | 'email' | 'side' | 'rsvpStatus' | 'profileClaimed' | 'relationshipStatus';
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

function getRsvpBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'yes': return 'default';
    case 'no': return 'destructive';
    case 'maybe': return 'secondary';
    default: return 'outline';
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
      const aVal = String(a[sortField] ?? '').toLowerCase();
      const bVal = String(b[sortField] ?? '').toLowerCase();
      const cmp = aVal.localeCompare(bVal);
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
    return sortDir === 'asc'
      ? <ChevronUp className="ml-1 h-3.5 w-3.5" />
      : <ChevronDown className="ml-1 h-3.5 w-3.5" />;
  }

  function SortableHeader({ field, children }: { field: SortField; children: React.ReactNode }) {
    return (
      <TableHead>
        <button
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
              <SortableHeader field="email">Email</SortableHeader>
              <SortableHeader field="side">Lado</SortableHeader>
              <SortableHeader field="rsvpStatus">RSVP</SortableHeader>
              <SortableHeader field="profileClaimed">Perfil</SortableHeader>
              <SortableHeader field="relationshipStatus">Estado</SortableHeader>
              <TableHead className="w-12">
                <span className="sr-only">Acciones</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-charcoal/50">
                  No se encontraron invitados
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((guest) => (
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
                  <TableCell className="font-medium">{guest.fullName}</TableCell>
                  <TableCell className="text-charcoal/70 type-body-small">{guest.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {SIDE_LABELS[guest.side]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRsvpBadgeVariant(guest.rsvpStatus)}>
                      {RSVP_STATUS_LABELS[guest.rsvpStatus]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className={guest.profileClaimed ? 'text-sage' : 'text-charcoal/40'}>
                      {guest.profileClaimed ? 'Sí' : 'No'}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs">
                    {RELATIONSHIP_STATUS_LABELS[guest.relationshipStatus]}
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
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-1">
          <p className="text-sm text-charcoal/60">
            {sorted.length} invitado{sorted.length !== 1 ? 's' : ''} &middot; Página {safePage + 1} de {totalPages}
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
  );
}
