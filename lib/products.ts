"use client";

import { useQuery } from "@tanstack/react-query";
import { api, unwrap } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";

export type ProductEditor = components["schemas"]["ProductEditor"];
export type ProductSummary = components["schemas"]["ProductSummary"];
export type Variant = components["schemas"]["Variant"];
export type ProductImage = components["schemas"]["ProductImage"];
export type FieldError = components["schemas"]["FieldError"];

export const productKey = (id: string) => ["seller-product", id] as const;
export const productsKey = ["seller-products"] as const;

export function useSellerProducts() {
  return useQuery({ queryKey: productsKey, queryFn: async () => unwrap(await api.GET("/seller/products")).products });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: productKey(id),
    queryFn: async () => unwrap(await api.GET("/seller/products/{id}", { params: { path: { id } } })),
  });
}

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

/** 1999900 → "₹19,999". */
export function formatPaise(paise: number): string {
  return inr.format(paise / 100);
}

/** "19,999.50" → 1999950; NaN for anything that is not a positive amount. */
export function toPaise(rupees: string): number {
  const n = Number(rupees.replace(/[,\s₹]/g, ""));
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : NaN;
}

/** 1999950 → "19999.5" for an input box. */
export function toRupees(paise: number): string {
  return paise ? String(paise / 100) : "";
}

/** Whole-number discount of price against MRP. */
export function discountPct(mrp: number, price: number): number {
  return mrp > 0 && price > 0 && price < mrp ? Math.round(((mrp - price) / mrp) * 100) : 0;
}

/** Uploads one image file; resolves to the stored upload. */
export async function uploadImage(file: File): Promise<components["schemas"]["Upload"]> {
  const form = new FormData();
  form.append("file", file);
  const res = await api.POST("/seller/uploads/images", {
    // openapi-fetch sends FormData as-is when bodySerializer returns it.
    body: form as unknown as { file: string },
    bodySerializer: (b) => b as unknown as FormData,
  });
  return unwrap(res);
}
