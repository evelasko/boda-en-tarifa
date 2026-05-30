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
 * `film_developed` for A4) plus the Saturday bus-pickup beats
 * (`bus_pickup_early` T12, `bus_pickup_last` T13). Other templates from §05
 * (weather, pre_wedding_drinks, arrival_day_nudge, song_request_party_open,
 * manual_announcement, escalation_followup) are intentionally omitted — they
 * are not on the launch critical path and can be added in their own PRs.
 *
 * Naming: the plan uses `event_reminder_generic` / `seating_unlocked`; the
 * Meta-approved template names (per operator, 2026-05-23) are
 * `event_reminder_30min` / `seating_unlock` — language is NOT in the name.
 * Meta supports the same `name` with multiple `language.code` variants
 * under it; the `language.code` field on the payload selects ES vs EN at
 * send time. The `metaName` mapping below therefore ignores its `lang`
 * argument; the per-language selection happens via `META_LANG[lang]` in
 * the payload's `language.code` field.
 */

import {z} from "zod";

export type TemplateName =
  | "welcome_onboarding"
  | "event_reminder_generic"
  | "seating_unlocked"
  | "film_developed"
  | "farewell_thanks"
  | "bus_pickup_early"
  | "bus_pickup_last";

export type TemplateLang = "es" | "en";

/** Meta language code per locale. Matches the locales the operator picked
 * when submitting templates in WhatsApp Manager — bare `es` / `en`, not
 * regional variants. If you ever resubmit a template under `es_ES` /
 * `en_US`, update this map (or the specific template's `metaName`). */
