/**
 * Event reminder notification schedule.
 *
 * Each entry defines a push notification sent to all wedding guests
 * via the "wedding" FCM topic. The `sendAt` field is the UTC time
 * at which the notification becomes eligible for delivery.
 *
 * Wedding: May 29-31, 2026, Tarifa, Spain
 * Timezone: Europe/Madrid (CEST = UTC+2 in May)
 *
 * To adjust a reminder time, update its `sendAt` value.
 * To disable a reminder without removing it, set `enabled: false`.
 */

export interface EventNotification {
  /** Unique identifier (used as Firestore doc ID for deduplication) */
  id: string;
  /** UTC time at which the notification should be sent (ISO 8601) */
  sendAt: string;
  /** FCM notification title (Spanish) */
  title: string;
  /** FCM notification body (Spanish) */
  body: string;
  /** Event identifier for client-side deep linking */
  eventId: string;
  /** Set to false to skip this notification without removing it */
  enabled: boolean;
}

export interface ContentUnlockNotification {
  /** Unique identifier (used as Firestore doc ID for deduplication) */
  id: string;
  /** UTC time at which the notification should be sent (ISO 8601) */
  sendAt: string;
  /** FCM notification title (Spanish) */
  title: string;
  /** FCM notification body (Spanish) */
  body: string;
  /** Content type key for client-side routing (camelCase) */
  contentType: string;
  /** Firestore document ID in `time_gated_content` collection */
  contentId: string;
  /** Set to false to skip this notification without removing it */
  enabled: boolean;
}

export const contentUnlockNotifications: ContentUnlockNotification[] = [
  // ── Day 2: Saturday May 30 ───────────────────────────────
  {
    id: "cocktail_menu_unlock",
    sendAt: "2026-05-30T17:30:00Z", // 19:30 CEST
    title: "¡La carta de cócteles ya está disponible!",
    body: "Abre la app para ver los cócteles de esta noche.",
    contentType: "cocktailMenu",
    contentId: "cocktail_menu",
    enabled: true,
  },
  {
    id: "seating_chart_unlock",
    sendAt: "2026-05-30T19:50:00Z", // 21:50 CEST
    title: "¡Tu mesa está lista!",
    body: "Mira dónde te sientas esta noche.",
    contentType: "seatingChart",
    contentId: "seating_chart",
    enabled: true,
  },
  {
    id: "banquet_menu_unlock",
    sendAt: "2026-05-30T20:00:00Z", // 22:00 CEST
    title: "El menú del banquete",
    body: "Descubre lo que vamos a cenar.",
    contentType: "banquetMenu",
    contentId: "banquet_menu",
    enabled: true,
  },
];

export const eventNotifications: EventNotification[] = [
  // ── Day 1: Friday May 29 ─────────────────────────────────
  {
    id: "welcome_party_reminder",
    sendAt: "2026-05-29T17:00:00Z", // 19:00 CEST — 1 h before welcome party
    title: "¡Bienvenidos a Tarifa!",
    body: "La fiesta de bienvenida empieza en 1 hora. ¡Nos vemos allí!",
    eventId: "welcome_party",
    enabled: true,
  },

  // ── Day 2: Saturday May 30 ───────────────────────────────
  {
    id: "ceremony_reminder",
    sendAt: "2026-05-30T15:30:00Z", // 17:30 CEST — 30 min before ceremony
    title: "¡La ceremonia está a punto de empezar!",
    body: "Nos casamos en 30 minutos. ¡No llegues tarde!",
    eventId: "ceremony",
    enabled: true,
  },
  {
    id: "dinner_reminder",
    sendAt: "2026-05-30T18:30:00Z", // 20:30 CEST — 30 min before dinner
    title: "¡La cena está servida!",
    body: "La cena empieza en 30 minutos. ¡Es hora de arreglarse!",
    eventId: "dinner",
    enabled: true,
  },

  // ── Day 3: Sunday May 31 ─────────────────────────────────
  {
    id: "brunch_reminder",
    sendAt: "2026-05-31T09:00:00Z", // 11:00 CEST — 1 h before brunch
    title: "¡Buenos días!",
    body: "El brunch de despedida empieza en 1 hora. ¡Te esperamos!",
    eventId: "brunch",
    enabled: true,
  },
];
