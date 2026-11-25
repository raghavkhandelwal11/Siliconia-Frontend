"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError, unwrap } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";
import type { StatusTone } from "@/components/ui/StatusChip";

export type SellerOrder = components["schemas"]["SellerOrder"];
export type SellerOrderDetail = components["schemas"]["SellerOrderDetail"];
export type TimelineEvent = components["schemas"]["TimelineEvent"];
export type SubStatus = "CONFIRMED" | "PACKED" | "SHIPPED" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED" | "RTO";

/** Status chip tone (colour is never the only signal: chips carry text and an icon). */
export const statusTone: Record<string, StatusTone> = {
  PENDING_PAYMENT: "warning",
  CONFIRMED: "info",
  PACKED: "info",
  SHIPPED: "info",
  OUT_FOR_DELIVERY: "info",
  DELIVERED: "success",
  CANCELLED: "neutral",
  EXPIRED: "neutral",
  RTO: "danger",
};

/** The invoice PDF (opened in a new tab; the browser sends the session cookie). */
export const invoiceUrl = (subOrderId: string) => `/api/v1/invoices/${subOrderId}`;
export const labelUrl = (subOrderId: string) => `/api/v1/seller/sub-orders/${subOrderId}/label`;

async function noContent(res: { response: Response; error?: unknown }, fallback: string) {
  if (!res.response.ok) {
    const e = (res.error ?? {}) as { code?: string; detail?: string; title?: string };
    throw new ApiError(res.response.status, e.code ?? "", e.detail ?? e.title ?? fallback);
  }
}

export function useBuyerCancel(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) =>
      noContent(
        await api.POST("/sub-orders/{id}/cancel", { params: { path: { id } }, body: { reason } }),
        "Could not cancel",
      ),
    onSettled: () => qc.invalidateQueries({ queryKey: ["order", orderId] }),
  });
}

export function useSellerOrders(status: string) {
  return useQuery({
    queryKey: ["seller-orders", status],
    queryFn: async () =>
      unwrap(
        await api.GET("/seller/orders", {
          params: { query: status ? { status: status as SubStatus } : {} },
        }),
      ),
  });
}

export function useSellerOrder(id: string) {
  return useQuery({
    queryKey: ["seller-order", id],
    queryFn: async () => unwrap(await api.GET("/seller/orders/{id}", { params: { path: { id } } })),
  });
}

/** Seller actions on a sub-order; every success refreshes the order and the queue. */
export function useSellerAction(id: string) {
  const qc = useQueryClient();
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["seller-order", id] });
    void qc.invalidateQueries({ queryKey: ["seller-orders"] });
  };
  return {
    pack: useMutation({
      mutationFn: async () =>
        noContent(
          await api.POST("/seller/sub-orders/{id}/pack", { params: { path: { id } } }),
          "Could not mark as packed",
        ),
      onSettled: refresh,
    }),
    ship: useMutation({
      mutationFn: async (weightGrams: number) =>
        unwrap(await api.POST("/seller/sub-orders/{id}/ship", { params: { path: { id } }, body: { weightGrams } })),
      onSettled: refresh,
    }),
    cancel: useMutation({
      mutationFn: async (reason: string) =>
        noContent(
          await api.POST("/seller/sub-orders/{id}/cancel", { params: { path: { id } }, body: { reason } }),
          "Could not cancel",
        ),
      onSettled: refresh,
    }),
  };
}
