"use client";

import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { ApiError } from "@/lib/api/client";
import { returnTone, useDecideReturn, useSellerReturns } from "@/lib/support";
import { Alert, Button } from "@/components/ui/Form";
import { StatusChip } from "@/components/ui/StatusChip";
import { ReasonForm } from "@/components/orders/ReasonForm";

/** Returns for the seller's items, with approve or reject (UI-SEL-06). */
export function SellerReturns() {
  const t = useTranslations("returns");
  const format = useFormatter();
  const [tab, setTab] = useState<"REQUESTED" | "">("REQUESTED");
  const list = useSellerReturns(tab);
  const decide = useDecideReturn();

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold sm:text-3xl">{t("sellerTitle")}</h1>
      <div role="tablist" aria-label={t("filter")} className="flex gap-2">
        {(["REQUESTED", ""] as const).map((s) => (
          <button
            key={s || "all"}
            role="tab"
            aria-selected={tab === s}
            onClick={() => setTab(s)}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium ${tab === s ? "border-brand bg-brand-soft text-brand" : "border-line"}`}
          >
            {s ? t("toDecide") : t("all")}
          </button>
        ))}
      </div>
      {decide.isError && <Alert>{decide.error instanceof ApiError ? decide.error.message : t("error")}</Alert>}
      {list.isPending && <div className="skeleton h-40" />}
      {list.isError && <Alert>{t("loadError")}</Alert>}
      {list.data?.length === 0 && <p className="text-muted">{t("sellerEmpty")}</p>}
      <ul className="space-y-3">
        {list.data?.map((r) => (
          <li key={r.id} className="card space-y-2 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm">
                <span className="font-mono font-semibold">{r.number}</span>
                <span className="text-muted">
                  {" "}
                  · {t(`type.${r.type}`)} · {format.dateTime(new Date(r.createdAt), { day: "numeric", month: "short" })}
                </span>
              </p>
              <StatusChip tone={returnTone[r.status] ?? "neutral"}>{t(`status.${r.status}`)}</StatusChip>
            </div>
            <p className="font-medium">
              {r.productName} × {r.qty}{" "}
              <Link href="/seller/orders" className="text-sm font-normal text-brand">
                {r.orderNumber}
              </Link>
            </p>
            <p className="text-sm">
              {t(`reasons.${r.reason}`)}
              {r.note && <span className="text-muted"> — “{r.note}”</span>}
            </p>
            {r.status === "REQUESTED" && (
              <div className="flex flex-wrap items-start gap-2">
                <Button
                  className="min-h-9 px-4"
                  disabled={decide.isPending}
                  onClick={() => decide.mutate({ id: r.id, approve: true })}
                >
                  {t("approve")}
                </Button>
                <ReasonForm
                  label={t("reject")}
                  prompt={t("rejectPrompt")}
                  confirm={t("reject")}
                  busy={decide.isPending}
                  onSubmit={(reason) => decide.mutate({ id: r.id, approve: false, reason })}
                />
              </div>
            )}
            {r.pickupAwb && <p className="text-xs text-muted">{t("pickupAwb", { awb: r.pickupAwb })}</p>}
            {r.outcomeNote && <p className="text-xs text-muted">{r.outcomeNote}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
