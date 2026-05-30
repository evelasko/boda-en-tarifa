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
  Info,
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

  // T4 (`seating_unlocked`) is the only Meta-approved es-only template
  // we send; force the audience language filter so we don't accidentally
  // narrow to en-only guests with no recipients.
  const isSeatingTemplate = template === 'seating_unlocked';
  const effectiveLanguage = isSeatingTemplate ? 'es' : language;

  const buildInput = (dryRun: boolean): SendBroadcastInput => ({
    templateName: template,
    audience: {
      ...(phones.length > 0
        ? { phones }
        : { language: effectiveLanguage, rsvpStatus }),
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
            {isSeatingTemplate && (
              <div className="mt-2 flex items-start gap-2 rounded-md border border-ocean/30 bg-ocean/5 p-3 text-xs text-charcoal/80">
                <Info size={14} className="mt-0.5 text-ocean shrink-0" />
                <div className="space-y-1">
                  <p>
                    <strong>T4 Seating Unlock:</strong>{' '}
                    las variables{' '}
                    <code className="rounded bg-charcoal/5 px-1">tableLabel</code>{' '}
                    y{' '}
                    <code className="rounded bg-charcoal/5 px-1">seatingToken</code>{' '}
                    se resuelven automáticamente desde{' '}
                    <code className="rounded bg-charcoal/5 px-1">
                      seating/{'{guestId}'}
                    </code>{' '}
                    y{' '}
                    <code className="rounded bg-charcoal/5 px-1">
                      app_config/seating_layout
                    </code>.
                  </p>
                  <p>
                    Plantilla aprobada solo en{' '}
                    <strong>español</strong>; el idioma se fuerza a{' '}
                    <code className="rounded bg-charcoal/5 px-1">es</code> para todos los destinatarios.
                  </p>
                  <p>
                    Invitados sin asignación de mesa serán bloqueados antes
                    de enviar (sin coste de plantilla) y marcados como{' '}
                    <code className="rounded bg-charcoal/5 px-1">
                      missing_seating_assignment
                    </code>.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-charcoal/70 mb-1">
                Idioma
              </label>
              <select
                value={isSeatingTemplate ? 'es' : language}
                onChange={(e) =>
                  setLanguage(e.target.value as typeof language)
                }
                disabled={phones.length > 0 || isSeatingTemplate}
                className="w-full border border-charcoal/15 rounded-md p-2 text-sm disabled:bg-charcoal/5 disabled:cursor-not-allowed"
              >
                <option value="both">Ambos (ES + EN)</option>
                <option value="es">Solo ES</option>
                <option value="en">Solo EN</option>
              </select>
              {isSeatingTemplate && (
                <p className="mt-1 text-xs text-charcoal/50">
                  T4 está aprobada solo en{' '}
                  <code className="rounded bg-charcoal/5 px-1">es</code>.
                </p>
              )}
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
            {isSeatingTemplate &&
              (preview.excluded?.missingSeating ?? 0) > 0 && (
                <div className="mt-2 space-y-2 rounded-md border border-coral/30 bg-coral/5 p-2 text-xs text-charcoal">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={14} className="mt-0.5 text-coral shrink-0" />
                    <span>
                      <strong>{preview.excluded?.missingSeating}</strong>{' '}
                      invitado
                      {preview.excluded?.missingSeating === 1 ? '' : 's'}{' '}
                      sin asignación de mesa resoluble. Se bloquearán antes
                      de enviar y aparecerán como{' '}
                      <code className="rounded bg-charcoal/5 px-1">
                        missing_seating_assignment
                      </code>{' '}
                      en la difusión.
                    </span>
                  </div>
                  {preview.missingSeatingReasonHist &&
                    Object.keys(preview.missingSeatingReasonHist).length > 0 && (
                      <div className="ml-6">
                        <div className="font-medium text-charcoal/80 mb-1">
                          Motivos:
                        </div>
                        <ul className="space-y-0.5">
                          {Object.entries(preview.missingSeatingReasonHist)
                            .sort((a, b) => b[1] - a[1])
                            .map(([reason, count]) => (
                              <li
                                key={reason}
                                className="font-mono text-[11px] text-charcoal/70"
                              >
                                <strong className="text-charcoal">
                                  {count}
                                </strong>
                                {' × '}
                                {reason}
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}
                  {preview.missingSeatingSamples &&
                    preview.missingSeatingSamples.length > 0 && (
                      <details className="ml-6">
                        <summary className="cursor-pointer text-charcoal/70 hover:text-charcoal">
                          Ver invitados afectados (primeros{' '}
                          {preview.missingSeatingSamples.length})
                        </summary>
                        <ul className="mt-1 space-y-0.5">
                          {preview.missingSeatingSamples.map(
                            ([guestId, reason]) => (
                              <li
                                key={guestId}
                                className="font-mono text-[11px] text-charcoal/60"
                              >
                                <code className="text-charcoal/80">
                                  {guestId}
                                </code>
                                {' — '}
                                {reason}
                              </li>
                            )
                          )}
                        </ul>
                      </details>
                    )}
                  <div className="ml-6 text-charcoal/70">
                    Diagnóstico:
                    <ul className="list-disc ml-4 mt-0.5 space-y-0.5">
                      <li>
                        <code className="bg-charcoal/5 px-1 rounded">
                          no_seating_doc
                        </code>
                        : el invitado no tiene fila en{' '}
                        <code className="bg-charcoal/5 px-1 rounded">
                          seating/
                        </code>.
                      </li>
                      <li>
                        <code className="bg-charcoal/5 px-1 rounded">
                          layout_unseeded
                        </code>
                        : falta{' '}
                        <code className="bg-charcoal/5 px-1 rounded">
                          app_config/seating_layout
                        </code>
                        . Corre{' '}
                        <code className="bg-charcoal/5 px-1 rounded">
                          scripts/seed-seating-layout.ts
                        </code>.
                      </li>
                      <li>
                        <code className="bg-charcoal/5 px-1 rounded">
                          unresolvable_table:&lt;valor&gt;
                        </code>
                        : el valor en{' '}
                        <code className="bg-charcoal/5 px-1 rounded">
                          tableName
                        </code>{' '}
                        no es un número de mesa válido ni un nombre del layout.
                      </li>
                    </ul>
                  </div>
                </div>
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
