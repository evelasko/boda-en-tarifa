export interface SentNotification {
  id?: string;
  title: string;
  body: string;
  deepLink?: string | null;
  sentAt: string;
  sentBy: string;
  fcmMessageId?: string | null;
  status: 'sent' | 'failed';
  errorMessage?: string | null;
}

export interface SendNotificationPayload {
  title: string;
  body: string;
  deepLink?: string;
}

export interface ScheduledNotification {
  id: string;
  sendAt: string;
  title: string;
  body: string;
  type: 'event_reminder' | 'content_unlock' | 'film_development';
  /** eventId for reminders, contentType for content unlocks */
  targetId?: string;
  enabled: boolean;
  sent: boolean;
}
