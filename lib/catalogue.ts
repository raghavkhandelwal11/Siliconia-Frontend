import type { components } from "@/lib/api/schema";
import { apiBaseUrl, serverHeaders } from "@/lib/api/client";

export type CategoryNode = components["schemas"]["CategoryNode"];
export type CategoryDetail = components["schemas"]["CategoryDetail"];
export type SpecField = components["schemas"]["SpecField"];

// Server-side reads for category pages. Categories change rarely, so Next.js
// keeps the response for 5 minutes (LLD 14: ISR-style caching) and the API
// adds an ETag. A failed read returns null so the page can show a retry state.
const REVALIDATE = 300;

export async function fetchCategoryTree(): Promise<CategoryNode[] | null> {
  try {
    const res = await fetch(`${apiBaseUrl()}/categories`, {
      headers: serverHeaders(),
      next: { revalidate: REVALIDATE },
    });
    if (!res.ok) return null;
    return ((await res.json()) as { categories: CategoryNode[] }).categories;
  } catch {
    return null;
  }
}

export async function fetchCategory(slug: string): Promise<CategoryDetail | "not-found" | null> {
  try {
    const res = await fetch(`${apiBaseUrl()}/categories/${encodeURIComponent(slug)}`, {
      headers: serverHeaders(),
      next: { revalidate: REVALIDATE },
    });
    if (res.status === 404) return "not-found";
    if (!res.ok) return null;
    return (await res.json()) as CategoryDetail;
  } catch {
    return null;
  }
}
