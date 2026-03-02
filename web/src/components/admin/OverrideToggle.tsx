'use client';

import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertTriangle } from 'lucide-react';
import type { TimelineEvent, TimelineOverride } from '@/types/timeline';

interface OverrideToggleProps {
  override: TimelineOverride;
  events: TimelineEvent[];
  onToggle: (active: boolean, eventId: string) => void;
  disabled?: boolean;
}

export default function OverrideToggle({
  override,
  events,
  onToggle,
  disabled,
}: OverrideToggleProps) {
  const activeEvent = events.find((e) => e.id === override.eventId);

  return (
    <div className="bg-white rounded-lg border border-charcoal/10 p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <h3 className="type-body-base font-medium text-charcoal">
            Override manual
          </h3>
          <p className="type-body-small text-charcoal/60 mt-0.5">
            Fuerza un evento como &quot;actual&quot; en todos los dispositivos
          </p>
        </div>
        <Switch
          checked={override.active}
          onCheckedChange={(checked) =>
            onToggle(checked, override.eventId || events[0]?.id || '')
          }
          disabled={disabled}
        />
      </div>

      {override.active && (
        <>
          <div className="mt-4">
            <Select
              value={override.eventId}
              onValueChange={(eventId) => onToggle(true, eventId)}
              disabled={disabled}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar evento" />
              </SelectTrigger>
              <SelectContent>
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    Día {event.dayNumber} — {event.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="mt-3 flex items-start gap-2 bg-coral/10 border border-coral/30 rounded-lg px-4 py-3">
            <AlertTriangle className="h-4 w-4 text-coral mt-0.5 shrink-0" />
            <p className="type-body-small text-coral">
              Manual override is ON — all guests see{' '}
              <strong>{activeEvent?.title ?? override.eventId}</strong> as the
              current moment
            </p>
          </div>
        </>
      )}
    </div>
  );
}
