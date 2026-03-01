import {onSchedule} from "firebase-functions/v2/scheduler";
import {getFirestore} from "firebase-admin/firestore";
import {getMessaging} from "firebase-admin/messaging";
import * as logger from "firebase-functions/logger";

const IDEMPOTENCY_DOC = "sent_notifications/film_development_deadline";

/**
 * One-time scheduled function that fires at 05:00 CEST on May 31 2026
 * (Europe/Madrid) and sends a topic notification telling guests their
 * disposable-camera "film" has been developed.
 *
 * Client-side logic decides whether to surface the notification based
 * on the user's local camera state (already developed → ignore).
 */
export const triggerFilmDevelopment = onSchedule(
  {
    schedule: "0 5 31 5 *",
    timeZone: "Europe/Madrid",
    region: "europe-west1",
    timeoutSeconds: 30,
    maxInstances: 1,
  },
  async () => {
    const db = getFirestore();
    const idempotencyRef = db.doc(IDEMPOTENCY_DOC);

    // --- Idempotency check ---
    const existing = await idempotencyRef.get();
    if (existing.exists) {
      logger.info("Film development notification already sent — skipping.");
      return;
    }

    // --- Send topic notification ---
    const message = {
      topic: "wedding",
      notification: {
        title: "Tu carrete se ha revelado!",
        body:
          "Las fotos de tu camara desechable estan listas. " +
          "Abre la app para verlas.",
      },
      data: {
        type: "film_development",
        triggerType: "deadline",
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
      logger.info("Film development notification sent", {messageId});
    } catch (error) {
      logger.error("Failed to send film development notification", {error});
      throw error;
    }

    // --- Record idempotency flag ---
    await idempotencyRef.set({
      sentAt: new Date().toISOString(),
      triggerType: "deadline",
    });

    logger.info("Film development trigger completed successfully.");
  }
);
