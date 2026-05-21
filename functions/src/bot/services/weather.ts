/**
 * Open-Meteo client for the `get_current_weather` tool.
 *
 * Spec: `bot/specs/07-knowledge-base.md` §5.6 (return shape),
 *       `bot/specs/08-integration-contract.md` §7 (endpoint, query,
 *       wind-name rule).
 *
 * In-process cache: 30 minutes. The spec also mentions a Firestore-backed
 * cache (`config/weather_cache`); we keep it in-process for v1 — cold
 * starts on a single warm instance are rare in this traffic profile, and
 * the bot has at most a handful of concurrent instances under wedding
 * load. Revisit if cold-start variance shows up in production logs.
 */

import * as logger from "firebase-functions/logger";
import {z} from "zod";
import type {Bilingual} from "../lib/i18n.js";
import {validate} from "../lib/validation.js";

const ENDPOINT = "https://api.open-meteo.com/v1/forecast";
const LATITUDE = 36.0143;
const LONGITUDE = -5.6044;
const CACHE_TTL_MS = 30 * 60 * 1000;

const OpenMeteoCurrentSchema = z.object({
  temperature_2m: z.number(),
  weather_code: z.number(),
  wind_speed_10m: z.number(),
  wind_direction_10m: z.number(),
});

const OpenMeteoResponseSchema = z.object({
  current: OpenMeteoCurrentSchema,
});

export type WindName = "Levante" | "Poniente" | "Variable";

export interface CurrentWeather {
  temperature_c: number;
  conditions: Bilingual<string>;
  wind_speed_kmh: number;
  wind_direction: number;
  wind_name: WindName;
}

interface CachedWeather {
  data: CurrentWeather;
  fetchedAt: number;
}

let cache: CachedWeather | null = null;

/** Reset the in-process cache (used in tests). */
export function resetWeatherCache(): void {
  cache = null;
}

export async function getCurrentWeather(args?: {
  requestId?: string;
}): Promise<CurrentWeather> {
  const requestId = args?.requestId;
  const now = Date.now();
  if (cache && now - cache.fetchedAt < CACHE_TTL_MS) {
    logger.info("bot.weather.cache_hit", {
      requestId,
      ageMs: now - cache.fetchedAt,
    });
    return cache.data;
  }

  const url = new URL(ENDPOINT);
  url.searchParams.set("latitude", String(LATITUDE));
  url.searchParams.set("longitude", String(LONGITUDE));
  url.searchParams.set(
    "current",
    "temperature_2m,weather_code,wind_speed_10m,wind_direction_10m"
  );
  url.searchParams.set("timezone", "Europe/Madrid");

  const resp = await fetch(url.toString(), {
    method: "GET",
    headers: {"Accept": "application/json"},
  }).catch((err) => {
    logger.warn("bot.weather.fetch_failed", {
      requestId,
      err: err instanceof Error ? err.message : String(err),
    });
    throw new WeatherUnavailableError("network_error");
  });

  if (!resp.ok) {
    logger.warn("bot.weather.fetch_failed", {
      requestId,
      status: resp.status,
    });
    throw new WeatherUnavailableError(`http_${resp.status}`);
  }

  const json = await resp.json().catch((err) => {
    logger.warn("bot.weather.parse_failed", {
      requestId,
      err: err instanceof Error ? err.message : String(err),
    });
    throw new WeatherUnavailableError("malformed_json");
  });

  const parsed = validate(
    OpenMeteoResponseSchema,
    json,
    "open_meteo_response"
  );

  const data: CurrentWeather = {
    temperature_c: round1(parsed.current.temperature_2m),
    conditions: conditionsForCode(parsed.current.weather_code),
    wind_speed_kmh: round1(parsed.current.wind_speed_10m),
    wind_direction: Math.round(parsed.current.wind_direction_10m),
    wind_name: windNameForDirection(parsed.current.wind_direction_10m),
  };

  cache = {data, fetchedAt: now};
  logger.info("bot.weather.fetch_ok", {
    requestId,
    temperatureC: data.temperature_c,
    windKmh: data.wind_speed_kmh,
    windName: data.wind_name,
  });
  return data;
}

export class WeatherUnavailableError extends Error {
  constructor(public readonly reason: string) {
    super(`weather_unavailable: ${reason}`);
    this.name = "WeatherUnavailableError";
  }
}

function windNameForDirection(deg: number): WindName {
  // Normalize to [0, 360).
  const d = ((deg % 360) + 360) % 360;
  if (d >= 60 && d <= 120) return "Levante";
  if (d >= 240 && d <= 300) return "Poniente";
  return "Variable";
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * WMO weather code → bilingual short label. Reference:
 * https://open-meteo.com/en/docs (weather_code section).
 *
 * Covers the common cases; anything unknown collapses to "variable" so
 * Claude can still compose a sensible reply rather than apologize for
 * an unrecognized code.
 */
function conditionsForCode(code: number): Bilingual<string> {
  switch (code) {
  case 0:
    return {es: "despejado", en: "clear"};
  case 1:
    return {es: "mayormente despejado", en: "mainly clear"};
  case 2:
    return {es: "parcialmente nublado", en: "partly cloudy"};
  case 3:
    return {es: "nublado", en: "overcast"};
  case 45:
  case 48:
    return {es: "niebla", en: "fog"};
  case 51:
  case 53:
  case 55:
    return {es: "llovizna", en: "drizzle"};
  case 56:
  case 57:
    return {es: "llovizna helada", en: "freezing drizzle"};
  case 61:
  case 63:
  case 65:
    return {es: "lluvia", en: "rain"};
  case 66:
  case 67:
    return {es: "lluvia helada", en: "freezing rain"};
  case 71:
  case 73:
  case 75:
  case 77:
    return {es: "nieve", en: "snow"};
  case 80:
  case 81:
  case 82:
    return {es: "chubascos", en: "rain showers"};
  case 85:
  case 86:
    return {es: "chubascos de nieve", en: "snow showers"};
  case 95:
    return {es: "tormenta", en: "thunderstorm"};
  case 96:
  case 99:
    return {es: "tormenta con granizo", en: "thunderstorm with hail"};
  default:
    return {es: "variable", en: "variable"};
  }
}
