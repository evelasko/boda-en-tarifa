'use client';

import { useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import EventCard from './EventCard';
import type { TimelineEvent, TimelineVenue } from '@/types/timeline';

const DAY_LABELS: Record<number, string> = {
  1: 'Día 1 — Jueves 29 de mayo',
  2: 'Día 2 — Viernes 30 de mayo',
  3: 'Día 3 — Sábado 31 de mayo',
};

interface TimelineEditorProps {
  events: TimelineEvent[];
  venues: TimelineVenue[];
  onEdit: (event: TimelineEvent) => void;
  onDelete: (event: TimelineEvent) => void;
  onReorder: (dayNumber: number, oldIndex: number, newIndex: number) => void;
}

export default function TimelineEditor({
  events,
  venues,
  onEdit,
  onDelete,
  onReorder,
}: TimelineEditorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const groupedByDay = useMemo(() => {
    const groups: Record<number, TimelineEvent[]> = { 1: [], 2: [], 3: [] };
    for (const event of events) {
      const day = event.dayNumber;
      if (!groups[day]) groups[day] = [];
      groups[day].push(event);
    }
    // Sort each day by startTime
    for (const day of Object.keys(groups)) {
      groups[Number(day)].sort(
        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );
    }
    return groups;
  }, [events]);

  function handleDragEnd(dayNumber: number) {
    return (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const dayEvents = groupedByDay[dayNumber];
      const oldIndex = dayEvents.findIndex((e) => e.id === active.id);
      const newIndex = dayEvents.findIndex((e) => e.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        onReorder(dayNumber, oldIndex, newIndex);
      }
    };
  }

  return (
    <div className="space-y-8">
      {[1, 2, 3].map((dayNumber) => {
        const dayEvents = groupedByDay[dayNumber];

        return (
          <div key={dayNumber}>
            <h3 className="type-heading-6 text-charcoal mb-3">
              {DAY_LABELS[dayNumber]}
            </h3>

            {dayEvents.length === 0 ? (
              <div className="bg-white rounded-lg border border-charcoal/10 border-dashed p-6 text-center">
                <p className="type-body-small text-charcoal/40">
                  No hay eventos para este día
                </p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd(dayNumber)}
              >
                <SortableContext
                  items={dayEvents.map((e) => e.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2 relative">
                    {/* Vertical timeline line */}
                    <div className="absolute left-[22px] top-4 bottom-4 w-px bg-charcoal/10" />

                    {dayEvents.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        venues={venues}
                        onEdit={onEdit}
                        onDelete={onDelete}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        );
      })}
    </div>
  );
}
