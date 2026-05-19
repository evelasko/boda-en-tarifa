/**
 * Zod-based runtime validation for cross-boundary payloads — Firestore
 * docs, Meta webhook bodies, Anthropic tool inputs.
 *
 * Spec: `bot/specs/04-data-model.md` §5 ("Enums…validated at write time
 *       via Zod in `bot/lib/validation.ts`").
 *
 * Schemas live here so service modules import a single source of truth
 * and Zod-parsing failures surface a consistent error class.
 */

import {z, type ZodTypeAny} from "zod";

export const LanguageSchema = z.enum(["es", "en"]);
export type LanguageSchemaT = z.infer<typeof LanguageSchema>;

export const E164Schema = z
  .string()
  .regex(/^\+[1-9]\d{6,14}$/, "expected E.164 phone");
export type E164SchemaT = z.infer<typeof E164Schema>;

export const RsvpStatusSchema = z.enum([
  "pending",
  "attending",
  "declined",
  "partial",
]);

export const UrgencySchema = z.enum(["low", "normal", "high"]);

/**
 * Parse and throw a `ValidationError` (not a raw ZodError) on failure.
 * Use at all module boundaries; catch with `instanceof ValidationError`
 * in handlers to convert into structured logs without leaking internals.
 */
export function validate<T extends ZodTypeAny>(
  schema: T,
  value: unknown,
  context: string
): z.infer<T> {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw new ValidationError(context, parsed.error.issues);
  }
  return parsed.data;
}

export class ValidationError extends Error {
  constructor(
    public readonly context: string,
    public readonly issues: ReadonlyArray<{path: (string | number)[]; message: string}>
  ) {
    super(`validation_failed: ${context}`);
    this.name = "ValidationError";
  }
}
