import createClient from "openapi-fetch";
import type { components, paths } from "./schema";

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

const CSRF_COOKIE = "sx_csrf";
const CSRF_HEADER = "X-CSRF-Token";
const SAFE = new Set(["GET", "HEAD", "OPTIONS"]);

export function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const hit = document.cookie.split("; ").find((c) => c.startsWith(`${name}=`));
  return hit ? decodeURIComponent(hit.slice(name.length + 1)) : undefined;
}

// Double-submit CSRF (LLD 4.2): copy the sx_csrf cookie into a header on every
// state-changing request. Read at send time because refresh rotates it.
function withCsrf(request: Request): Request {
  if (SAFE.has(request.method)) return request;
  const token = readCookie(CSRF_COOKIE);
  if (!token) return request;
  const headers = new Headers(request.headers);
  headers.set(CSRF_HEADER, token);
  return new Request(request, { headers });
}

// One refresh at a time, shared by every request that saw a 401.
let refreshing: Promise<boolean> | null = null;

export function refreshSession(): Promise<boolean> {
  refreshing ??= globalThis
    .fetch(withCsrf(new Request(`${apiBaseUrl()}/auth/refresh`, { method: "POST", credentials: "include" })))
    .then((r) => r.ok)
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

/**
 * fetch used by the API client: adds the CSRF header and, when an access token
 * has expired (401), refreshes once and retries the request.
 */
export async function apiFetch(request: Request): Promise<Response> {
  const retry = request.clone();
  const res = await globalThis.fetch(withCsrf(request));
  if (res.status !== 401 || new URL(request.url).pathname.includes("/auth/")) return res;
  if (!(await refreshSession())) return res;
  return globalThis.fetch(withCsrf(retry));
}

export const api = createClient<paths>({
  baseUrl: apiBaseUrl(),
  credentials: "include",
  // Look fetch up at call time so tests (and instrumentation) can replace it.
  fetch: apiFetch,
});

export type Health = paths["/healthz"]["get"]["responses"]["200"]["content"]["application/json"];
export type Account = components["schemas"]["Account"];
export type Role = components["schemas"]["Role"];
export type Problem = components["schemas"]["Problem"];

/** Error carrying the API's stable error code (RFC 9457 problem details). */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

/** Unwraps an openapi-fetch result, throwing ApiError on problem responses. */
export function unwrap<T>(result: { data?: T; error?: unknown; response: Response }): T {
  if (result.error !== undefined || !result.response.ok) {
    const p = (result.error ?? {}) as Partial<Problem>;
    throw new ApiError(result.response.status, p.code ?? "UNKNOWN", p.detail ?? p.title ?? "Something went wrong");
  }
  return result.data as T;
}
