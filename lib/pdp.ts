import type { components } from "@/lib/api/schema";
import { apiBaseUrl } from "@/lib/api/client";

export type ProductPage = components["schemas"]["ProductPage"];
export type ProductLive = components["schemas"]["ProductLive"];
export type ProductCardData = components["schemas"]["ProductCard"];

/** Static product for the page; Next.js keeps it 60 s like the API. */
export async function fetchProduct(slug: string): Promise<ProductPage | "not-found" | null> {
  try {
    const res = await fetch(`${apiBaseUrl()}/products/${encodeURIComponent(slug)}`, {
      next: { revalidate: 60, tags: [`product:${slug}`] },
    });
    if (res.status === 404) return "not-found";
    if (!res.ok) return null;
    return (await res.json()) as ProductPage;
  } catch {
    return null;
  }
}

export async function fetchSimilar(id: string): Promise<ProductCardData[]> {
  try {
    const res = await fetch(`${apiBaseUrl()}/products/${id}/similar`, { next: { revalidate: 300 } });
    return res.ok ? ((await res.json()) as { items: ProductCardData[] }).items : [];
  } catch {
    return [];
  }
}

/** Variant options as groups: { Colour: ["Black", "Blue"], Storage: [...] }. */
export function optionGroups(variants: ProductPage["variants"]): Record<string, string[]> {
  const groups: Record<string, string[]> = {};
  for (const v of variants) {
    for (const [k, val] of Object.entries(v.attrs)) {
      groups[k] ??= [];
      if (!groups[k].includes(val)) groups[k].push(val);
    }
  }
  return groups;
}

/** The variant matching the chosen options, or the closest one sharing the changed option. */
export function pickVariant(variants: ProductPage["variants"], chosen: Record<string, string>) {
  return (
    variants.find((v) => Object.entries(chosen).every(([k, val]) => v.attrs[k] === val)) ??
    variants.find((v) => Object.entries(chosen).some(([k, val]) => v.attrs[k] === val)) ??
    variants[0]
  );
}

/** Formats a spec value for the table. */
export function specText(value: unknown, unit?: string, yes = "Yes", no = "No"): string {
  if (typeof value === "boolean") return value ? yes : no;
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "number")
    return unit ? `${value.toLocaleString("en-IN")} ${unit}` : value.toLocaleString("en-IN");
  return String(value ?? "");
}
