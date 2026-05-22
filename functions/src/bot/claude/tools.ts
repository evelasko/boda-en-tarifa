/**
 * Anthropic tool definitions + per-tool executor stubs.
 *
 * Spec: `bot/specs/07-knowledge-base.md` §5 ("Tools — full
 *       specifications").
 *
 * Phase 2 scope (`bot/docs/implementation-plan.md` Phase 2): definitions
 * are complete; most executors are stubs that return placeholder data
 * with `_stub: true`. Phase 3 wires real implementations.
 *
 * The pipeline (`claude/pipeline.ts`) resolves a tool name to an
 * executor via `executeTool` and feeds the result back into the
 * conversation as a `tool_result` content block.
 */

import type Anthropic from "@anthropic-ai/sdk";
import * as logger from "firebase-functions/logger";
import type {E164} from "../lib/phone.js";
import type {Language} from "../lib/i18n.js";
import {displayName, getGuestByPhone} from "../services/guests.js";
import {listEvents} from "../services/events.js";
import {getVenue} from "../services/venues.js";
import {
  getCurrentWeather,
  WeatherUnavailableError,
} from "../services/weather.js";
import {
  createEscalation,
  linkEscalationToConversation,
  type Urgency,
} from "../services/escalation.js";
import {moderateSongRequest} from "../services/songs.js";
import {dayOfWedding, toMadridIso} from "../lib/time.js";

// ── Tool definitions (passed to Anthropic SDK) ─────────────────────────────

export const TOOLS: Anthropic.Messages.Tool[] = [
  {
    name: "get_guest_context",
    description:
      "Get the current guest's profile, RSVP, and current conversation state.",
    input_schema: {type: "object", properties: {}, required: []},
  },
  {
    name: "lookup_events",
    description:
      "List wedding events. Filter by event_id, day, or " +
      "\"next\"/\"current\"/\"today\"/\"tomorrow\"/\"all\".",
    input_schema: {
      type: "object",
      properties: {
        filter: {
          type: "string",
          description:
            "Optional. event_id, or one of " +
            "today, tomorrow, next, current, all.",
        },
      },
      required: [],
    },
  },
  {
    name: "lookup_venue",
    description: "Get full venue card by ID.",
    input_schema: {
      type: "object",
      properties: {venue_id: {type: "string"}},
      required: ["venue_id"],
    },
  },
  {
    name: "lookup_seating",
    description:
      "Get the current guest's seating assignment. " +
      "Errors with \"locked\" before unlock time.",
    input_schema: {type: "object", properties: {}, required: []},
  },
  {
    name: "lookup_couple_facts",
    description:
      "Curated facts about Enrique and Manuel from the couple-dossier, " +
      "subject to the disclosure policy.",
    input_schema: {
      type: "object",
      properties: {
        topic: {
          type: "string",
          enum: [
            "met",
            "relationship_timeline",
            "dance",
            "teaching",
            "wedding_dance",
            "general",
          ],
        },
      },
      required: ["topic"],
    },
  },
  {
    name: "lookup_guest_dossier",
    description:
      "Internal dossier for a recognized guest. Never surface content " +
      "directly to other guests.",
    input_schema: {
      type: "object",
      properties: {guest_id: {type: "string"}},
      required: ["guest_id"],
    },
  },
  {
    name: "lookup_tarifa_guide",
    description:
      "Tarifa concierge recommendations from the curated guide. " +
      "Filter by category and/or area.",
    input_schema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          enum: [
            "beaches",
            "restaurants",
            "kite_wind",
            "water",
            "sightseeing",
            "day_trips",
            "whale_watching",
            "walking",
            "nightlife",
            "family",
          ],
        },
        area: {type: "string"},
      },
      required: [],
    },
  },
  {
    name: "get_current_weather",
    description: "Current weather and wind in Tarifa. Cached 30 min.",
    input_schema: {type: "object", properties: {}, required: []},
  },
  {
    name: "get_now",
    description: "Current ISO datetime in Europe/Madrid.",
    input_schema: {type: "object", properties: {}, required: []},
  },
  {
    name: "send_location_pin",
    description: "Send a WhatsApp location pin for a venue.",
    input_schema: {
      type: "object",
      properties: {venue_id: {type: "string"}},
      required: ["venue_id"],
    },
  },
  {
    name: "trigger_flow",
    description:
      "Trigger a WhatsApp Flow for structured input. Available flows: " +
      "song_request.",
    input_schema: {
      type: "object",
      properties: {
        flow_name: {
          type: "string",
          enum: ["song_request"],
        },
      },
      required: ["flow_name"],
    },
  },
  {
    name: "escalate_to_operator",
    description:
      "Forward this conversation to Enrique. Use for: low confidence, " +
      "sensitive topics, explicit user request, schedule change requests, " +
      "repeated unresolved questions.",
    input_schema: {
      type: "object",
      properties: {
        reason: {type: "string"},
        summary: {type: "string"},
        urgency: {type: "string", enum: ["low", "normal", "high"]},
      },
      required: ["reason", "summary", "urgency"],
    },
  },
  {
    name: "moderate_song_request",
    description:
      "Check a song against operator preferences. Returns a verdict " +
      "('accept' default; 'tease_then_accept' for mild_tease themes — " +
      "record AND wink; 'decline_softly' only for explicit hard_avoid " +
      "entries — rare). Guests must feel heard.",
    input_schema: {
      type: "object",
      properties: {
        title: {type: "string"},
        artist: {type: "string"},
      },
      required: ["title"],
    },
  },
  {
    name: "resolve_spotify_track",
    description:
      "Search Spotify for a track and return the best match URI, or " +
      "\"not_found\".",
    input_schema: {
      type: "object",
      properties: {
        title: {type: "string"},
        artist: {type: "string"},
      },
      required: ["title"],
    },
  },
];

