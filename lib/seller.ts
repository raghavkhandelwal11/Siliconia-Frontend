"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";

export type SellerApplication = components["schemas"]["SellerApplication"];
export type SellerReview = components["schemas"]["SellerReview"];
export type SellerQueueItem = components["schemas"]["SellerQueueItem"];
export type BusinessType = components["schemas"]["BusinessType"];
export type Address = components["schemas"]["Address"];
export type KycCheck = components["schemas"]["KycCheck"];

export const BUSINESS_TYPES: BusinessType[] = [
  "INDIVIDUAL",
  "PROPRIETORSHIP",
  "PARTNERSHIP",
  "LLP",
  "PRIVATE_LIMITED",
  "PUBLIC_LIMITED",
];

export const applicationKey = ["seller-application"] as const;

export function useSellerApplication() {
  return useQuery({
    queryKey: applicationKey,
    queryFn: async () => unwrap(await api.GET("/seller/application")),
  });
}

/** Stores a fresh application returned by any write. */
export function useSetApplication() {
  const qc = useQueryClient();
  return (app: SellerApplication) => qc.setQueryData(applicationKey, app);
}
