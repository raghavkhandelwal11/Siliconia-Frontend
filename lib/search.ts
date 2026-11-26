import type { components } from "@/lib/api/schema";
import { apiBaseUrl, serverHeaders } from "@/lib/api/client";

export type SearchResult = components["schemas"]["SearchResult"];
export type ProductCardData = components["schemas"]["ProductCard"];
export type SpecFacet = components["schemas"]["SpecFacet"];
export type Suggestion = components["schemas"]["Suggestion"];

const KEYS = new Set([
  "q",
  "category",
  "brand",
  "priceMin",
  "priceMax",
  "rating",
  "local",
  "inStock",
  "verified",
  "sort",
]);

type RawParams = Record<string, string | string[] | undefined>;

/** Keeps only listing parameters (and spec.*) from page search params. */
export function listingParams(raw: RawParams, extra: Record<string, string> = {}): URLSearchParams {
  const out = new URLSearchParams();
  for (const [k, v] of Object.entries(raw)) {
    const val = Array.isArray(v) ? v[0] : v;
    if (val && (KEYS.has(k) || k.startsWith("spec."))) out.set(k, val);
  }
  for (const [k, v] of Object.entries(extra)) out.set(k, v);
  return out;
}

/** Server-side listing fetch, cached for 30 seconds like the API response. */
export async function fetchListing(params: URLSearchParams): Promise<SearchResult | "not-found" | null> {
  try {
    const res = await fetch(`${apiBaseUrl()}/products?${params}`, {
      headers: serverHeaders(),
      next: { revalidate: 30 },
    });
    if (res.status === 404) return "not-found";
    if (!res.ok) return null;
    return (await res.json()) as SearchResult;
  } catch {
    return null;
  }
}

/** Toggles one value in a comma-separated list parameter. */
export function toggleListValue(list: string | null, value: string): string {
  const set = new Set((list ?? "").split(",").filter(Boolean));
  if (set.has(value)) set.delete(value);
  else set.add(value);
  return [...set].join(",");
}
