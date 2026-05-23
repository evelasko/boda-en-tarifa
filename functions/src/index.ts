import {initializeApp} from "firebase-admin/app";
import {setGlobalOptions} from "firebase-functions";

// Initialize Firebase Admin SDK
initializeApp();

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
  botSetConfig,
  botReplyToEscalation,
  botSendBroadcast,
  botCancelBroadcast,
} from "./bot/index.js";
