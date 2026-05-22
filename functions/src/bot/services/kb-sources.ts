/**
 * Read-only accessors for the small, KB-only Firestore documents and
 * collections that the renderer in `claude/kb.ts` pulls from.
 *
 * These are deliberately consolidated in one module rather than scattered
 * across `services/`. They share two traits:
 *
 *   1. The bot never WRITES them (operator authors locally → syncs via
 *      `bot/scripts/sync-kb.mjs`).
 *   2. They are read only during KB rebuilds, which are cached aggressively.
 *
 * Spec: `bot/specs/07-knowledge-base.md` §2.
 *
 * Each reader returns `null` (single docs) or `[]` (collections) on
 * absence so the renderer can degrade gracefully — Block B should still
 * be byte-stable when one source is missing.
 */

import {getFirestore} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";

// ── Single-doc sources ────────────────────────────────────────────────

async function readSingleDoc<T>(
  docPath: string
): Promise<T | null> {
  try {
    const snap = await getFirestore().doc(docPath).get();
    if (!snap.exists) return null;
    return snap.data() as T;
  } catch (err) {
    logger.warn("bot.services.kb_source.read_failed", {
      docPath,
      err: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

export interface CoupleDossierDoc {
  names?: {
    enrique?: {canonical?: string; friends?: string; family?: string};
    manuel?: {canonical?: string; friends?: string; family?: string};
  };
  timeline?: Record<string, unknown>;
  dance?: Record<string, unknown>;
  current?: Record<string, unknown>;
  thora?: Record<string, unknown>;
  disclosure?: Array<{
    topic: string;
    share: string;
    framing_es?: string;
    framing_en?: string;
  }>;
  honeymoon_internal?: {destination?: string; rule?: string};
}

export async function getCoupleDossier(): Promise<CoupleDossierDoc | null> {
  return readSingleDoc<CoupleDossierDoc>("config/couple");
}

export interface DressCodesDoc {
  codes?: Record<string, {
    title_es?: string;
    title_en?: string;
    code_es?: string;
    code_en?: string;
  }>;
}

export async function getDressCodes(): Promise<DressCodesDoc | null> {
  return readSingleDoc<DressCodesDoc>("config/dress_codes");
}

export interface WindTipsDoc {
  primer_es?: string;
  primer_en?: string;
  levante_strong?: {
    threshold_kmh?: number;
    tips_es?: string[];
    tips_en?: string[];
  };
  poniente_strong?: {
    threshold_kmh?: number;
    tips_es?: string[];
    tips_en?: string[];
  };
}

export async function getWindTips(): Promise<WindTipsDoc | null> {
  return readSingleDoc<WindTipsDoc>("config/wind_tips");
}

export interface TravelDoc {
  bus?: {
    pickup_label_es?: string;
    pickup_label_en?: string;
    departure_time_local?: string;
    arrive_by_local?: string;
    date_iso?: string;
    notes_es?: string;
    notes_en?: string;
  };
  airports?: Array<{
    id: string;
    name: string;
    drive_minutes_to_tarifa?: number;
    notes_es?: string;
    notes_en?: string;
  }>;
  taxi?: {phone_display?: string; notes_es?: string; notes_en?: string};
  self_drive_ceremony?: {notes_es?: string; notes_en?: string};
}

export async function getTravel(): Promise<TravelDoc | null> {
  return readSingleDoc<TravelDoc>("config/travel");
}

export interface TarifaGuideDoc {
  // The YAML is a free-shape map of category → list. We pass through
  // whatever shape sync wrote so the renderer can iterate categories
  // dynamically.
  [category: string]: unknown;
}

export async function getTarifaGuide(): Promise<TarifaGuideDoc | null> {
  return readSingleDoc<TarifaGuideDoc>("config/tarifa_guide");
}

export interface BotKbExtrasDoc {
  moderation_hints?: {
    hard_avoid?: {
      artists?: string[];
      songs?: Array<{title: string; artist?: string}>;
    };
    mild_tease?: {themes?: string[]};
    framing_note?: string;
  };
}

export async function getBotKbExtras(): Promise<BotKbExtrasDoc | null> {
  return readSingleDoc<BotKbExtrasDoc>("config/bot_kb_extras");
}

// ── Collection sources ────────────────────────────────────────────────

export interface AccommodationDoc {
  id: string;
  name: string;
  role?: string;
  role_en?: string;
  approx_price_range_eur_per_night?: string;
  booking_link?: string;
  notes_es?: string;
  notes_en?: string;
}

export async function listAccommodations(): Promise<AccommodationDoc[]> {
  try {
    const snap = await getFirestore().collection("accommodations").get();
    if (snap.empty) return [];
    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<AccommodationDoc, "id">),
    }));
  } catch (err) {
    logger.warn("bot.services.kb_source.accommodations_read_failed", {
      err: err instanceof Error ? err.message : String(err),
    });
    return [];
  }
}

export interface FaqDoc {
  id: string;
  question_es: string;
  question_en: string;
  answer_es: string;
  answer_en: string;
  tags?: string[];
  active?: boolean;
  order?: number;
}

export async function listFaq(): Promise<FaqDoc[]> {
  try {
    const snap = await getFirestore().collection("faq").get();
    if (snap.empty) return [];
    return snap.docs
      .map((d) => ({id: d.id, ...(d.data() as Omit<FaqDoc, "id">)}))
      .filter((f) => f.active !== false)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  } catch (err) {
    logger.warn("bot.services.kb_source.faq_read_failed", {
      err: err instanceof Error ? err.message : String(err),
    });
    return [];
  }
}

export interface GuestDossierDoc {
  id: string;
  name: string;
  preferredName?: string | null;
  referencePhotos?: string[];
  recognizableFor?: string | null;
  recognitionConfidenceFloor: number;
  relationship: string;
  hometown?: string | null;
  language?: string | null;
  languageOverride?: string | null;
  safeFacts?: string[];
  safeJokes?: string[];
  doNotMention?: string[];
  personalIntroFor?: string[];
  personalIntroBlurb?: string | null;
  active?: boolean;
  phoneE164?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}

export async function listGuestDossiers(): Promise<GuestDossierDoc[]> {
  try {
    const snap = await getFirestore().collection("guest_dossier").get();
    if (snap.empty) return [];
    return snap.docs
      .map((d) => ({
        id: d.id,
        ...(d.data() as Omit<GuestDossierDoc, "id">),
      }))
      .filter((g) => g.active !== false)
      .sort((a, b) => a.id.localeCompare(b.id));
  } catch (err) {
    logger.warn("bot.services.kb_source.dossiers_read_failed", {
      err: err instanceof Error ? err.message : String(err),
    });
    return [];
  }
}