// ── Executor wiring ────────────────────────────────────────────────────────

export interface ToolContext {
  /** E.164 phone of the current guest — the "from" of the inbound. */
  phone: E164;
  language: Language;
  requestId: string;
  /** Resolved guest uid for the current turn. */
  guestId: string;
  /** Meta `wamid` of the inbound that triggered this turn. */
  inboundMessageId: string;
  /** Raw text of the inbound that triggered this turn. */
  inboundText: string;
}

export interface ToolResult {
  output: Record<string, unknown>;
  errored?: boolean;
  /** Side-effect markers (e.g. `send_location_pin`) handled by the
   *  pipeline after Claude's final text is composed. Pipeline reads
   *  this to enqueue downstream sends. */
  sideEffect?:
    | {kind: "send_location_pin"; venueId: string}
    | {kind: "trigger_flow"; flowName: string}
    | {
        kind: "escalation_recorded";
        escalationId: string;
        urgency: "low" | "normal" | "high";
      };
}

/**
 * Look up and execute a tool by name. Stubs return `{_stub: true}` so
 * upstream eval can detect "this tool hasn't been wired yet" without
 * the model hallucinating around an empty object.
 */
export async function executeTool(
  name: string,
  input: Record<string, unknown>,
  ctx: ToolContext
): Promise<ToolResult> {
  switch (name) {
  case "get_guest_context":
    return execGetGuestContext(ctx);
  case "lookup_events":
    return execLookupEvents(input);
  case "lookup_venue":
    return execLookupVenue(input);
  case "lookup_seating":
    return stub(name, "seating service lands in Phase 3");
  case "lookup_couple_facts":
    return stub(name, "couple dossier reader lands in Phase 3");
  case "lookup_guest_dossier":
    return stub(name, "guest dossier reader lands in Phase 3");
  case "lookup_tarifa_guide":
    return stub(name, "tarifa guide reader lands in Phase 3");
  case "get_current_weather":
    return execGetCurrentWeather(ctx);
  case "get_now":
    return execGetNow();
  case "send_location_pin":
    return execSendLocationPin(input);
  case "trigger_flow":
    return execTriggerFlow(input);
  case "escalate_to_operator":
    return execEscalateToOperator(input, ctx);
  case "moderate_song_request":
    return execModerateSongRequest(input);
  case "resolve_spotify_track":
    return stub(name, "spotify resolver lands in Phase 3");
  default:
    return {output: {error: `unknown_tool: ${name}`}, errored: true};
  }
}

// ── Phase 2 wired tools ────────────────────────────────────────────────────

async function execGetGuestContext(ctx: ToolContext): Promise<ToolResult> {
  const g = await getGuestByPhone(ctx.phone);
  if (!g) {
    return {output: {error: "guest_not_found"}, errored: true};
  }
  // The spec keeps `first_name` as the tool's output shape (Claude is
  // tuned for it); we resolve it through `displayName` which honors
  // `preferredName` first and falls back to the leading token of
  // `fullName`. `preferred_name` is the same value, kept distinct in
  // case future tuning wants to surface a longer formal name.
  const name = displayName(g);
  return {
    output: {
      guest_id: g.id,
      first_name: name,
      preferred_name: name,
      full_name: g.fullName,
      language: g.language ?? ctx.language,
      rsvp_status: g.rsvpStatus ?? "pending",
      events_attending: g.invitedTo ?? [],
      photo_consent: g.photoConsent ?? null,
      directory_visible: g.directoryVisible ?? null,
    },
  };
}

