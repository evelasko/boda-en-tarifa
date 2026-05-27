import {Agent as HttpsAgent} from "node:https";
import {
  create as axiosCreate,
  isAxiosError,
  type AxiosError,
  type AxiosInstance,
} from "axios";
import {META_GRAPH_API_BASE} from "../lib/config.js";

/**
 * Shared HTTPS agent with keep-alive enabled. Reused across every axios
 * instance returned by `createGraphClient` so consecutive Meta Graph
 * requests can reuse the same TCP+TLS connection instead of paying a
 * full handshake (~150-300ms baseline, often worse under degraded
 * conditions) on every call. graph.facebook.com is the only host we
 * ever talk to via this client, so a single shared pool fits.
 *
 * - `maxSockets` is set generously above the function's per-instance
 *   `concurrency: 40`. We can issue up to ~3 Meta calls per inbound
 *   (markReadWithTyping + sendText + optional location pin), so 50
 *   covers worst-case parallelism without queueing.
 * - `maxFreeSockets` keeps a small idle pool warm between bursts.
 * - `keepAliveMsecs` is the TCP keep-alive probe interval; the default
 *   1s is unnecessarily chatty for a long-lived pool.
 */
const keepAliveAgent = new HttpsAgent({
  keepAlive: true,
  keepAliveMsecs: 30_000,
  maxSockets: 50,
  maxFreeSockets: 10,
  scheduling: "lifo",
});

/**
 * Thin axios client for the Meta Graph (WhatsApp Cloud) API.
 *
 * Spec: `bot/specs/08-integration-contract.md` §2.
 *
 * Construct lazily per-call so secret values resolve at call time rather
 * than at module load (Cloud Functions v2 secret access requires this).
 * The shared `keepAliveAgent` is injected here so connection reuse
 * survives across these per-call axios instances.
 *
 * @param {string} accessToken WHATSAPP_ACCESS_TOKEN value.
 * @return {AxiosInstance}
 */
export function createGraphClient(accessToken: string): AxiosInstance {
  return axiosCreate({
    baseURL: META_GRAPH_API_BASE,
    timeout: 10_000,
    httpsAgent: keepAliveAgent,
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    // Don't throw on 4xx — caller inspects status to handle Meta error codes.
    validateStatus: (s) => s >= 200 && s < 500,
  });
}

export interface MetaApiError {
  message: string;
  type?: string;
  code?: number;
  error_subcode?: number;
  fbtrace_id?: string;
}

/**
 * Extract the most useful piece of an Axios error for logs / retries.
 *
 * @param {unknown} err
 * @return {MetaApiError}
 */
export function describeAxiosError(err: unknown): MetaApiError {
  if (isAxiosError(err)) {
    const ax = err as AxiosError<{error?: MetaApiError}>;
    const meta = ax.response?.data?.error;
    if (meta) return meta;
    return {
      message: ax.message,
      code: ax.response?.status,
    };
  }
  return {message: err instanceof Error ? err.message : String(err)};
}
