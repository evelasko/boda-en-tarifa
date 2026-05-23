/**
 * Meta-approved template registry.
 *
 * Authoritative copy + variables live in `bot/specs/05-message-templates.md`.
 * This file is the runtime registry: each entry knows how to build a Meta
 * `template` payload from a typed variable bag, in either language.
 *
 * Scope: launch-readiness plan A1 — minimum set needed for the initial
 * broadcast (`welcome_onboarding`, `farewell_thanks`) and the wedding-day
 * scheduled sends (`event_reminder_generic` for A2, `seating_unlocked` for A3,
 * `film_developed` for A4). Other templates from §05 (bus_pickup_*, weather,
 * pre_wedding_drinks, arrival_day_nudge, song_request_party_open,
 * manual_announcement, escalation_followup) are intentionally omitted — they
 * are not on the launch critical path and can be added in their own PRs.
 *
 * Naming: the plan uses `event_reminder_generic` / `seating_unlocked`; the
 * spec doc submitted to Meta calls them `event_reminder_30min` /
 * `seating_unlock`. The `metaName` mapping below carries the names the
 * operator submits to Meta Business Manager — those names are the source of
 * truth for Meta's side and MUST match what is approved. Logical names used
 * inside this codebase follow the launch plan.
 */

import {z} from "zod";

export type TemplateName =
  | "welcome_onboarding"
  | "event_reminder_generic"
  | "seating_unlocked"
  | "film_developed"
  | "farewell_thanks";

export type TemplateLang = "es" | "en";

/** Meta language code per locale. */
const META_LANG: Record<TemplateLang, string> = {
  es: "es_ES",
  en: "en_US",
};

/** Meta template-payload primitives. */
export interface MetaTemplateBodyParam {
  type: "text";
  text: string;
}

export interface MetaTemplateButtonParam {
  type: "text";
  text: string;
}

export interface MetaTemplateComponent {
  type: "body" | "header" | "button";
  sub_type?: "url" | "quick_reply";
  index?: string;
  parameters?: Array<MetaTemplateBodyParam | MetaTemplateButtonParam>;
}

export interface MetaTemplatePayload {
  name: string;
  language: {code: string};
  components: MetaTemplateComponent[];
}

export interface TemplateDef<V extends Record<string, string>> {
  /** Stable logical name used in code. */
  name: TemplateName;
  /** Resolves to the Meta-approved template name for a language. */
  metaName: (lang: TemplateLang) => string;
  /** Zod schema validating the variable bag the caller supplies. */
  vars: z.ZodType<V>;
  /** Build the Meta `template` field payload for a language + variable bag. */
  buildPayload: (lang: TemplateLang, vars: V) => MetaTemplatePayload;
  /**
   * Render a plain-text preview of the body in the chosen language with the
   * given variables substituted. Used by the broadcast dry-run path so the
   * operator can eyeball what guests will see before sending.
   */
  preview: (lang: TemplateLang, vars: V) => string;
}

// ── Variable shapes ────────────────────────────────────────────────────────

const FirstNameVars = z.object({firstName: z.string().min(1)});
type FirstNameVars = z.infer<typeof FirstNameVars>;

const EventReminderVars = z.object({
  eventName: z.string().min(1),
  venue: z.string().min(1),
  time: z.string().min(1),
});
type EventReminderVars = z.infer<typeof EventReminderVars>;

const SeatingVars = z.object({
  firstName: z.string().min(1),
  tableLabel: z.string().min(1),
  /** Signed token used to compose the per-guest seating URL button. */
  seatingToken: z.string().min(1),
});
type SeatingVars = z.infer<typeof SeatingVars>;

// ── Body templates ─────────────────────────────────────────────────────────
//
// Copy below mirrors `bot/specs/05-message-templates.md` §3 T1, T3, T4, T6,
// T8 exactly. If you edit these, edit the spec doc in the same PR and
// re-submit the templates to Meta.

