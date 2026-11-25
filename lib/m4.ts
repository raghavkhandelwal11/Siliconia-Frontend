"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiBaseUrl, ApiError, readCookie, unwrap } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";

export type ReviewPage = components["schemas"]["ReviewPage"];
export type CreatorReviews = components["schemas"]["CreatorReviewList"]["items"];
export type Card = components["schemas"]["Card"];
export type CreatorApplication = components["schemas"]["CreatorApplication"];
export type Social = components["schemas"]["Social"];
// Lists the API returns as plain objects (fields as stored).
export type Row = Record<string, unknown>;

/** Fails with the API's problem message for endpoints that return 204. */
export async function ok(res: { response: Response; error?: unknown }, fallback = "That didn't work. Try again.") {
  if (!res.response.ok) {
    const e = (res.error ?? {}) as { code?: string; detail?: string; title?: string };
    throw new ApiError(res.response.status, e.code ?? "", e.detail ?? e.title ?? fallback);
  }
}

export function useReviews(productId: string, sort: "recent" | "helpful", page: number) {
  return useQuery({
    queryKey: ["reviews", productId, sort, page],
    queryFn: async () =>
      unwrap(await api.GET("/products/{id}/reviews", { params: { path: { id: productId }, query: { sort, page } } })),
  });
}

export function useCreatorReviews(productId: string) {
  return useQuery({
    queryKey: ["creator-reviews", productId],
    queryFn: async () =>
      unwrap(await api.GET("/products/{id}/creator-reviews", { params: { path: { id: productId } } })).items,
  });
}

export function usePromoters(productId: string) {
  return useQuery({
    queryKey: ["promoters", productId],
    queryFn: async () =>
      unwrap(await api.GET("/products/{id}/promoters", { params: { path: { id: productId } } })).items as Row[],
  });
}

export function useCards(kind: "week" | "forYou" | "together", productId = "", enabled = true) {
  return useQuery({
    queryKey: ["cards", kind, productId],
    enabled,
    queryFn: async () =>
      unwrap(
        kind === "week"
          ? await api.GET("/home/products-of-week")
          : kind === "forYou"
            ? await api.GET("/home/for-you")
            : await api.GET("/products/{id}/bought-together", { params: { path: { id: productId } } }),
      ).items,
  });
}

/** Uploads a review photo (raw body, like the seller image upload). */
export async function uploadReviewImage(file: File): Promise<{ id: string; url: string }> {
  const csrf = readCookie("sx_csrf");
  const res = await fetch(`${apiBaseUrl()}/uploads/review-images`, {
    method: "POST",
    body: file,
    credentials: "include",
    headers: csrf ? { "X-CSRF-Token": csrf } : {},
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, body.code ?? "", body.detail ?? body.title ?? "Upload failed");
  return body;
}

export function useMyReviewedItems(enabled = true) {
  return useQuery({
    queryKey: ["reviewed-items"],
    enabled,
    queryFn: async () => unwrap(await api.GET("/me/reviewed-items")).items as unknown as string[],
  });
}

export function useWriteReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { itemId: string; rating: number; title: string; body: string; photoIds: string[] }) =>
      unwrap(
        await api.POST("/order-items/{id}/review", {
          params: { path: { id: v.itemId } },
          body: { rating: v.rating, title: v.title, body: v.body, photoIds: v.photoIds },
        }),
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reviewed-items"] }),
  });
}

/** Small action helper: run, then refresh the given query keys. */
export function useAct<T>(fn: (v: T) => Promise<unknown>, refresh: string[][]) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => refresh.forEach((k) => void qc.invalidateQueries({ queryKey: k })),
  });
}

export function useGet<T = Row[]>(key: string[], fn: () => Promise<T>, enabled = true) {
  return useQuery({ queryKey: key, queryFn: fn, enabled });
}

