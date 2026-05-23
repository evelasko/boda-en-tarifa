'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  MessageSquare,
  AlertTriangle,
  Send,
  Settings,
  Power,
  Database,
  Clock,
  PhoneIncoming,
} from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firestore';

interface BotConfigSnapshot {
  enabled?: boolean;
  film_developed_approved?: boolean;
  keep_warm_enabled?: boolean;
}

interface KbVersionSnapshot {
  version?: number;
  hash?: string;
  updatedAt?: { toDate?: () => Date } | null;
}

const subNav = [
  { href: '/admin/bot/conversations', label: 'Conversaciones', icon: MessageSquare },
  { href: '/admin/bot/escalations', label: 'Escalaciones', icon: AlertTriangle },
  { href: '/admin/bot/broadcasts', label: 'Difusiones', icon: Send },
  { href: '/admin/bot/unknown-inbound', label: 'Desconocidos', icon: PhoneIncoming },
  { href: '/admin/bot/settings', label: 'Ajustes', icon: Settings },
];

export default function BotAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [config, setConfig] = useState<BotConfigSnapshot | null>(null);
  const [kbVersion, setKbVersion] = useState<KbVersionSnapshot | null>(null);

  useEffect(() => {
    const unsubConfig = onSnapshot(doc(db, 'config/bot'), (snap) => {
      setConfig(snap.exists() ? (snap.data() as BotConfigSnapshot) : {});
    });
    const unsubKb = onSnapshot(
      doc(db, 'bot_kb_version/_singleton_'),
      (snap) => {
        setKbVersion(snap.exists() ? (snap.data() as KbVersionSnapshot) : {});
      }
    );
    return () => {
      unsubConfig();
      unsubKb();
    };
  }, []);

  const botEnabled = config?.enabled !== false; // default true
  const filmApproved = Boolean(config?.film_developed_approved);
  const keepWarmEnabled = config?.keep_warm_enabled !== false; // default true

  return (
    <div className="space-y-6">
      <header className="bg-white rounded-lg border border-charcoal/10 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="type-heading-5 text-charcoal">🐾 Thora — panel</h1>
            <p className="text-sm text-charcoal/60 mt-1">
              Difusiones, conversaciones, escalaciones y ajustes del bot.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <StatusChip
              icon={<Power size={14} />}
              label="Bot"
              value={botEnabled ? 'ON' : 'OFF'}
              tone={botEnabled ? 'green' : 'red'}
            />
            <StatusChip
              icon={<Database size={14} />}
              label="KB"
              value={kbVersion?.version != null ? `v${kbVersion.version}` : '—'}
              tone="ocean"
              hint={kbHashHint(kbVersion?.hash)}
            />
            <StatusChip
              icon={<Clock size={14} />}
              label="Keep-warm"
              value={keepWarmEnabled ? 'ON' : 'OFF'}
              tone={keepWarmEnabled ? 'green' : 'sand'}
            />
            <StatusChip
              icon={<span>🎞️</span>}
              label="Álbum"
              value={filmApproved ? 'APROBADO' : 'pendiente'}
              tone={filmApproved ? 'green' : 'sand'}
            />
          </div>
        </div>
      </header>

      <nav className="flex flex-wrap gap-1 border-b border-charcoal/10 pb-1">
        {subNav.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm
                transition-colors
                ${
                  active
                    ? 'bg-ocean/10 text-ocean font-medium'
                    : 'text-charcoal/70 hover:bg-charcoal/5 hover:text-charcoal'
                }
              `}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div>{children}</div>
    </div>
  );
}

type ChipTone = 'green' | 'red' | 'ocean' | 'sand';

function StatusChip({
  icon,
  label,
  value,
  tone,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: ChipTone;
  hint?: string;
}) {
  const toneClass = {
    green: 'bg-sage/15 text-sage',
    red: 'bg-coral/15 text-coral',
    ocean: 'bg-ocean/10 text-ocean',
    sand: 'bg-sand/20 text-charcoal/70',
  }[tone];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md ${toneClass}`}
      title={hint}
    >
      {icon}
      <span className="text-charcoal/60">{label}:</span>
      <span className="font-medium tabular-nums">{value}</span>
    </span>
  );
}

function kbHashHint(hash: string | undefined): string | undefined {
  if (!hash) return undefined;
  return `hash ${hash.slice(0, 8)}…`;
}
