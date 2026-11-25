"use client";

import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { rupees } from "@/lib/checkout";
import { statusTone, useSellerOrders } from "@/lib/orders";
import { Alert } from "@/components/ui/Form";
import { StatusChip } from "@/components/ui/StatusChip";

const TABS = ["", "CONFIRMED", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "RTO"] as const;

// UI-SEL-05: the seller's order queue by status.
export function SellerOrders() {
  const t = useTranslations("sellerOrders");
  const ts = useTranslations("orders");
  const format = useFormatter();
  const [tab, setTab] = useState<(typeof TABS)[number]>("CONFIRMED");
  const list = useSellerOrders(tab);
  const counts = list.data?.counts ?? {};

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold sm:text-3xl">{t("title")}</h1>
      <div role="tablist" aria-label={t("filter")} className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((s) => (
          <button
            key={s || "all"}
            role="tab"
            aria-selected={tab === s}
            onClick={() => setTab(s)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
              tab === s ? "border-brand bg-brand-soft text-brand" : "border-line hover:border-brand/40"
            }`}
          >
            {s ? ts(`status.${s}`) : t("all")}
            {s && counts[s] ? <span className="ml-1.5 text-xs text-muted">{counts[s]}</span> : null}
          </button>
        ))}
      </div>
      {list.isPending && <div className="skeleton h-48" />}
      {list.isError && <Alert>{t("loadError")}</Alert>}
      {list.data && list.data.items.length === 0 && <p className="text-muted">{t("empty")}</p>}
      {list.data && list.data.items.length > 0 && (
        <ul className="space-y-3">
          {list.data.items.map((o) => (
            <li key={o.id}>
              <Link
                href={`/seller/orders/${o.id}`}
                className="card flex flex-wrap items-center gap-x-6 gap-y-2 p-4 transition hover:border-brand/40"
              >
                <span className="min-w-40 flex-1">
                  <span className="block font-mono text-sm font-semibold">{o.orderNumber}</span>
                  <span className="block text-xs text-muted">
                    {format.dateTime(new Date(o.placedAt), {
                      day: "numeric",
                      month: "short",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </span>
                <span className="min-w-32 text-sm">
                  <span className="block font-medium">{o.buyerName}</span>
                  <span className="block text-muted">
                    {o.city} {o.pincode}
                  </span>
                </span>
                <span className="text-sm">
                  {t("items", { n: o.itemCount })} · {rupees(o.subtotalPaise)}
                  <span className="block text-xs text-muted">{o.payMethod === "COD" ? t("cod") : t("prepaid")}</span>
                </span>
                <StatusChip tone={statusTone[o.status] ?? "neutral"}>{ts(`status.${o.status}`)}</StatusChip>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
