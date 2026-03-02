'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { TimelineEvent, TimelineVenue } from '@/types/timeline';

interface EventCardProps {
  event: TimelineEvent;
  venues: TimelineVenue[];
  onEdit: (event: TimelineEvent) => void;
  onDelete: (event: TimelineEvent) => void;
}

function formatTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Madrid',
    });
  } catch {
    return isoString;
  }
}

export default function EventCard({ event, venues, onEdit, onDelete }: EventCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: event.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const venue = venues.find((v) => v.id === event.venueId);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-lg border border-charcoal/10 p-4 flex items-start gap-3 group ${
        isDragging ? 'opacity-50 shadow-lg' : ''
      }`}
    >
      <button
        className="mt-1 cursor-grab text-charcoal/30 hover:text-charcoal/60 touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>

      <div className="flex-1 min-w-0" role="button" tabIndex={0} onClick={() => onEdit(event)} onKeyDown={(e) => { if (e.key === 'Enter') onEdit(event); }}>
        <div className="flex items-center gap-2">
          <h4 className="type-body-base font-medium text-charcoal truncate">
            {event.title}
          </h4>
          {event.ctaLabel && (
            <span className="text-xs bg-ocean/10 text-ocean px-1.5 py-0.5 rounded shrink-0">
              CTA
            </span>
          )}
        </div>
        <p className="type-body-small text-charcoal/60 mt-0.5">
          {formatTime(event.startTime)} – {formatTime(event.endTime)}
          {venue && <span className="ml-2 text-charcoal/40">· {venue.name}</span>}
        </p>
        <p className="type-body-small text-charcoal/40 mt-1 truncate">
          {event.description}
        </p>
      </div>

      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onEdit(event)}
        >
          <Edit className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
          onClick={() => onDelete(event)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
