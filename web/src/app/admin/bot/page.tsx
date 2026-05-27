'use client';

import Link from 'next/link';
import {
  MessageSquare,
  AlertTriangle,
  Send,
  Settings,
  ArrowRight,
  PhoneIncoming,
} from 'lucide-react';

const cards = [
  {
    href: '/admin/bot/messages',
    title: 'Mensajes',
    description:
      'Interacciones de invitados con Thora por WhatsApp. Búsqueda, filtros por volumen y paginación para hilos largos.',
    icon: MessageSquare,
  },
  {
    href: '/admin/bot/escalations',
    title: 'Escalaciones',
    description:
      'Cola de mensajes que Thora ha derivado. Responde aquí; el bot las cierra automáticamente.',
    icon: AlertTriangle,
  },
  {
    href: '/admin/bot/broadcasts',
    title: 'Difusiones',
    description:
      'Lanzar un envío por plantilla con vista previa de audiencia y dry-run antes de enviar.',
    icon: Send,
  },
  {
    href: '/admin/bot/unknown-inbound',
    title: 'Números desconocidos',
    description:
      'Cola de números fuera de la lista de invitados. Si reconoces el número, añádelo de un clic.',
    icon: PhoneIncoming,
  },
  {
    href: '/admin/bot/settings',
    title: 'Ajustes',
    description:
      'Kill switch, aprobación del álbum, keep-warm. Sin formularios largos: solo lo que necesitas en el evento.',
    icon: Settings,
  },
];

export default function BotAdminIndex() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <Link
            key={c.href}
            href={c.href}
            className="group bg-white rounded-lg border border-charcoal/10 p-5
              hover:border-ocean/30 hover:shadow-sm transition-all"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-md bg-ocean/10 text-ocean">
                <Icon size={18} />
              </div>
              <div className="flex-1">
                <h2 className="type-body-base font-semibold text-charcoal flex items-center gap-1">
                  {c.title}
                  <ArrowRight
                    size={14}
                    className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all"
                  />
                </h2>
                <p className="text-sm text-charcoal/60 mt-1">
                  {c.description}
                </p>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