export const m4 = {
  helpful: async (id: string) => ok(await api.POST("/reviews/{id}/helpful", { params: { path: { id } } })),
  report: async (id: string, reason: string) =>
    ok(await api.POST("/reviews/{id}/report", { params: { path: { id } }, body: { reason } })),
  vote: async (id: string, value: -1 | 0 | 1) =>
    ok(await api.POST("/creator-reviews/{id}/vote", { params: { path: { id } }, body: { value } })),
  feedback: async (
    id: string,
    category: "QUALITY" | "FEATURE" | "PACKAGING" | "DOCUMENTATION" | "OTHER",
    body: string,
  ) => ok(await api.POST("/products/{id}/feedback", { params: { path: { id } }, body: { category, body } })),
  creator: async () => unwrap(await api.GET("/creator/application")),
  saveCreator: async (b: { niche: string; bio: string; socials: Social[] }) =>
    unwrap(await api.PUT("/creator/application", { body: b })),
  submitCreator: async () => unwrap(await api.POST("/creator/application/submit", { body: { acceptTerms: true } })),
  kyc: async (b: { pan: string; account: string; ifsc: string }) => unwrap(await api.POST("/creator/kyc", { body: b })),
  demos: async () => unwrap(await api.GET("/creator/demo-requests")).items as Row[],
  requestDemo: async (productId: string, note: string) =>
    unwrap(await api.POST("/creator/demo-requests", { body: { productId, note } })),
  postReview: async (b: { productId: string; rating: number; body: string; videos: string[] }) =>
    unwrap(await api.POST("/creator/reviews", { body: b })),
  myReviews: async () => unwrap(await api.GET("/creator/reviews")).items as Row[],
  earnings: async () => unwrap(await api.GET("/creator/earnings")).items as Row[],
  cashouts: async () => unwrap(await api.GET("/creator/cashouts")).items as Row[],
  cashout: async (electrons: number) => unwrap(await api.POST("/creator/cashouts", { body: { electrons } })),
  cancelCashout: async (id: string) => ok(await api.DELETE("/creator/cashouts/{id}", { params: { path: { id } } })),
  savePromoter: async (b: { type: "INDIVIDUAL" | "COMPANY"; displayName: string }) =>
    ok(await api.PUT("/promoter/application", { body: b })),
  promoter: async () => unwrap(await api.GET("/promoter/dashboard")) as Row,
  invest: async (sellerId: string, proof: string) =>
    ok(await api.POST("/promoter/investments", { body: { sellerId, proof } })),
  promote: async (id: string, on: boolean) =>
    ok(
      on
        ? await api.PUT("/promoter/products/{id}/promotion", { params: { path: { id } } })
        : await api.DELETE("/promoter/products/{id}/promotion", { params: { path: { id } } }),
    ),
  sellerDemos: async () => unwrap(await api.GET("/seller/demo-requests")).items as Row[],
  decideDemo: async (id: string, approve: boolean, reason = "") =>
    ok(await api.POST("/seller/demo-requests/{id}/decision", { params: { path: { id } }, body: { approve, reason } })),
  sellerPromoters: async () => unwrap(await api.GET("/seller/promoters")).items as Row[],
  confirmPromoter: async (id: string, confirm: boolean) =>
    ok(await api.POST("/seller/promoters/{id}/confirm", { params: { path: { id } }, body: { confirm } })),
  reward: async (id: string, electronsPerUnit: number) =>
    ok(
      await api.PUT("/seller/products/{id}/promoter-reward", { params: { path: { id } }, body: { electronsPerUnit } }),
    ),
  sellerFeedback: async () => unwrap(await api.GET("/seller/feedback")).items as Row[],
  replyFeedback: async (id: string, reply: string) =>
    ok(await api.POST("/seller/feedback/{id}/reply", { params: { path: { id } }, body: { reply } })),
  queue: async (role: "creators" | "promoters") =>
    unwrap(await api.GET("/admin/approvals/{role}", { params: { path: { role } } })).items as Row[],
  decide: async (role: "creators" | "promoters", id: string, approve: boolean, reason = "") =>
    ok(
      await api.POST("/admin/approvals/{role}/{id}/decision", {
        params: { path: { role, id } },
        body: { approve, reason },
      }),
    ),
  reported: async () => unwrap(await api.GET("/admin/reviews/reported")).items as Row[],
  moderate: async (id: string, publish: boolean) =>
    ok(await api.POST("/admin/reviews/{id}/moderate", { params: { path: { id } }, body: { publish } })),
  pools: async () => unwrap(await api.GET("/admin/reward-pools")).items as Row[],
  setPool: async (productId: string, period: string, size: number) =>
    unwrap(await api.PUT("/admin/reward-pools", { body: { productId, period, size } })),
};
