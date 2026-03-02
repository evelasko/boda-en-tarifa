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
import {
  Bell,
  Unlock,
  Camera,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import type { ScheduledNotification } from '@/types/notification';

interface ScheduledNotificationsProps {
  notifications: ScheduledNotification[];
  loading: boolean;
}

const TYPE_CONFIG = {
  event_reminder: {
    label: 'Recordatorio',
    icon: Bell,
    className: 'text-ocean border-ocean/30',
  },
  content_unlock: {
    label: 'Contenido',
    icon: Unlock,
    className: 'text-sage border-sage/30',
  },
  film_development: {
    label: 'Cámara',
    icon: Camera,
    className: 'text-coral border-coral/30',
  },
} as const;

function formatScheduledDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Madrid',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function getStatusBadge(sent: boolean, sendAt: string) {
  const now = Date.now();
  const scheduledTime = new Date(sendAt).getTime();

  if (sent) {
    return (
      <Badge variant="outline" className="text-green border-green/30 gap-1">
        <CheckCircle2 className="h-3 w-3" />
        Enviada
      </Badge>
    );
  }

  if (scheduledTime <= now) {
    return (
      <Badge variant="outline" className="text-amber-500 border-amber-500/30 gap-1">
        <Clock className="h-3 w-3" />
        Pendiente
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="text-charcoal/50 border-charcoal/15 gap-1">
      <Clock className="h-3 w-3" />
      Programada
    </Badge>
  );
}

export default function ScheduledNotifications({
  notifications,
  loading,
}: ScheduledNotificationsProps) {
  if (loading) return null;

  if (notifications.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-charcoal/10 p-8 text-center">
        <p className="text-charcoal/40 type-body-small">
          No hay notificaciones programadas.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-charcoal/10 overflow-hidden">
      <div className="px-6 py-4 border-b border-charcoal/10">
        <h2 className="type-heading-5 text-charcoal">
          Notificaciones programadas
        </h2>
        <p className="text-charcoal/50 type-body-small mt-0.5">
          {notifications.length} notificaciones automáticas gestionadas por Cloud Functions
        </p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tipo</TableHead>
            <TableHead>Título</TableHead>
            <TableHead className="hidden md:table-cell">Mensaje</TableHead>
            <TableHead>Programada</TableHead>
            <TableHead>Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {notifications.map((n) => {
            const config = TYPE_CONFIG[n.type];
            const Icon = config.icon;

            return (
              <TableRow key={n.id}>
                <TableCell>
                  <Badge variant="outline" className={`${config.className} gap-1`}>
                    <Icon className="h-3 w-3" />
                    {config.label}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium max-w-[200px] truncate">
                  {n.title}
                </TableCell>
                <TableCell className="hidden md:table-cell max-w-[260px] truncate text-charcoal/60">
                  {n.body}
                </TableCell>
                <TableCell className="text-charcoal/60 text-xs whitespace-nowrap">
                  {formatScheduledDate(n.sendAt)}
                </TableCell>
                <TableCell>
                  {getStatusBadge(n.sent, n.sendAt)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
