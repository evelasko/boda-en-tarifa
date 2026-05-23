/**
 * Public exports for the bot subsystem. The root `functions/src/index.ts`
 * re-exports from here so all bot Cloud Functions ship together.
 */
export {whatsappWebhook} from "./webhook/handler.js";
export {
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
} from "./triggers/onContentChangeBuildKb.js";

// Scheduled functions (launch-readiness plan §4 Phase A)
export {botEventReminderTick} from "./scheduled/event-reminder.js";
export {botContentUnlockTick} from "./scheduled/content-unlock.js";
export {botFilmDeveloped} from "./scheduled/film-developed.js";
export {botKeepKbWarm} from "./scheduled/keep-kb-warm.js";
export {botPreEventWarmup} from "./scheduled/pre-event-warmup.js";

// Callables (launch-readiness plan §5 Phase B — admin UI back-ends)
export {botSetConfig} from "./callables/set-config.js";
export {botReplyToEscalation} from "./callables/reply-to-escalation.js";
export {botSendBroadcast} from "./callables/send-broadcast.js";
export {botCancelBroadcast} from "./callables/cancel-broadcast.js";
export {botAddToAllowlist} from "./callables/add-to-allowlist.js";