async function execLookupEvents(
  input: Record<string, unknown>
): Promise<ToolResult> {
  const filter = typeof input.filter === "string" ? input.filter : "all";
  const events = await listEvents();
  // Phase 2: implement "all" and "by event_id"; the day filters (today,
  // tomorrow, next, current) are time-aware and land in Phase 3 once
  // events have real start times in Firestore.
  if (filter === "all") return {output: {events}};
  const direct = events.find((e) => e.id === filter);
  if (direct) return {output: {events: [direct]}};
  return {
    output: {events: [], _filter: filter, _note: "filter not yet implemented"},
  };
}

async function execLookupVenue(
  input: Record<string, unknown>
): Promise<ToolResult> {
  const id = typeof input.venue_id === "string" ? input.venue_id : "";
  if (!id) return {output: {error: "missing_venue_id"}, errored: true};
  const v = await getVenue(id);
  if (!v) {
    return {
      output: {error: "venue_not_found", venue_id: id},
      errored: true,
    };
  }
  return {output: {venue: v}};
}

async function execGetCurrentWeather(
  ctx: ToolContext
): Promise<ToolResult> {
  try {
    const w = await getCurrentWeather({requestId: ctx.requestId});
    return {
      output: {
        temperature_c: w.temperature_c,
        conditions: w.conditions,
        wind_speed_kmh: w.wind_speed_kmh,
        wind_direction: w.wind_direction,
        wind_name: w.wind_name,
      },
    };
  } catch (err) {
    const reason = err instanceof WeatherUnavailableError ?
      err.reason : "weather_unavailable";
    return {
      output: {error: "weather_unavailable", reason},
      errored: true,
    };
  }
}

async function execEscalateToOperator(
  input: Record<string, unknown>,
  ctx: ToolContext
): Promise<ToolResult> {
  const reason = typeof input.reason === "string" ? input.reason : "";
  const summary = typeof input.summary === "string" ? input.summary : "";
  const urgencyIn = typeof input.urgency === "string" ?
    input.urgency : "normal";
  if (!reason || !summary) {
    return {
      output: {error: "missing_reason_or_summary"},
      errored: true,
    };
  }
  const allowed: Urgency[] = ["low", "normal", "high"];
  const urgency: Urgency = (allowed as string[]).includes(urgencyIn) ?
    (urgencyIn as Urgency) : "normal";

  try {
    const escalationId = await createEscalation({
      guestId: ctx.guestId,
      guestPhone: ctx.phone,
      guestLanguage: ctx.language,
      reason,
      summary,
      urgency,
      triggeringMessageId: ctx.inboundMessageId,
      triggeringMessageText: ctx.inboundText,
    });
    await linkEscalationToConversation(ctx.phone, escalationId);
    logger.info("bot.escalation.created", {
      requestId: ctx.requestId,
      escalationId,
      urgency,
    });
    return {
      output: {ok: true, escalation_id: escalationId},
      sideEffect: {
        kind: "escalation_recorded",
        escalationId,
        urgency,
      },
    };
  } catch (err) {
    logger.error("bot.escalation.failed", {
      requestId: ctx.requestId,
      err: err instanceof Error ? err.message : String(err),
    });
    return {
      output: {error: "escalation_failed"},
      errored: true,
    };
  }
}

function execGetNow(): ToolResult {
  const d = new Date();
  return {
    output: {
      iso: toMadridIso(d),
      day_of_wedding: dayOfWedding(d),
    },
  };
}

function execSendLocationPin(input: Record<string, unknown>): ToolResult {
  const venueId = typeof input.venue_id === "string" ? input.venue_id : "";
  if (!venueId) return {output: {error: "missing_venue_id"}, errored: true};
  return {
    output: {ok: true, queued: true},
    sideEffect: {kind: "send_location_pin", venueId},
  };
}

function execTriggerFlow(input: Record<string, unknown>): ToolResult {
  const flowName = typeof input.flow_name === "string" ? input.flow_name : "";
  if (!flowName) return {output: {error: "missing_flow_name"}, errored: true};
  return {
    output: {ok: true, queued: true},
    sideEffect: {kind: "trigger_flow", flowName},
  };
}

async function execModerateSongRequest(
  input: Record<string, unknown>
): Promise<ToolResult> {
  const title = typeof input.title === "string" ? input.title : "";
  const artist = typeof input.artist === "string" ? input.artist : undefined;
  if (!title.trim()) {
    return {output: {error: "missing_title"}, errored: true};
  }
  const res = await moderateSongRequest(title, artist);
  return {output: {verdict: res.verdict, hint: res.hint ?? null}};
}

function stub(name: string, note: string): ToolResult {
  return {
    output: {_stub: true, tool: name, note},
  };
}
