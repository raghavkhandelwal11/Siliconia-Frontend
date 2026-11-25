"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError, unwrap } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";

export type Cart = components["schemas"]["Cart"];
export type CartLine = components["schemas"]["CartLine"];
export type WishItem = components["schemas"]["WishItem"];

export const cartKey = ["cart"] as const;
export const wishlistKey = ["wishlist"] as const;

/** The cart, or null for accounts that cannot have one (sellers, creators…). */
export function useCart() {
  return useQuery({
    queryKey: cartKey,
    queryFn: async (): Promise<Cart | null> => {
      const res = await api.GET("/cart");
      if (res.response.status === 403) return null;
      return unwrap(res);
    },
    staleTime: 15_000,
  });
}

/** Sets a line's quantity (0 removes it) and stores the returned cart. */
export function useSetQty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ variantId, qty }: { variantId: string; qty: number }) =>
      unwrap(await api.PUT("/cart/items/{variantId}", { params: { path: { variantId } }, body: { qty } })),
    onSuccess: (cart) => qc.setQueryData(cartKey, cart),
  });
}

/** Current quantity of a variant in the cart (0 when absent). */
export function qtyInCart(cart: Cart | null | undefined, variantId: string): number {
  for (const g of cart?.groups ?? []) for (const l of g.lines) if (l.variantId === variantId) return l.qty;
  return 0;
}

export function useWishlist(enabled = true) {
  return useQuery({
    queryKey: wishlistKey,
    queryFn: async () => unwrap(await api.GET("/wishlist")).items,
    enabled,
  });
}

/** Saves or removes a wishlist item. */
export async function setSaved(variantId: string, saved: boolean): Promise<void> {
  const res = saved
    ? await api.PUT("/wishlist/{variantId}", { params: { path: { variantId } } })
    : await api.DELETE("/wishlist/{variantId}", { params: { path: { variantId } } });
  if (!res.response.ok) {
    const e = (res.error ?? {}) as { code?: string; detail?: string; title?: string };
    throw new ApiError(res.response.status, e.code ?? "", e.detail ?? e.title ?? "Could not update the wishlist");
  }
}
