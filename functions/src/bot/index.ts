/**
 * Public exports for the bot subsystem. The root `functions/src/index.ts`
 * re-exports from here so all bot Cloud Functions ship together.
 */
export {whatsappWebhook} from "./webhook/handler.js";
