import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";
import {setGlobalOptions} from "firebase-functions";

// Initialize Firebase Admin SDK
initializeApp();

// Drop `undefined` values during Firestore serialization. Must be set
// BEFORE any other module calls `getFirestore()` — which is why this
// lives at module scope here and before the re-exports below trigger
// downstream module loads.
//
// Reason: the strict default rejects documents with any `undefined`
// nested value, which on 2026-05-23 caused every Thora reply
// containing a tool call to fail its outbound audit write (the
// `errored` field on a successful tool call is `boolean | undefined`).
// That dropped assistant turns from the audit log → next inbound's
// loadHistory saw unanswered user turns → Claude repeated prior
// content. See `bot/docs/fix-message-doubling-plan.md`.
getFirestore().settings({ignoreUndefinedProperties: true});

// Global cap as a safety net only. The bot webhook overrides this with
// its own maxInstances=50 (launch-readiness A6); other functions are
// scheduled or low-traffic and don't need more than 10.
setGlobalOptions({maxInstances: 10});

// Camera
export {triggerFilmDevelopment} from "./camera/trigger-film-development.js";

// Notifications
//
// Legacy FCM notifiers (`sendEventReminder`, `sendContentUnlockNotification`)
// have been retired — there is no native app to push to and the bot owns
// the wedding-day proactive sends now (launch-readiness plan A2 / A3).

// Bot (WhatsApp Cloud API)
export {
  whatsappWebhook,
  botKbBumpOnEvents,
  botKbBumpOnVenues,
  botKbBumpOnFaq,
  botKbBumpOnAccommodations,
  botKbBumpOnGuestDossier,
  botKbBumpOnTimeGated,
  botKbBumpOnConfigCouple,
  botKbBumpOnConfigTarifaGuide,
  botKbBumpOnConfigDressCodes,
  botKbBumpOnConfigWindTips,
  botKbBumpOnConfigTravel,
  botKbBumpOnConfigBotKbExtras,
  botEventReminderTick,
  botContentUnlockTick,
  botFilmDeveloped,
  botKeepKbWarm,
  botPreEventWarmup,
  botSetConfig,
  botReplyToEscalation,
  botSendBroadcast,
  botCancelBroadcast,
  botAddToAllowlist,
} from "./bot/index.js";
