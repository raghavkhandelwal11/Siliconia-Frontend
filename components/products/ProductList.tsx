"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { ApiError } from "@/lib/api/client";
import { formatPaise, useSellerProducts } from "@/lib/products";
import { Alert, buttonClass } from "@/components/ui/Form";
import { Icon } from "@/components/ui/Icon";
import { ProductStatus } from "./ProductStatus";

// UI-SEL-03: the seller's products as cards.
export function ProductList() {
  const t = useTranslations("products");
  const list = useSellerProducts();

  if (list.error instanceof ApiError && list.error.code === "SELLER_NOT_APPROVED") {
    return (
      <div className="card rise space-y-3 p-8 text-center">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted">{t("notApproved")}</p>
        <Link href="/seller/onboarding" className={buttonClass("primary")}>
          {t("toApplication")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">{t("title")}</h1>
          <p className="text-muted">{t("subtitle")}</p>
        </div>
        <Link href="/seller/products/new" className={buttonClass("primary")}>
          <Icon name="sparkle" size={18} />
          {t("add")}
        </Link>
      </div>

      {list.isPending && (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label={t("loading")}>
          {[0, 1, 2].map((i) => (
            <li key={i} className="card overflow-hidden">
              <div className="skeleton aspect-[4/3] rounded-none" />
              <div className="space-y-2 p-4">
                <div className="skeleton h-5 w-3/4" />
                <div className="skeleton h-4 w-1/2" />
              </div>
            </li>
          ))}
        </ul>
      )}
      {list.isError && !(list.error instanceof ApiError && list.error.code === "SELLER_NOT_APPROVED") && (
        <Alert>{t("loadError")}</Alert>
      )}
      {list.data?.length === 0 && (
        <div className="card rise flex flex-col items-center gap-3 p-10 text-center">
          <span className="icon-tile size-14" style={{ "--hue": 248 } as CSSProperties}>
            <Icon name="store" size={28} />
          </span>
          <h2 className="text-lg font-semibold">{t("emptyTitle")}</h2>
          <p className="max-w-sm text-muted">{t("emptyBody")}</p>
          <Link href="/seller/products/new" className={buttonClass("primary")}>
            {t("add")}
          </Link>
        </div>
      )}
      {list.data && list.data.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.data.map((p, i) => (
            <li key={p.id} className="rise" style={{ "--d": `${i * 40}ms` } as CSSProperties}>
              <Link href={`/seller/products/${p.id}`} className="card card-hover group block overflow-hidden">
                <div className="relative aspect-[4/3] overflow-hidden bg-bg">
                  {p.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- images are already sized by the API
                    <img
                      src={p.coverUrl}
                      alt=""
                      className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center text-muted">
                      <Icon name="camera" size={36} />
                    </div>
                  )}
                  <span className="absolute left-3 top-3">
                    <ProductStatus status={p.status} />
                  </span>
                </div>
                <div className="p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">{p.categoryName}</p>
                  <h2 className="mt-1 line-clamp-2 font-semibold group-hover:text-brand">{p.name}</h2>
                  <p className="mt-2 font-bold">
                    {p.variantCount === 0
                      ? t("noPrice")
                      : p.minPricePaise === p.maxPricePaise
                        ? formatPaise(p.minPricePaise)
                        : `${formatPaise(p.minPricePaise)} – ${formatPaise(p.maxPricePaise)}`}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {t("stockLine", { available: p.available, variants: p.variantCount })}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
