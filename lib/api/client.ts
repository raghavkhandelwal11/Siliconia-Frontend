import createClient from "openapi-fetch";
import type { paths } from "./schema";

/**
 * Typed API client generated from the backend's OpenAPI contract
 * (Siliconia_Backend/api/openapi.yaml → lib/api/schema.d.ts).
 *
 * In the browser the API is on the same origin (Caddy, or the dev rewrites in
 * next.config.ts). Server components use BACKEND_URL to reach it directly.
 */
export function apiBaseUrl(): string {
  if (typeof window === "undefined") {
    return `${process.env.BACKEND_URL ?? "http://localhost:8080"}/api/v1`;
  }
  return `${window.location.origin}/api/v1`;
}

export const api = createClient<paths>({
  baseUrl: apiBaseUrl(),
  credentials: "include",
  // Look fetch up at call time so tests (and instrumentation) can replace it.
  fetch: (request) => globalThis.fetch(request),
});

export type Health = paths["/healthz"]["get"]["responses"]["200"]["content"]["application/json"];
