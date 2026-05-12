import {
  create as axiosCreate,
  isAxiosError,
  type AxiosError,
  type AxiosInstance,
} from "axios";
import {META_GRAPH_API_BASE} from "../lib/config.js";

/**
 * Thin axios client for the Meta Graph (WhatsApp Cloud) API.
 *
 * Spec: `bot/specs/08-integration-contract.md` §2.
 *
 * Construct lazily per-call so secret values resolve at call time rather
 * than at module load (Cloud Functions v2 secret access requires this).
 *
 * @param {string} accessToken WHATSAPP_ACCESS_TOKEN value.
 * @return {AxiosInstance}
 */
export function createGraphClient(accessToken: string): AxiosInstance {
  return axiosCreate({
    baseURL: META_GRAPH_API_BASE,
    timeout: 10_000,
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
