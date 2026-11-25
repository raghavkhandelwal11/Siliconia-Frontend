"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError, unwrap } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";
import type { StatusTone } from "@/components/ui/StatusChip";

export type Return = components["schemas"]["Return"];
export type Issue = components["schemas"]["Issue"];
export type ReturnReason =
  "DAMAGED" | "DEFECTIVE" | "WRONG_ITEM" | "NOT_AS_DESCRIBED" | "MISSING_PARTS" | "NO_LONGER_NEEDED";
export type IssueType =
  "NOT_DELIVERED" | "DAMAGED" | "WRONG_ITEM" | "MISSING_PARTS" | "PAYMENT" | "RETURN_REFUND" | "OTHER";
export type SupportStatus = "IN_PROGRESS" | "WAITING_CUSTOMER" | "RESOLVED";

export const RETURN_REASONS: ReturnReason[] = [
  "DAMAGED",
  "DEFECTIVE",
  "WRONG_ITEM",
  "NOT_AS_DESCRIBED",
  "MISSING_PARTS",
  "NO_LONGER_NEEDED",
];
export const ISSUE_TYPES: IssueType[] = [
  "NOT_DELIVERED",
  "DAMAGED",
  "WRONG_ITEM",
  "MISSING_PARTS",
  "PAYMENT",
  "RETURN_REFUND",
  "OTHER",
];

export const returnTone: Record<string, StatusTone> = {
  REQUESTED: "warning",
  REJECTED: "danger",
  PICKUP_SCHEDULED: "info",
  PICKED_UP: "info",
  RECEIVED: "info",
  REFUNDED: "success",
  REFUND_PENDING: "warning",
  REPLACEMENT_SHIPPED: "success",
};

export const issueTone: Record<string, StatusTone> = {
  OPEN: "warning",
  IN_PROGRESS: "info",
  WAITING_CUSTOMER: "warning",
  RESOLVED: "success",
  CLOSED: "neutral",
};

async function noContent(res: { response: Response; error?: unknown }, fallback: string) {
  if (!res.response.ok) {
    const e = (res.error ?? {}) as { code?: string; detail?: string; title?: string };
    throw new ApiError(res.response.status, e.code ?? "", e.detail ?? e.title ?? fallback);
  }
}

export function useRequestReturn(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { itemId: string; type: "RETURN" | "REPLACE"; reason: ReturnReason; note: string }) =>
      unwrap(
        await api.POST("/order-items/{id}/returns", {
          params: { path: { id: v.itemId } },
          body: { type: v.type, reason: v.reason, note: v.note },
        }),
      ),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["order", orderId] });
      void qc.invalidateQueries({ queryKey: ["returns"] });
    },
  });
}

export function useMyReturns() {
  return useQuery({ queryKey: ["returns"], queryFn: async () => unwrap(await api.GET("/returns")).items });
}

export function useSellerReturns(status: string) {
  return useQuery({
    queryKey: ["seller-returns", status],
    queryFn: async () =>
      unwrap(await api.GET("/seller/returns", { params: { query: status ? { status } : {} } })).items,
  });
}

export function useDecideReturn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { id: string; approve: boolean; reason?: string }) =>
      noContent(
        await api.POST("/seller/returns/{id}/decision", {
          params: { path: { id: v.id } },
          body: { approve: v.approve, reason: v.reason },
        }),
        "Could not save the decision",
      ),
    onSettled: () => qc.invalidateQueries({ queryKey: ["seller-returns"] }),
  });
}

export function useMyIssues() {
  return useQuery({ queryKey: ["issues"], queryFn: async () => unwrap(await api.GET("/issues")).items });
}

export function useRaiseIssue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { orderId: string; orderItemId?: string; type: IssueType; body: string }) =>
      unwrap(await api.POST("/issues", { body: v })),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["issues"] }),
  });
}

/** One issue for the buyer or for support; polls so replies appear. */
export function useIssue(id: string, support = false) {
  return useQuery({
    queryKey: ["issue", id, support],
    queryFn: async () =>
      support
        ? unwrap(await api.GET("/admin/issues/{id}", { params: { path: { id } } }))
        : unwrap(await api.GET("/issues/{id}", { params: { path: { id } } })),
    refetchInterval: (q) => (q.state.data?.status === "CLOSED" ? false : 15_000),
  });
}

export function useIssueReply(id: string, support = false) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { body: string; status?: SupportStatus }) =>
      support
        ? unwrap(await api.POST("/admin/issues/{id}/messages", { params: { path: { id } }, body: v }))
        : unwrap(await api.POST("/issues/{id}/messages", { params: { path: { id } }, body: { body: v.body } })),
    onSuccess: (is) => {
      qc.setQueryData(["issue", id, support], is);
      void qc.invalidateQueries({ queryKey: support ? ["support-issues"] : ["issues"] });
    },
  });
}

export function useReopenIssue(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => unwrap(await api.POST("/issues/{id}/reopen", { params: { path: { id } } })),
    onSuccess: (is) => qc.setQueryData(["issue", id, false], is),
  });
}

export function useSupportIssues(status: string) {
  return useQuery({
    queryKey: ["support-issues", status],
    queryFn: async () => unwrap(await api.GET("/admin/issues", { params: { query: status ? { status } : {} } })).items,
  });
}
