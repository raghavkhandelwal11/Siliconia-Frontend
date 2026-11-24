import { vi } from "vitest";

export type Route = { method: string; path: string; status?: number; body?: unknown };

const json = (status: number, body: unknown) =>
  new Response(status === 204 ? null : JSON.stringify(body ?? {}), {
    status,
    headers: { "Content-Type": status >= 400 ? "application/problem+json" : "application/json" },
  });

/**
 * Stubs fetch with a small route table keyed by "METHOD /api/v1/path". Each
 * route answers in order; the last answer repeats. Returns the recorded calls.
 */
export function stubApi(routes: Route[]) {
  const calls: Request[] = [];
  const queues = new Map<string, Route[]>();
  for (const r of routes) {
    const key = `${r.method} ${r.path}`;
    queues.set(key, [...(queues.get(key) ?? []), r]);
  }
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: Request) => {
      calls.push(input);
      const key = `${input.method} ${new URL(input.url).pathname.replace(/^\/api\/v1/, "")}`;
      const q = queues.get(key);
      if (!q) return json(404, { code: "NOT_FOUND", title: `No stub for ${key}` });
      const r = q.length > 1 ? q.shift()! : q[0];
      return json(r.status ?? 200, r.body);
    }),
  );
  return calls;
}
