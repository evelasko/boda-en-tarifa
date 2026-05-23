'use client';

import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { Loader2, Power, Film, Clock, Database } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '@/lib/firestore';
import {
  callBotSetConfig,
  type BotConfigKey,
} from '@/lib/bot-callable';

interface BotConfig {
  enabled?: boolean;
  film_developed_approved?: boolean;
  keep_warm_enabled?: boolean;
  enabled_updatedAt?: string;
  enabled_updatedBy?: string;
  film_developed_approved_updatedAt?: string;
  film_developed_approved_updatedBy?: string;
  keep_warm_enabled_updatedAt?: string;
  keep_warm_enabled_updatedBy?: string;
}

interface KbVersion {
  version?: number;
  hash?: string;
  updatedAt?: { toDate?: () => Date } | null;
}

export default function BotSettingsPage() {
  const [config, setConfig] = useState<BotConfig | null>(null);
  const [kb, setKb] = useState<KbVersion | null>(null);
  const [busy, setBusy] = useState<BotConfigKey | null>(null);

  useEffect(() => {
    const unsubA = onSnapshot(doc(db, 'config/bot'), (snap) => {
      setConfig(snap.exists() ? (snap.data() as BotConfig) : {});
    });
    const unsubB = onSnapshot(
      doc(db, 'bot_kb_version/_singleton_'),
      (snap) => {
        setKb(snap.exists() ? (snap.data() as KbVersion) : {});
      }
    );
    return () => {
      unsubA();
      unsubB();
    };
  }, []);

  const flip = async (key: BotConfigKey, next: boolean) => {
    setBusy(key);
    try {
      await callBotSetConfig({ key, value: next });
      toast.success(`${key} → ${next ? 'ON' : 'OFF'}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No se pudo guardar.';
      toast.error(msg);
    } finally {
      setBusy(null);
    }
  };

  if (!config) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-ocean" />
      </div>
    );
  }

  const enabled = config.enabled !== false;
  const filmApproved = Boolean(config.film_developed_approved);
  const keepWarm = config.keep_warm_enabled !== false;

  return (
    <div className="space-y-4 max-w-2xl">
      <h2 className="type-heading-6 text-charcoal">Ajustes</h2>

      <Toggle
        icon={<Power size={18} />}
        title="Bot habilitado"
        description="Si lo apagas, Thora deja de responder a inbounds. Los webhooks se ack-ean pero no producen respuesta."
        on={enabled}
        busy={busy === 'enabled'}
        onChange={(v) => flip('enabled', v)}
        meta={metaLine(
          config.enabled_updatedAt,
          config.enabled_updatedBy
        )}
        tone={enabled ? 'green' : 'red'}
      />

      <Toggle
        icon={<Film size={18} />}
        title="Álbum aprobado (film developed)"
        description="Hasta que esto esté en ON, el envío del domingo 20:00 NO se dispara aunque la hora llegue."
        on={filmApproved}
        busy={busy === 'film_developed_approved'}
        onChange={(v) => flip('film_developed_approved', v)}
        meta={metaLine(
          config.film_developed_approved_updatedAt,
          config.film_developed_approved_updatedBy
        )}
        tone={filmApproved ? 'green' : 'sand'}
      />

      <Toggle
        icon={<Clock size={18} />}
        title="Keep-warm habilitado"
        description="Mantiene la caché Anthropic de Thora caliente con un ping/min en el active window."
        on={keepWarm}
        busy={busy === 'keep_warm_enabled'}
        onChange={(v) => flip('keep_warm_enabled', v)}
        meta={metaLine(
          config.keep_warm_enabled_updatedAt,
          config.keep_warm_enabled_updatedBy
        )}
        tone={keepWarm ? 'green' : 'sand'}
      />

      <section className="bg-white rounded-lg border border-charcoal/10 p-5 space-y-2">
        <h3 className="text-sm font-medium text-charcoal/70 flex items-center gap-2">
          <Database size={16} />
          Estado del KB
        </h3>
        <div className="text-sm text-charcoal/70 grid grid-cols-2 gap-2">
          <span>Versión</span>
          <span className="tabular-nums font-medium">
            {kb?.version != null ? `v${kb.version}` : '—'}
          </span>
          <span>Hash</span>
          <span className="font-mono text-xs">
            {kb?.hash ? `${kb.hash.slice(0, 12)}…` : '—'}
          </span>
        </div>
        <p className="text-xs text-charcoal/50 pt-2">
          El KB se rebuild automáticamente cuando cambia cualquier
          fuente. Para forzar un rebuild, ejecuta{' '}
          <code>bot/scripts/sync-kb.mjs --all</code> desde tu máquina.
        </p>
      </section>
    </div>
  );
}

function Toggle({
  icon,
  title,
  description,
  on,
  busy,
  onChange,
  meta,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  on: boolean;
  busy: boolean;
  onChange: (next: boolean) => void;
  meta?: string;
  tone: 'green' | 'red' | 'sand';
}) {
  const ringTone = {
    green: 'ring-sage/30',
    red: 'ring-coral/30',
    sand: 'ring-sand/40',
  }[tone];
  const switchOnClass = {
    green: 'bg-sage',
    red: 'bg-coral',
    sand: 'bg-ocean',
  }[tone];
  return (
    <section
      className={`bg-white rounded-lg border border-charcoal/10 p-5 flex items-start gap-4 ${
        on ? `ring-2 ${ringTone}` : ''
      }`}
    >
      <div className="p-2 rounded-md bg-cream/60 text-charcoal/70">
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="type-body-base font-semibold text-charcoal">
            {title}
          </h3>
          <button
            onClick={() => onChange(!on)}
            disabled={busy}
            aria-pressed={on}
            className={`
              relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50
              ${on ? switchOnClass : 'bg-charcoal/20'}
            `}
          >
            <span
              className={`
                inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                ${on ? 'translate-x-6' : 'translate-x-1'}
              `}
            />
            {busy && (
              <Loader2
                size={10}
                className="animate-spin absolute -right-5 text-charcoal/40"
              />
            )}
          </button>
        </div>
        <p className="text-sm text-charcoal/60 mt-1">{description}</p>
        {meta && (
          <p className="text-xs text-charcoal/40 mt-2">{meta}</p>
        )}
      </div>
    </section>
  );
}

function metaLine(
  updatedAt: string | undefined,
  updatedBy: string | undefined
): string | undefined {
  if (!updatedAt && !updatedBy) return undefined;
  const when = updatedAt ?
    new Date(updatedAt).toLocaleString('es-ES', {
      timeZone: 'Europe/Madrid',
      dateStyle: 'short',
      timeStyle: 'short',
    }) :
    '';
  return `Última edición: ${when}${updatedBy ? ` · ${updatedBy}` : ''}`;
}
