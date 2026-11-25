"use client";

import { api, apiBaseUrl, unwrap } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";
import { ok, type Row } from "@/lib/m4";

export type Payout = components["schemas"]["Payout"];
export type LegalDoc = components["schemas"]["LegalDoc"];
export type Overview = components["schemas"]["AdminOverview"];
export type Health = components["schemas"]["HealthDashboard"];
type LegalKind = "TERMS" | "PRIVACY" | "SELLER_TERMS" | "CREATOR_TERMS" | "RETURNS";

/** Link target for a CSV download (the session cookie goes with it). */
export const csvUrl = (path: string) => `${apiBaseUrl()}${path}`;

export const m5 = {
  legal: async (kind: string) => unwrap(await api.GET("/legal/{kind}", { params: { path: { kind } } })),
  pendingLegal: async () => unwrap(await api.GET("/me/legal/pending")).items,
  acceptLegal: async (docIds: string[]) => ok(await api.POST("/me/legal/accept", { body: { docIds } })),
  sellerPayouts: async () => unwrap(await api.GET("/seller/payouts")).items,
  overview: async () => unwrap(await api.GET("/admin/overview")),
  accounts: async (q: string) => unwrap(await api.GET("/admin/accounts", { params: { query: { q } } })).items as Row[],
  setStatus: async (v: { id: string; suspend: boolean; reason: string }) =>
    ok(
      await api.POST("/admin/accounts/{id}/status", {
        params: { path: { id: v.id } },
        body: { suspend: v.suspend, reason: v.reason },
      }),
    ),
  orders: async (q: string) => unwrap(await api.GET("/admin/orders", { params: { query: { q } } })).items as Row[],
  returns: async () => unwrap(await api.GET("/admin/returns")).items as Row[],
  batches: async () => unwrap(await api.GET("/admin/payout-batches")).items as Row[],
  createBatch: async () => unwrap(await api.POST("/admin/payout-batches")),
  batch: async (id: string) =>
    unwrap(await api.GET("/admin/payout-batches/{id}", { params: { path: { id } } })).items as Row[],
  batchAction: async (v: { id: string; action: "approve" | "release" | "cancel" }) =>
    ok(await api.POST("/admin/payout-batches/{id}/{action}", { params: { path: v } })),
  config: async () => unwrap(await api.GET("/admin/config")).items as Row[],
  setConfig: async (v: { key: string; value: unknown; version: number }) =>
    ok(
      await api.PUT("/admin/config/{key}", {
        params: { path: { key: v.key } },
        body: { value: v.value as Record<string, never>, version: v.version },
      }),
    ),
  categories: async () => unwrap(await api.GET("/admin/categories")).items as Row[],
  setRates: async (v: { id: string; commissionBps: number | null; gstRateBps: number; hsn: string | null }) =>
    unwrap(
      await api.PUT("/admin/categories/{id}/rates", {
        params: { path: { id: v.id } },
        body: { commissionBps: v.commissionBps, gstRateBps: v.gstRateBps, hsn: v.hsn },
      }),
    ),
  legalDocs: async () => unwrap(await api.GET("/admin/legal")).items,
  publishLegal: async (v: { kind: LegalKind; title: string; bodyMd: string }) =>
    unwrap(await api.POST("/admin/legal", { body: v })),
  audit: async () => unwrap(await api.GET("/admin/audit")).items as Row[],
  adjustments: async () => unwrap(await api.GET("/admin/ledger-adjustments")).items as Row[],
  requestAdjustment: async (v: { accountId: string; amount: number; reason: string }) =>
    unwrap(await api.POST("/admin/ledger-adjustments", { body: v })),
  decideAdjustment: async (v: { id: string; approve: boolean }) =>
    ok(
      await api.POST("/admin/ledger-adjustments/{id}/decision", {
        params: { path: { id: v.id } },
        body: { approve: v.approve },
      }),
    ),
  health: async () => unwrap(await api.GET("/admin/health")),
  recon: async () => unwrap(await api.GET("/admin/recon-issues")).items as Row[],
};
