"use client";

import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import { rupees } from "@/lib/checkout";
import { returnTone, useMyReturns } from "@/lib/support";
import { Alert } from "@/components/ui/Form";
import { StatusChip } from "@/components/ui/StatusChip";

/** The buyer's returns and replacements (/account/returns). */
export function ReturnsPage() {
  const t = useTranslations("returns");
  const format = useFormatter();
  const list = useMyReturns();
  if (list.isPending) return <div className="skeleton h-48" />;
  if (list.isError) return <Alert>{t("loadError")}</Alert>;
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold sm:text-3xl">{t("title")}</h1>
      {list.data.length === 0 && <p className="text-muted">{t("empty")}</p>}
      <ul className="space-y-3">
        {list.data.map((r) => (
          <li key={r.id} className="card space-y-2 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm">
                <span className="font-mono font-semibold">{r.number}</span>
                <span className="text-muted"> · {t(`type.${r.type}`)} · </span>
                <Link href={`/account/orders/${r.orderId}`} className="text-brand">
                  {r.orderNumber}
                </Link>
              </p>
              <StatusChip tone={returnTone[r.status] ?? "neutral"}>{t(`status.${r.status}`)}</StatusChip>
            </div>
            <p className="font-medium">
              {r.productName} × {r.qty}
            </p>
            <p className="text-sm text-muted">
              {t(`reasons.${r.reason}`)} · {format.dateTime(new Date(r.createdAt), { dateStyle: "medium" })}
            </p>
            {r.rejectReason && <p className="text-sm">{t("rejected", { reason: r.rejectReason })}</p>}
            {r.pickupAwb && r.status !== "REFUNDED" && (
              <p className="text-sm text-muted">{t("pickupAwb", { awb: r.pickupAwb })}</p>
            )}
            {r.refundAmountPaise > 0 && (r.status === "REFUNDED" || r.status === "REFUND_PENDING") && (
              <p className="text-sm font-semibold text-success">
                {t("refundAmount", { amount: rupees(r.refundAmountPaise) })}
              </p>
            )}
            {r.outcomeNote && <p className="text-sm text-muted">{r.outcomeNote}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