const WELCOME_BODY: Record<TemplateLang, (v: FirstNameVars) => string> = {
  es: ({firstName}) =>
    `¡Guau Guau ${firstName}! 🐾\n\n` +
    "Soy Thora! sí, la perra de Enrique y Manuel. Mis papis me han " +
    "regalado un teléfono para que encargue de atenderos y ayudaros " +
    "durante estos días. Ya solo queda una semana y los tres queremos " +
    "que lo pases fenomenal!\n\n" +
    "Me han entrenado muy bien, así que pregúntame lo que necesites: " +
    "horarios, ubicaciones, cómo llegar, qué llevar, lo que sea. " +
    "Tu mensaje abre la conversación.",
  en: ({firstName}) =>
    `Woof ${firstName}! 🐾\n\n` +
    "I'm Thora — yes, Enrique and Manuel's dog. They handed me a " +
    "keyboard for the wedding (May 29-31, Tarifa) and turns out I'm " +
    "not bad at this.\n\n" +
    "Ask me anything: schedule, venues, how to get there, what to " +
    "wear. Just send me a message to start.",
};

const EVENT_REMINDER_BODY: Record<
  TemplateLang,
  (v: EventReminderVars) => string
> = {
  es: ({eventName, venue, time}) =>
    `🐾 *${eventName}* empieza en 30 minutos.\n\n` +
    `📍 ${venue}\n🕐 ${time}\n\n` +
    "¡Os esperamos!",
  en: ({eventName, venue, time}) =>
    `🐾 *${eventName}* starts in 30 minutes.\n\n` +
    `📍 ${venue}\n🕐 ${time}\n\n` +
    "See you there!",
};

const SEATING_BODY: Record<TemplateLang, (v: SeatingVars) => string> = {
  es: ({firstName, tableLabel}) =>
    `🐾 Te he buscado sitio yo misma, ${firstName}.\n\n` +
    `Estás en *${tableLabel}*. Con quién más? dale al botón.`,
  en: ({firstName, tableLabel}) =>
    `🐾 I picked your seat myself, ${firstName}.\n\n` +
    `You're at *${tableLabel}*. For who else is at your table, tap below.`,
};

const FILM_BODY: Record<TemplateLang, (v: FirstNameVars) => string> = {
  es: ({firstName}) =>
    `🐾 Buenas tardes ${firstName}.\n\n` +
    "Recién despierta de la siesta y con hambre. El álbum de la boda " +
    "está listo — todas las fotos que mandasteis (y muchas más), " +
    "tratadas con cariño.\n\n" +
    "Coged una copa. Mirad con calma 💛",
  en: ({firstName}) =>
    `🐾 Good evening ${firstName}.\n\n` +
    "Just woke up from a nap, already hungry. The wedding album is " +
    "ready — every photo you sent (and many more), with extra care.\n\n" +
    "Pour yourself a drink. Take it in 💛",
};

const FAREWELL_BODY: Record<TemplateLang, (v: FirstNameVars) => string> = {
  es: ({firstName}) =>
    `${firstName}, ya estoy camino a casa con mis humanos derrotados.\n\n` +
    "Gracias por venir — no habría sido lo mismo sin vosotros 🌅 Si " +
    "subís alguna foto más estos días, mandádmela y la añado al álbum.\n\n" +
    "Hasta pronto 🐾",
  en: ({firstName}) =>
    `${firstName}, I'm on the sofa now with my exhausted humans.\n\n` +
    "Thank you for being there — wouldn't have been the same without " +
    "you all 🌅 If you take any more photos in the next few days, send " +
    "them my way and I'll add them.\n\n" +
    "See you soon 🐾",
};

// ── Payload builders ───────────────────────────────────────────────────────

function bodyOnlyPayload(
  metaName: string,
  lang: TemplateLang,
  params: string[]
): MetaTemplatePayload {
  return {
    name: metaName,
    language: {code: META_LANG[lang]},
    components: [
      {
        type: "body",
        parameters: params.map<MetaTemplateBodyParam>((text) => ({
          type: "text",
          text,
        })),
      },
    ],
  };
}

