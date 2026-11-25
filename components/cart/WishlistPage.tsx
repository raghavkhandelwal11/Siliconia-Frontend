"use client";

import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import type { CSSProperties } from "react";
import { setSaved, useSetQty, useWishlist, wishlistKey } from "@/lib/cart";
import { Alert, Button, buttonClass } from "@/components/ui/Form";
import { Icon } from "@/components/ui/Icon";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const rupees = (p: number) => inr.format(Math.round(p / 100));

// UI-BUY-10: saved products with price drops and stock.
export function WishlistPage() {
  const t = useTranslations("wishlist");
  const list = useWishlist();
  const qc = useQueryClient();
  const add = useSetQty();

  if (list.isPending) return <div className="skeleton h-64" />;
  if (list.isError) return <Alert>{t("loadError")}</Alert>;
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold sm:text-3xl">{t("title")}</h1>
      {add.isSuccess && <Alert tone="info">{t("added")}</Alert>}
      {list.data.length === 0 ? (
        <div className="card rise flex flex-col items-center gap-3 p-10 text-center">
          <span className="icon-tile size-14" style={{ "--hue": 330 } as CSSProperties}>
            <Icon name="heart" size={26} />
          </span>
          <p className="text-muted">{t("empty")}</p>
          <Link href="/categories" className={buttonClass("primary")}>
            {t("browse")}
          </Link>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.data.map((w, i) => (
            <li
              key={w.variantId}
              className="card card-hover rise flex gap-3 p-3"
              style={{ "--d": `${i * 40}ms` } as CSSProperties}
            >
              <Link href={`/p/${w.slug}`} className="block size-24 shrink-0 overflow-hidden rounded-xl bg-bg">
                {w.coverUrl && (
                  // eslint-disable-next-line @next/next/no-img-element -- sized by the API
                  <img src={w.coverUrl} alt="" className="size-full object-cover" />
                )}
              </Link>
              <div className="min-w-0 flex-1 space-y-1">
                <Link href={`/p/${w.slug}`} className="line-clamp-2 text-sm font-semibold hover:text-brand">
                  {w.name}
                </Link>
                <p className="font-bold">{rupees(w.pricePaise)}</p>
                {w.priceDropped && (
                  <p className="text-xs font-semibold text-success">
                    {t("dropped", { amount: rupees(w.priceAtAddPaise - w.pricePaise) })}
                  </p>
                )}
                {!w.inStock && <p className="text-xs font-semibold text-danger">{t("outOfStock")}</p>}
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    className="min-h-9 px-3 text-xs"
                    disabled={!w.inStock || !w.buyable || add.isPending}
                    onClick={() => add.mutate({ variantId: w.variantId, qty: 1 })}
                  >
                    {t("addToCart")}
                  </Button>
                  <button
                    type="button"
                    className="text-xs font-medium text-muted hover:text-danger"
                    onClick={async () => {
                      await setSaved(w.variantId, false);
                      void qc.invalidateQueries({ queryKey: wishlistKey });
                    }}
                  >
                    {t("remove")}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
