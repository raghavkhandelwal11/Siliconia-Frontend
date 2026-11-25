"use client";

import { api, ApiError, unwrap } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";

export type Serviceability = components["schemas"]["Serviceability"];

const PIN_KEY = "sx_pin";

/** The PIN code this browser checked last (a convenience only). */
export function savedPin(): string {
  try {
    return localStorage.getItem(PIN_KEY) ?? "";
  } catch {
    return "";
  }
}

export function rememberPin(pin: string) {
  try {
    localStorage.setItem(PIN_KEY, pin);
  } catch {
    // storage blocked: nothing to remember
  }
}

export async function checkPin(pin: string): Promise<Serviceability> {
  const res = await api.GET("/serviceability/{pincode}", { params: { path: { pincode: pin } } });
  if (res.response.status === 503) throw new ApiError(503, "UNAVAILABLE", "");
  return unwrap(res);
}

/** "Thu, 28 Nov" for a delivery estimate `days` from now. */
export function deliveryDate(days: number, from = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}