const META_LANG: Record<TemplateLang, string> = {
  es: "es",
  en: "en",
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

export interface MetaTemplateHeaderImageParam {
  type: "image";
  image: {link: string};
}

export interface MetaTemplateComponent {
  type: "body" | "header" | "button";
  sub_type?: "url" | "quick_reply";
  index?: string;
  parameters?: Array<
    MetaTemplateBodyParam
    | MetaTemplateButtonParam
    | MetaTemplateHeaderImageParam
  >;
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

const EmptyVars = z.object({});
type EmptyVars = z.infer<typeof EmptyVars>;

const SeatingVars = z.object({
  firstName: z.string().min(1),
  tableLabel: z.string().min(1),
  /**
   * URL-button parameter for the approved template's `{{1}}` placeholder.
   * Set to `String(tableNumber)` — matches Meta's submitted example
   * (`https://bodaentarifa.com/mi-mesa/42`). Resolved per-recipient in
   * `dispatch.ts` from `seating/{guestId}.tableNumber`.
   */
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

// Mirrors the Meta-approved `event_reminder_30min` body (es-only, verified
// against WABA on 2026-05-30). Note: the operator edited the copy at
// submission — "¡Te esperamos!" (singular) NOT "¡Os esperamos!" (plural).
// Keep this preview in lockstep so the admin dry-run reflects what guests
// actually receive.
const EVENT_REMINDER_BODY: Record<
  TemplateLang,
  (v: EventReminderVars) => string
> = {
  es: ({eventName, venue, time}) =>
    `🐾 *${eventName}* empieza en 30 minutos.\n\n` +
    `📍 ${venue}\n🕐 ${time}\n\n` +
    "¡Te esperamos!",
  // Meta only approved this template in `es`. EN-only guests still see the
  // Spanish body — keep the preview honest about that.
  en: ({eventName, venue, time}) =>
    `🐾 *${eventName}* empieza en 30 minutos.\n\n` +
    `📍 ${venue}\n🕐 ${time}\n\n` +
    "¡Te esperamos!",
};

// Mirrors the Meta-approved `seating_unlock` body (es-only, verified
// against WABA on 2026-05-30). The template was edited at submission to
// prepend "El banquete comienza en breve, " — keep this preview in lockstep
// so the admin dry-run shows what guests will actually receive.
const SEATING_BODY: Record<TemplateLang, (v: SeatingVars) => string> = {
  es: ({firstName, tableLabel}) =>
    `🐾 El banquete comienza en breve, te he buscado sitio yo misma, ${firstName}.\n\n` +
    `Estás en *${tableLabel}*. Con quién más? dale al botón.`,
  // Meta only approved this template in `es`. EN-only guests still see the
  // Spanish body — same preview keeps the operator UI honest about that.
  en: ({firstName, tableLabel}) =>
    `🐾 El banquete comienza en breve, te he buscado sitio yo misma, ${firstName}.\n\n` +
    `Estás en *${tableLabel}*. Con quién más? dale al botón.`,
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

// Mirrors the Meta-approved `bus_pickup_early` body (es-only, verified
// against WABA on 2026-05-30). No body variables; the static FOOTER
// ("Thora al habla") is rendered by Meta from the approved template and
// MUST NOT be sent as a component parameter.
const BUS_PICKUP_EARLY_BODY: Record<TemplateLang, (v: EmptyVars) => string> = {
  es: () =>
    "🐾 llegó el gran día!\n\n" +
    "Recordad: los autobuses para la ceremonia salen del parking del hotel " +
    "*100% Fun* a las *17:30*. Mejor estad allí a las *17:15*.\n\n" +
    "Aún queda tiempo para un bañito 🌊",
  // Meta only approved this template in `es`. EN-only guests still see the
  // Spanish body — keep the preview honest about that.
  en: () =>
    "🐾 llegó el gran día!\n\n" +
    "Recordad: los autobuses para la ceremonia salen del parking del hotel " +
    "*100% Fun* a las *17:30*. Mejor estad allí a las *17:15*.\n\n" +
    "Aún queda tiempo para un bañito 🌊",
};

// Mirrors the Meta-approved `bus_pickup_last` body (es-only, verified
// against WABA on 2026-05-30). No body variables; static FOOTER same as T12.
const BUS_PICKUP_LAST_BODY: Record<TemplateLang, (v: EmptyVars) => string> = {
  es: () =>
    "🐾 *30 minutos* para que salgan los autobuses.\n\n" +
    "Parking del hotel *100% Fun*, salida a las *17:30*. Los novios están " +
    "al caer 🌊\n\n" +
    "¡Id yendo! Sed puntuales que los autobuseros no esperan…",
  en: () =>
    "🐾 *30 minutos* para que salgan los autobuses.\n\n" +
    "Parking del hotel *100% Fun*, salida a las *17:30*. Los novios están " +
    "al caer 🌊\n\n" +
    "¡Id yendo! Sed puntuales que los autobuseros no esperan…",
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
  bus_pickup_early: TemplateDef<EmptyVars>;
  bus_pickup_last: TemplateDef<EmptyVars>;
} = {
  welcome_onboarding: {
    name: "welcome_onboarding",
    metaName: () => "welcome_onboarding",
    vars: FirstNameVars,
    buildPayload: (lang, vars) => {
      // Approved on Meta as `en` (single locale, Spanish content) with an
      // IMAGE header — we must supply the header image with every send,
      // Meta does not reuse the example uploaded at approval time.
      const base = bodyOnlyPayload(
        "welcome_onboarding", "en", [vars.firstName]
      );
      base.components.unshift({
        type: "header",
        parameters: [
          {
            type: "image",
            image: {
              link: "https://www.bodaentarifa.com/images/bot/thora-welcome.jpg",
            },
          },
        ],
      });
      return base;
    },
    preview: (lang, vars) => WELCOME_BODY[lang](vars),
  },
  event_reminder_generic: {
    name: "event_reminder_generic",
    metaName: () => "event_reminder_30min",
    vars: EventReminderVars,
    // Meta only approved this template in `es` (verified 2026-05-30).
    // Hardcode the language code so we never request a non-existent
    // `event_reminder_30min/en` variant for English-preferring guests.
    buildPayload: (_lang, vars) =>
      bodyOnlyPayload("event_reminder_30min", "es", [
        vars.eventName,
        vars.venue,
        vars.time,
      ]),
    preview: (lang, vars) => EVENT_REMINDER_BODY[lang](vars),
  },
  seating_unlocked: {
    name: "seating_unlocked",
    metaName: () => "seating_unlock",
    vars: SeatingVars,
    buildPayload: (_lang, vars) => {
      // Meta only approved this template in `es` (verified 2026-05-30).
      // Hardcode the language code so we never request a non-existent
      // `seating_unlock/en` variant for English-preferring guests.
      const base = bodyOnlyPayload("seating_unlock", "es", [
        vars.firstName,
        vars.tableLabel,
      ]);
      // Approved URL: `https://bodaentarifa.com/mi-mesa/%7B%7B3%7D%7D{{1}}`.
      // Despite the `{{3}}` look-alike, only `{{1}}` is a live placeholder
      // (the `%7B%7B3%7D%7D` is URL-encoded literal text, not a variable).
      // So this button takes exactly one parameter, the URL suffix —
      // `seatingToken`, which we set to `String(tableNumber)` to match
      // Meta's submitted example (`https://bodaentarifa.com/mi-mesa/42`).
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
    metaName: () => "film_developed",
    vars: FirstNameVars,
    buildPayload: (lang, vars) =>
      bodyOnlyPayload("film_developed", lang, [vars.firstName]),
    preview: (lang, vars) => FILM_BODY[lang](vars),
  },
  farewell_thanks: {
    name: "farewell_thanks",
    metaName: () => "farewell_thanks",
    vars: FirstNameVars,
    buildPayload: (lang, vars) =>
      bodyOnlyPayload("farewell_thanks", lang, [vars.firstName]),
    preview: (lang, vars) => FAREWELL_BODY[lang](vars),
  },
  bus_pickup_early: {
    name: "bus_pickup_early",
    metaName: () => "bus_pickup_early",
    vars: EmptyVars,
    // Meta only approved this template in `es` (verified 2026-05-30).
    // Body has no `{{n}}` placeholders and the static FOOTER
    // ("Thora al habla") is rendered by Meta from the approved template
    // — we send `components: []` so we don't trip a 132012-series error
    // by attaching empty parameters or a footer we don't own.
    buildPayload: () => ({
      name: "bus_pickup_early",
      language: {code: "es"},
      components: [],
    }),
    preview: (lang, vars) => BUS_PICKUP_EARLY_BODY[lang](vars),
  },
  bus_pickup_last: {
    name: "bus_pickup_last",
    metaName: () => "bus_pickup_last",
    vars: EmptyVars,
    // Same shape as `bus_pickup_early`: es-only, no body params, static
    // FOOTER rendered by Meta. See note above.
    buildPayload: () => ({
      name: "bus_pickup_last",
      language: {code: "es"},
      components: [],
    }),
    preview: (lang, vars) => BUS_PICKUP_LAST_BODY[lang](vars),
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
