/**
 * TypeScript types for the timeline/event schedule management.
 * Must match the Flutter EventSchedule model at app/lib/core/models/event_schedule.dart
 */

export interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  startTime: string; // ISO 8601 with timezone, e.g. "2026-05-30T18:00:00+02:00"
  endTime: string;   // ISO 8601 with timezone
  venueId: string;
  ctaLabel?: string;
  ctaDeepLink?: string;
  dayNumber: number; // 1, 2, or 3
}

export interface TimelineOverride {
  eventId: string;
  active: boolean;
  updatedAt: string;
}

export interface TimelineVenue {
  id: string;
  name: string;
  latitude?: number;
  longitude?: number;
}

export interface CreateTimelineEventInput {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  venueId: string;
  ctaLabel?: string;
  ctaDeepLink?: string;
  dayNumber: number;
}

export interface UpdateTimelineEventInput {
  title?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  venueId?: string;
  ctaLabel?: string;
  ctaDeepLink?: string;
  dayNumber?: number;
}
