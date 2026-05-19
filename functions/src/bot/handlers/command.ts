/**
 * Handle the small set of plain-text "commands" we recognize before
 * spending any Anthropic tokens: stop / opt-out, help.
 *
 * Spec: `bot/specs/02-conversation-design.md` §4 (rows "Stop / opt-out"
 *       and "Help"), §9 (edge cases).
 *
 * Help is intentionally NOT served from the model — it's a static list
 * message in the F15 spec. For Phase 2 the handler returns a plain
 * text fallback; Phase 3 swaps in the interactive list payload.
 */

import type {Language} from "../lib/i18n.js";
import {STOP_ACK} from "../lib/i18n.js";
import {setEnrolled} from "../services/guests.js";

export type CommandKind = "stop" | "help";

export interface CommandReply {
  kind: CommandKind;
  text: string;
}

const STOP_PATTERNS = [
  /^\s*(stop|parar|para|stop\.|baja|darme\s+de\s+baja|unsubscribe)\s*$/i,
];
const HELP_PATTERNS = [
  /^\s*(help|ayuda|menu|menú|opciones|options|\?)\s*$/i,
];

export function classifyCommand(text: string): CommandKind | null {
  for (const re of STOP_PATTERNS) if (re.test(text)) return "stop";
  for (const re of HELP_PATTERNS) if (re.test(text)) return "help";
  return null;
}

export async function handleStop(
  guestId: string,
  lang: Language
): Promise<CommandReply> {
  await setEnrolled(guestId, false);
  return {kind: "stop", text: lang === "en" ? STOP_ACK.en : STOP_ACK.es};
}

/**
 * Static help text. Phase 3 replaces this with the F15 interactive
 * list message (`02-conversation-design.md` G10).
 */
export function handleHelp(lang: Language): CommandReply {
  const text = lang === "en" ?
    "I can help with:\n" +
    "- 📅 Wedding schedule\n" +
    "- 📍 Venues and how to get there\n" +
    "- 🛏️ Accommodation\n" +
    "- 👗 Dress code\n" +
    "- ✅ Confirm / change your RSVP\n" +
    "- 📸 Send me photos\n" +
    "- 🎵 Request a song\n" +
    "- 🌊 Tarifa tips (beaches, restaurants, kite…)\n\n" +
    "What can I help with? 🐾" :
    "Te puedo ayudar con:\n" +
    "- 📅 Programa de la boda\n" +
    "- 📍 Ubicaciones y cómo llegar\n" +
    "- 🛏️ Alojamiento\n" +
    "- 👗 Código de vestimenta\n" +
    "- ✅ Confirmar / cambiar tu RSVP\n" +
    "- 📸 Mandarme fotos\n" +
    "- 🎵 Pedir una canción\n" +
    "- 🌊 Cosas de Tarifa (playas, restaurantes, kite…)\n\n" +
    "¿Qué te interesa? 🐾";
  return {kind: "help", text};
}