// ── Registry ───────────────────────────────────────────────────────────────

export const TEMPLATES: {
  welcome_onboarding: TemplateDef<FirstNameVars>;
  event_reminder_generic: TemplateDef<EventReminderVars>;
  seating_unlocked: TemplateDef<SeatingVars>;
  film_developed: TemplateDef<FirstNameVars>;
  farewell_thanks: TemplateDef<FirstNameVars>;
} = {
  welcome_onboarding: {
    name: "welcome_onboarding",
    metaName: (lang) => `welcome_onboarding_${lang}`,
    vars: FirstNameVars,
    buildPayload: (lang, vars) =>
      bodyOnlyPayload(`welcome_onboarding_${lang}`, lang, [vars.firstName]),
    preview: (lang, vars) => WELCOME_BODY[lang](vars),
  },
  event_reminder_generic: {
    name: "event_reminder_generic",
    // Meta-side name kept as `event_reminder_30min_<lang>` to match the
    // template already authored against `05-message-templates.md` §T3.
    metaName: (lang) => `event_reminder_30min_${lang}`,
    vars: EventReminderVars,
    buildPayload: (lang, vars) =>
      bodyOnlyPayload(`event_reminder_30min_${lang}`, lang, [
        vars.eventName,
        vars.venue,
        vars.time,
      ]),
    preview: (lang, vars) => EVENT_REMINDER_BODY[lang](vars),
  },
  seating_unlocked: {
    name: "seating_unlocked",
    metaName: (lang) => `seating_unlock_${lang}`,
    vars: SeatingVars,
    buildPayload: (lang, vars) => {
      const base = bodyOnlyPayload(`seating_unlock_${lang}`, lang, [
        vars.firstName,
        vars.tableLabel,
      ]);
      // URL button takes the signed token as `{{1}}` per §T4.
      base.components.push({
        type: "button",
        sub_type: "url",
        index: "0",
        parameters: [{type: "text", text: vars.seatingToken}],
      });
      return base;
    },
    preview: (lang, vars) => SEATING_BODY[lang](vars),
  },
  film_developed: {
    name: "film_developed",
    metaName: (lang) => `film_developed_${lang}`,
    vars: FirstNameVars,
    buildPayload: (lang, vars) =>
      bodyOnlyPayload(`film_developed_${lang}`, lang, [vars.firstName]),
    preview: (lang, vars) => FILM_BODY[lang](vars),
  },
  farewell_thanks: {
    name: "farewell_thanks",
    metaName: (lang) => `farewell_thanks_${lang}`,
    vars: FirstNameVars,
    buildPayload: (lang, vars) =>
      bodyOnlyPayload(`farewell_thanks_${lang}`, lang, [vars.firstName]),
    preview: (lang, vars) => FAREWELL_BODY[lang](vars),
  },
};

/**
 * Variance-erased template view used by the dispatcher (which works with
 * arbitrary string maps). `vars.safeParse` re-narrows at call time.
 */
export type AnyTemplateDef = {
  name: TemplateName;
  metaName: (lang: TemplateLang) => string;
  vars: z.ZodType<Record<string, string>>;
  buildPayload: (
    lang: TemplateLang,
    vars: Record<string, string>
  ) => MetaTemplatePayload;
  preview: (lang: TemplateLang, vars: Record<string, string>) => string;
};

/** Get a template definition by logical name. Returns null if unknown. */
export function getTemplate(name: string): AnyTemplateDef | null {
  if (!(name in TEMPLATES)) return null;
  // Safe: the registry entries' input types are subtypes of `Record<string,
  // string>` (all values are strings), and we re-validate via Zod before
  // building any payload.
  return TEMPLATES[name as TemplateName] as unknown as AnyTemplateDef;
}

/** All registered logical names — used by the admin template-picker. */
export function listTemplateNames(): TemplateName[] {
  return Object.keys(TEMPLATES) as TemplateName[];
}
