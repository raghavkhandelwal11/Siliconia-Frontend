"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError, unwrap } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";
import { cartKey } from "@/lib/cart";

export type Address = components["schemas"]["DeliveryAddress"];
export type AddressInput = components["schemas"]["AddressInput"];
export type Quote = components["schemas"]["Quote"];
export type Order = components["schemas"]["Order"];
export type OrderSummary = components["schemas"]["OrderSummary"];
export type PayMethod = "ONLINE" | "COD";

export const addressesKey = ["addresses"] as const;
export const orderKey = (id: string) => ["order", id] as const;

export function useAddresses() {
  return useQuery({
    queryKey: addressesKey,
    queryFn: async () => unwrap(await api.GET("/me/addresses")),
  });
}

/** Creates (no id) or updates an address and refreshes the list. */
export function useSaveAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id?: string; input: AddressInput }) =>
      id
        ? unwrap(await api.PUT("/me/addresses/{id}", { params: { path: { id } }, body: input }))
        : unwrap(await api.POST("/me/addresses", { body: input })),
    onSuccess: () => qc.invalidateQueries({ queryKey: addressesKey }),
  });
}

export function useDeleteAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.DELETE("/me/addresses/{id}", { params: { path: { id } } });
      if (!res.response.ok) throw new ApiError(res.response.status, "", "Could not delete the address");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: addressesKey }),
  });
}

export function useQuote(addressId: string | undefined, payMethod: PayMethod) {
  return useQuery({
    queryKey: ["quote", addressId ?? "", payMethod],
    queryFn: async () => unwrap(await api.POST("/checkout/quote", { body: { addressId, payMethod } })),
    staleTime: 0,
  });
}

/** A fresh key per checkout attempt; retries of the same attempt reuse it. */
export function newIdempotencyKey(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function usePlaceOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { key: string; addressId: string; payMethod: PayMethod; quoteHash: string }) =>
      unwrap(
        await api.POST("/orders", {
          params: { header: { "Idempotency-Key": v.key } },
          body: { addressId: v.addressId, payMethod: v.payMethod, quoteHash: v.quoteHash },
        }),
      ),
    onSuccess: (order) => {
      qc.setQueryData(orderKey(order.id), order);
      void qc.invalidateQueries({ queryKey: cartKey });
    },
  });
}

/** The order; polls every 2 s while it waits for payment. */
export function useOrder(id: string) {
  return useQuery({
    queryKey: orderKey(id),
    queryFn: async () => unwrap(await api.GET("/orders/{id}", { params: { path: { id } } })),
    enabled: id !== "",
    // Fast while waiting for payment; slower while a parcel is on its way.
    refetchInterval: (q) => {
      const o = q.state.data;
      if (o?.status === "PENDING_PAYMENT") return 2000;
      return o?.subOrders.some((s) => s.status === "SHIPPED" || s.status === "OUT_FOR_DELIVERY") ? 15_000 : false;
    },
  });
}

export async function restartPayment(id: string): Promise<string> {
  return unwrap(await api.POST("/orders/{id}/pay", { params: { path: { id } } })).checkoutUrl;
}

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
export const rupees = (p: number) => inr.format(Math.round(p / 100));

export function oneLine(a: Address): string {
  return [a.line1, a.line2, a.city, `${a.state} ${a.pincode}`].filter(Boolean).join(", ");
}

/** Full-page navigation to the payment page (an object so tests can replace it). */
export const browser = {
  go(url: string) {
    window.location.assign(url);
  },
};
