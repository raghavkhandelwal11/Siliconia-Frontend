"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useCart } from "@/lib/cart";
import { Icon } from "@/components/ui/Icon";

// Header cart link with the number of items (UI-GLB-01).
export function CartButton() {
  const t = useTranslations("shell");
  const cart = useCart();
  const n = cart.data?.itemCount ?? 0;
  return (
    <Link
      href="/cart"
      className="relative inline-flex size-10 items-center justify-center rounded-full text-muted transition hover:bg-bg hover:text-ink"
      aria-label={n > 0 ? t("cartCount", { n }) : t("cart")}
    >
      <Icon name="cart" />
      {n > 0 && (
        <span
          key={n}
          className="bg-brand-gradient pop absolute -right-0.5 -top-0.5 min-w-5 rounded-full px-1 text-center text-[11px] font-bold leading-5 text-white"
        >
          {n > 99 ? "99+" : n}
        </span>
      )}
    </Link>
  );
}
