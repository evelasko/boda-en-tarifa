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
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Eye,
  EyeOff,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cloudinaryThumbnailUrl } from '@/lib/cloudinary';
import type { FeedPost } from '@/types/moderation';
import { SOURCE_LABELS } from '@/types/moderation';

type SortField = 'authorName' | 'source' | 'createdAt' | 'isHidden';
type SortDirection = 'asc' | 'desc';

interface FeedPostTableProps {
  posts: FeedPost[];
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  onToggleHidden: (post: FeedPost) => void;
  onViewDetail: (post: FeedPost) => void;
  togglingIds: Set<string>;
}

const PAGE_SIZE = 20;

export default function FeedPostTable({
  posts,
  selectedIds,
  onSelectionChange,
  onToggleHidden,
  onViewDetail,
  togglingIds,
}: FeedPostTableProps) {
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [page, setPage] = useState(0);

  const sorted = useMemo(() => {
    const copy = [...posts];
    copy.sort((a, b) => {
      const aVal = String(a[sortField] ?? '').toLowerCase();
      const bVal = String(b[sortField] ?? '').toLowerCase();
      const cmp = aVal.localeCompare(bVal);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return copy;
  }, [posts, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const paginated = sorted.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  const allSelected = paginated.length > 0 && paginated.every((p) => selectedIds.has(p.id));
  const someSelected = paginated.some((p) => selectedIds.has(p.id));

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir(field === 'createdAt' ? 'desc' : 'asc');
    }
  }

  function toggleAll() {
    const next = new Set(selectedIds);
    if (allSelected) {
      paginated.forEach((p) => next.delete(p.id));
    } else {
      paginated.forEach((p) => next.add(p.id));
    }
    onSelectionChange(next);
  }

  function toggleOne(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
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
              <TableHead className="w-16">Foto</TableHead>
              <SortableHeader field="authorName">Autor</SortableHeader>
              <SortableHeader field="source">Fuente</SortableHeader>
              <TableHead>Descripción</TableHead>
              <SortableHeader field="createdAt">Fecha</SortableHeader>
              <SortableHeader field="isHidden">Estado</SortableHeader>
              <TableHead className="w-16">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-charcoal/50">
                  No se encontraron publicaciones
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((post) => (
                <TableRow
                  key={post.id}
                  className={`${selectedIds.has(post.id) ? 'bg-ocean/5' : ''} ${post.isHidden ? 'opacity-60' : ''}`}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(post.id)}
                      onCheckedChange={() => toggleOne(post.id)}
                      aria-label={`Seleccionar publicación de ${post.authorName}`}
                    />
                  </TableCell>
                  <TableCell>
                    <button onClick={() => onViewDetail(post)} className="cursor-pointer">
                      {post.imageUrls.length > 0 ? (
                        <img
                          src={cloudinaryThumbnailUrl(post.imageUrls[0], 80)}
                          alt=""
                          className="w-10 h-10 rounded object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded bg-charcoal/5" />
                      )}
                    </button>
                  </TableCell>
                  <TableCell className="font-medium">{post.authorName}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {SOURCE_LABELS[post.source]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-charcoal/70 type-body-small max-w-[200px] truncate">
                    {post.caption || '—'}
                  </TableCell>
                  <TableCell className="text-charcoal/60 text-xs whitespace-nowrap">
                    {new Date(post.createdAt).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={post.isHidden ? 'secondary' : 'default'} className="text-xs">
                      {post.isHidden ? 'Oculta' : 'Visible'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onToggleHidden(post)}
                      disabled={togglingIds.has(post.id)}
                      title={post.isHidden ? 'Mostrar' : 'Ocultar'}
                    >
                      {togglingIds.has(post.id) ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : post.isHidden ? (
                        <Eye className="h-4 w-4 text-sage" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-charcoal/40" />
                      )}
                    </Button>
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
            {sorted.length} publicacion{sorted.length !== 1 ? 'es' : ''} &middot; Página {safePage + 1} de {totalPages}
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
