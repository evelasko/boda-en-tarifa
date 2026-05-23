import {z} from "zod";

/**
 * Classify a Meta webhook payload into a discrete event kind so the
 * router can dispatch to the correct handler in subsequent phases.
 *
 * Spec: `bot/specs/08-integration-contract.md` §1.3 / §1.4,
 *       `bot/specs/03-architecture.md` §5.
 *
 * Phase 1 only acts on `kind === "text"` (responds with the placeholder
 * reply). Other kinds are recognized so we can log them and return 200
 * without exploding when they arrive.
 */

// ── Zod schemas mirroring Meta's payload shape (only fields we touch) ──────

const ContactSchema = z.object({
  profile: z.object({name: z.string()}).optional(),
  wa_id: z.string(),
});

const MessageBaseSchema = z.object({
  from: z.string(),
  id: z.string(),
  timestamp: z.string(),
  type: z.string(),
});

const TextMessageSchema = MessageBaseSchema.extend({
  type: z.literal("text"),
  text: z.object({body: z.string()}),
});

const InteractiveMessageSchema = MessageBaseSchema.extend({
  type: z.literal("interactive"),
  interactive: z.object({
    type: z.string(),
  }).passthrough(),
});

const MediaMessageSchema = MessageBaseSchema.extend({
  type: z.enum(["image", "video", "audio", "document", "sticker"]),
});

const StatusErrorSchema = z.object({
  code: z.number().optional(),
  title: z.string().optional(),
  message: z.string().optional(),
}).passthrough();

const StatusSchema = z.object({
  id: z.string(),
  status: z.string(),
  timestamp: z.string(),
  recipient_id: z.string(),
  errors: z.array(StatusErrorSchema).optional(),
}).passthrough();

const ChangeValueSchema = z.object({
  messaging_product: z.string().optional(),
  metadata: z.object({
    display_phone_number: z.string().optional(),
    phone_number_id: z.string().optional(),
  }).optional(),
  contacts: z.array(ContactSchema).optional(),
  messages: z.array(z.unknown()).optional(),
  statuses: z.array(StatusSchema).optional(),
}).passthrough();

const ChangeSchema = z.object({
  field: z.string(),
  value: ChangeValueSchema,
});

const EntrySchema = z.object({
  id: z.string().optional(),
  changes: z.array(ChangeSchema),
});

export const WebhookPayloadSchema = z.object({
  object: z.string(),
  entry: z.array(EntrySchema),
});

export type WebhookPayload = z.infer<typeof WebhookPayloadSchema>;

// ── Classified event types ─────────────────────────────────────────────────

export type ClassifiedEvent =
  | {
      kind: "text";
      messageId: string;
      from: string; // Meta wa_id (no `+`)
      profileName?: string;
      text: string;
      phoneNumberId?: string;
    }
  | {
      kind: "interactive";
      messageId: string;
      from: string;
      profileName?: string;
      interactiveType: string;
      raw: unknown;
      phoneNumberId?: string;
    }
  | {
      kind: "audio";
      messageId: string;
      from: string;
      profileName?: string;
      mediaId: string;
      mimeType?: string;
      phoneNumberId?: string;
    }
  | {
      kind: "media";
      messageId: string;
      from: string;
      profileName?: string;
      mediaType: "image" | "video" | "document" | "sticker";
      raw: unknown;
      phoneNumberId?: string;
    }
  | {
      kind: "status";
      messageId: string;
      status: string;
      recipientId: string;
      errors?: Array<{code?: number; title?: string; message?: string}>;
    }
  | {
      kind: "unsupported";
      reason: string;
      raw: unknown;
    };

/**
 * Walk a parsed payload and yield one classified event per atomic Meta
 * `messages[]` or `statuses[]` entry. Most webhooks contain a single
 * change with a single message, but the schema allows arrays.
 *
 * @param {unknown} body Parsed JSON body of the webhook POST.
 * @return {ClassifiedEvent[]}
 */
export function classifyEvents(body: unknown): ClassifiedEvent[] {
  const parsed = WebhookPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return [{kind: "unsupported", reason: "schema_invalid", raw: body}];
  }

  const events: ClassifiedEvent[] = [];

  for (const entry of parsed.data.entry) {
    for (const change of entry.changes) {
      if (change.field !== "messages") continue;

      const value = change.value;
      const phoneNumberId = value.metadata?.phone_number_id;
      const contactsByWaId = new Map<string, string | undefined>();
      for (const c of value.contacts ?? []) {
        contactsByWaId.set(c.wa_id, c.profile?.name);
      }

      // Status receipts (delivered/read/failed)
      for (const s of value.statuses ?? []) {
        events.push({
          kind: "status",
          messageId: s.id,
          status: s.status,
          recipientId: s.recipient_id,
          errors: s.errors,
        });
      }

      // Inbound messages
      for (const raw of value.messages ?? []) {
        const event = classifyMessage(raw, contactsByWaId, phoneNumberId);
        events.push(event);
      }
    }
  }

  return events;
}

/**
 * Classify a single Meta `messages[]` element.
 *
 * @param {unknown} raw
 * @param {Map<string, string | undefined>} contactsByWaId
 * @param {string | undefined} phoneNumberId
 * @return {ClassifiedEvent}
 */
function classifyMessage(
  raw: unknown,
  contactsByWaId: Map<string, string | undefined>,
  phoneNumberId: string | undefined
): ClassifiedEvent {
  const text = TextMessageSchema.safeParse(raw);
  if (text.success) {
    return {
      kind: "text",
      messageId: text.data.id,
      from: text.data.from,
      profileName: contactsByWaId.get(text.data.from),
      text: text.data.text.body,
      phoneNumberId,
    };
  }

  const interactive = InteractiveMessageSchema.safeParse(raw);
  if (interactive.success) {
    return {
      kind: "interactive",
      messageId: interactive.data.id,
      from: interactive.data.from,
      profileName: contactsByWaId.get(interactive.data.from),
      interactiveType: interactive.data.interactive.type,
      raw,
      phoneNumberId,
    };
  }

  const media = MediaMessageSchema.safeParse(raw);
  if (media.success) {
    // Audio gets surfaced as a first-class kind (launch-readiness E1)
    // so the webhook can route it to the Whisper-backed voice handler
    // rather than the image-only media pipeline.
    if (media.data.type === "audio") {
      const node = (raw as Record<string, unknown>)["audio"];
      const audio = (typeof node === "object" && node !== null) ?
        (node as Record<string, unknown>) :
        {};
      const mediaId = typeof audio.id === "string" ? audio.id : "";
      const mimeType = typeof audio.mime_type === "string" ?
        audio.mime_type :
        undefined;
      if (!mediaId) {
        return {kind: "unsupported", reason: "audio_missing_id", raw};
      }
      return {
        kind: "audio",
        messageId: media.data.id,
        from: media.data.from,
        profileName: contactsByWaId.get(media.data.from),
        mediaId,
        mimeType,
        phoneNumberId,
      };
    }
    return {
      kind: "media",
      messageId: media.data.id,
      from: media.data.from,
      profileName: contactsByWaId.get(media.data.from),
      mediaType: media.data.type,
      raw,
      phoneNumberId,
    };
  }

  const base = MessageBaseSchema.safeParse(raw);
  const reason = base.success ?
    `unhandled_type:${base.data.type}` :
    "schema_invalid";
  return {
    kind: "unsupported",
    reason,
    raw,
  };
}
