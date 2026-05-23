'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Send,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  callBotSendBroadcast,
  type SendBroadcastInput,
  type SendBroadcastResult,
} from '@/lib/bot-callable';

// Mirrors `functions/src/bot/whatsapp/templates.ts`. Keep in sync.
const TEMPLATE_OPTIONS = [
  { value: 'welcome_onboarding', label: 'Welcome onboarding (T1)' },
  { value: 'event_reminder_generic', label: 'Event reminder genérico (T3)' },
  { value: 'seating_unlocked', label: 'Seating unlock (T4)' },
  { value: 'film_developed', label: 'Film developed (T6)' },
  { value: 'farewell_thanks', label: 'Farewell (T8)' },
] as const;

type Step = 'compose' | 'preview' | 'confirm';

export default function NewBroadcastPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('compose');
  const [template, setTemplate] = useState<string>('welcome_onboarding');
  const [language, setLanguage] = useState<'es' | 'en' | 'both'>('both');
  const [rsvpStatus, setRsvpStatus] = useState<
    'any' | 'attending' | 'pending' | 'declined'
  >('any');
  const [phonesText, setPhonesText] = useState('');
  const [perMinuteCap, setPerMinuteCap] = useState<number>(60);
  const [preview, setPreview] = useState<SendBroadcastResult | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [busy, setBusy] = useState(false);

  const phones = phonesText
    .split(/[\s,]+/)
    .map((p) => p.trim())
    .filter((p) => p.startsWith('+') && p.length > 6);

  const buildInput = (dryRun: boolean): SendBroadcastInput => ({
    templateName: template,
    audience: {
      ...(phones.length > 0 ? { phones } : { language, rsvpStatus }),
    },
    dryRun,
    perMinuteCap,
  });

  const runDryRun = async () => {
    setBusy(true);
    try {
      const result = await callBotSendBroadcast(buildInput(true));
      setPreview(result);
      setStep('preview');
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'No se pudo previsualizar.';
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const send = async () => {
    if (confirmText.trim().toUpperCase() !== 'ENVIAR') {
      toast.error('Escribe ENVIAR exactamente para confirmar.');
      return;
    }
    setBusy(true);
    try {
      const result = await callBotSendBroadcast(buildInput(false));
      toast.success(
        `Difusión iniciada (${result.audienceCount} destinatarios)`
      );
      if (result.broadcastId) {
        router.push(
          `/admin/bot/broadcasts/${encodeURIComponent(result.broadcastId)}`
        );
      } else {
        router.push('/admin/bot/broadcasts');
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'No se pudo enviar.';
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <Link
        href="/admin/bot/broadcasts"
        className="inline-flex items-center gap-1 text-sm text-ocean hover:underline"
      >
        <ArrowLeft size={14} />
        Difusiones
      </Link>

      <Stepper step={step} />

      {step === 'compose' && (
        <section className="bg-white rounded-lg border border-charcoal/10 p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-charcoal/70 mb-1">
              Plantilla
            </label>
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className="w-full border border-charcoal/15 rounded-md p-2 text-sm"
            >
              {TEMPLATE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-charcoal/70 mb-1">
                Idioma
              </label>
              <select
                value={language}
                onChange={(e) =>
                  setLanguage(e.target.value as typeof language)
                }
                disabled={phones.length > 0}
                className="w-full border border-charcoal/15 rounded-md p-2 text-sm"
              >
                <option value="both">Ambos (ES + EN)</option>
                <option value="es">Solo ES</option>
                <option value="en">Solo EN</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal/70 mb-1">
                RSVP
              </label>
              <select
                value={rsvpStatus}
                onChange={(e) =>
                  setRsvpStatus(e.target.value as typeof rsvpStatus)
                }
                disabled={phones.length > 0}
                className="w-full border border-charcoal/15 rounded-md p-2 text-sm"
              >
                <option value="any">Cualquiera</option>
                <option value="attending">Confirmados</option>
                <option value="pending">Pendientes</option>
                <option value="declined">Declinados</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal/70 mb-1">
              Lista explícita (E.164, separados por coma o salto de línea)
            </label>
            <textarea
              value={phonesText}
              onChange={(e) => setPhonesText(e.target.value)}
              placeholder="+34600000001, +34600000002"
              className="w-full min-h-[72px] border border-charcoal/15 rounded-md p-2 text-sm font-mono"
            />
            {phones.length > 0 && (
              <p className="mt-1 text-xs text-charcoal/60">
                {phones.length} teléfono{phones.length === 1 ? '' : 's'}
                {' '}
                detectado{phones.length === 1 ? '' : 's'} (ignora filtros).
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal/70 mb-1">
              Cadencia (envíos/min)
            </label>
            <input
              type="number"
              min={1}
              max={600}
              value={perMinuteCap}
              onChange={(e) =>
                setPerMinuteCap(parseInt(e.target.value, 10) || 60)
              }
              className="w-32 border border-charcoal/15 rounded-md p-2 text-sm tabular-nums"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={runDryRun}
              disabled={busy}
              className="inline-flex items-center gap-2 bg-ocean text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-ocean/90 disabled:opacity-50"
            >
              {busy ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
              Previsualizar
            </button>
          </div>
        </section>
      )}

      {step === 'preview' && preview && (
        <section className="bg-white rounded-lg border border-charcoal/10 p-5 space-y-4">
          <div>
            <h3 className="type-body-base font-semibold text-charcoal">
              Audiencia: {preview.audienceCount} destinatario
              {preview.audienceCount === 1 ? '' : 's'}
            </h3>
            {preview.excluded && (
              <p className="text-xs text-charcoal/60 mt-1">
                Excluidos — no-enrolled: {preview.excluded.notEnrolled ?? 0},
                opt-out: {preview.excluded.hardOptOut ?? 0},
                sin teléfono: {preview.excluded.missingPhone ?? 0},
                filtros: {preview.excluded.notMatched ?? 0}.
              </p>
            )}
          </div>

          {preview.samples && preview.samples.length > 0 ? (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-charcoal/70">
                Vista previa (primeros 3)
              </h4>
              {preview.samples.map((s) => (
                <div
                  key={`${s.guestId}-${s.language}`}
                  className="bg-cream/40 rounded-md border border-charcoal/10 p-3"
                >
                  <div className="flex items-center gap-2 text-xs text-charcoal/50 mb-2">
                    <span className="uppercase">{s.language}</span>
                    <span>·</span>
                    <span className="font-mono">{s.phoneMasked}</span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-charcoal">
                    {s.rendered}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-coral flex items-center gap-2">
              <AlertCircle size={14} />
              No hay destinatarios para previsualizar.
            </div>
          )}

          <div className="flex justify-between">
            <button
              onClick={() => setStep('compose')}
              className="text-sm text-charcoal/60 hover:text-charcoal"
            >
              ← Editar
            </button>
            <button
              onClick={() => setStep('confirm')}
              disabled={preview.audienceCount === 0}
              className="inline-flex items-center gap-2 bg-ocean text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-ocean/90 disabled:opacity-50"
            >
              Confirmar y enviar <ArrowRight size={14} />
            </button>
          </div>
        </section>
      )}

      {step === 'confirm' && preview && (
        <section className="bg-white rounded-lg border border-coral/30 p-5 space-y-4">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-coral mt-0.5" />
            <div>
              <h3 className="type-body-base font-semibold text-charcoal">
                Confirmación final
              </h3>
              <p className="text-sm text-charcoal/70 mt-1">
                Vas a enviar la plantilla{' '}
                <strong>{template}</strong> a{' '}
                <strong>{preview.audienceCount}</strong> invitado
                {preview.audienceCount === 1 ? '' : 's'}.
                Escribe <code className="bg-charcoal/5 px-1 py-0.5 rounded">ENVIAR</code>{' '}
                para habilitar el botón.
              </p>
            </div>
          </div>
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="ENVIAR"
            className="w-full border border-charcoal/20 rounded-md p-2 text-sm font-mono"
            autoFocus
          />
          <div className="flex justify-between">
            <button
              onClick={() => setStep('preview')}
              className="text-sm text-charcoal/60 hover:text-charcoal"
            >
              ← Volver
            </button>
            <button
              onClick={send}
              disabled={
                confirmText.trim().toUpperCase() !== 'ENVIAR' || busy
              }
              className="inline-flex items-center gap-2 bg-coral text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-coral/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy ?
                <Loader2 size={14} className="animate-spin" /> :
                <Send size={14} />}
              Enviar a {preview.audienceCount}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

function Stepper({ step }: { step: Step }) {
  const steps: { id: Step; label: string }[] = [
    { id: 'compose', label: '1. Componer' },
    { id: 'preview', label: '2. Previsualizar' },
    { id: 'confirm', label: '3. Confirmar' },
  ];
  return (
    <div className="flex items-center gap-2 text-xs">
      {steps.map((s) => {
        const active = s.id === step;
        const done =
          steps.findIndex((x) => x.id === step) >
          steps.findIndex((x) => x.id === s.id);
        return (
          <span
            key={s.id}
            className={`
              px-3 py-1.5 rounded-md
              ${active ? 'bg-ocean text-white font-medium' : ''}
              ${done ? 'bg-sage/15 text-sage' : ''}
              ${!active && !done ? 'bg-cream text-charcoal/50' : ''}
            `}
          >
            {s.label}
          </span>
        );
      })}
    </div>
  );
}
