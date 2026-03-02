'use client';

import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CheckCircle2, XCircle, Link as LinkIcon } from 'lucide-react';
import type { SentNotification } from '@/types/notification';

interface NotificationHistoryProps {
  notifications: SentNotification[];
  loading: boolean;
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Madrid',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function NotificationHistory({
  notifications,
  loading,
}: NotificationHistoryProps) {
  if (loading) return null;

  if (notifications.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-charcoal/10 p-8 text-center">
        <p className="text-charcoal/40 type-body-small">
          No se han enviado notificaciones manuales todavía.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-charcoal/10 overflow-hidden">
      <div className="px-6 py-4 border-b border-charcoal/10">
        <h2 className="type-heading-5 text-charcoal">
          Historial de envíos
        </h2>
        <p className="text-charcoal/50 type-body-small mt-0.5">
          {notifications.length} notificación{notifications.length !== 1 ? 'es' : ''} enviada{notifications.length !== 1 ? 's' : ''}
        </p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Estado</TableHead>
            <TableHead>Título</TableHead>
            <TableHead className="hidden md:table-cell">Mensaje</TableHead>
            <TableHead className="hidden lg:table-cell">Deep Link</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead className="hidden sm:table-cell">Enviado por</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {notifications.map((n) => (
            <TableRow key={n.id}>
              <TableCell>
                {n.status === 'sent' ? (
                  <Badge
                    variant="outline"
                    className="text-green border-green/30 gap-1"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    Enviada
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="text-red-500 border-red-500/30 gap-1"
                    title={n.errorMessage ?? undefined}
                  >
                    <XCircle className="h-3 w-3" />
                    Error
                  </Badge>
                )}
              </TableCell>
              <TableCell className="font-medium max-w-[200px] truncate">
                {n.title}
              </TableCell>
              <TableCell className="hidden md:table-cell max-w-[260px] truncate text-charcoal/60">
                {n.body}
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                {n.deepLink ? (
                  <span className="inline-flex items-center gap-1 text-ocean text-xs">
                    <LinkIcon className="h-3 w-3" />
                    {n.deepLink}
                  </span>
                ) : (
                  <span className="text-charcoal/30 text-xs">—</span>
                )}
              </TableCell>
              <TableCell className="text-charcoal/60 text-xs whitespace-nowrap">
                {formatDate(n.sentAt)}
              </TableCell>
              <TableCell className="hidden sm:table-cell text-charcoal/50 text-xs truncate max-w-[160px]">
                {n.sentBy}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
