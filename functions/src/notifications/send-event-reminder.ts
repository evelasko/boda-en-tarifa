import {onSchedule} from "firebase-functions/v2/scheduler";
import {getFirestore} from "firebase-admin/firestore";
import {getMessaging} from "firebase-admin/messaging";
import * as logger from "firebase-functions/logger";
import {eventNotifications} from "../config/notifications.js";

/**
 * Config-driven event reminder function (Approach B).
 *
 * Runs every 15 minutes during the wedding weekend (May 29-31).
 * For each enabled notification whose `sendAt` time has passed,
 * it checks Firestore for deduplication and sends the FCM message
 * to the "wedding" topic if not already delivered.
 */
export const sendEventReminder = onSchedule(
  {
    schedule: "*/15 * 29-31 5 *",
    timeZone: "Europe/Madrid",
    region: "europe-west1",
    timeoutSeconds: 60,
    maxInstances: 1,
  },
  async () => {
    const db = getFirestore();
    const now = new Date();

    const dueNotifications = eventNotifications.filter(
      (n) => n.enabled && new Date(n.sendAt) <= now
    );

    if (dueNotifications.length === 0) {
      logger.info("No notifications due at this time.");
      return;
    }

    for (const notification of dueNotifications) {
      const docRef = db.doc(`sent_notifications/${notification.id}`);
      const existing = await docRef.get();

      if (existing.exists) {
        continue;
      }

      const message = {
        topic: "wedding",
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: {
          type: "event_reminder",
          eventId: notification.eventId,
        },
        android: {
          priority: "high" as const,
        },
        apns: {
          payload: {
            aps: {
              contentAvailable: true,
            },
          },
          headers: {
            "apns-priority": "10",
          },
        },
      };

      try {
        const messageId = await getMessaging().send(message);
        logger.info(`Notification ${notification.id} sent`, {messageId});
      } catch (error) {
        logger.error(`Failed to send notification ${notification.id}`, {error});
        continue;
      }

      await docRef.set({
        sentAt: new Date().toISOString(),
        type: "event_reminder",
        eventId: notification.eventId,
      });
    }

    logger.info("sendEventReminder completed.");
  }
);
