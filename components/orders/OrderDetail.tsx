"use client";

import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import type { CSSProperties } from "react";
import { ApiError } from "@/lib/api/client";
import { oneLine, rupees, useOrder } from "@/lib/checkout";
import { invoiceUrl, statusTone, useBuyerCancel } from "@/lib/orders";
import { Alert, buttonClass } from "@/components/ui/Form";
import { Icon } from "@/components/ui/Icon";
import { StatusChip } from "@/components/ui/StatusChip";
import { Tracking } from "@/components/shipping/Tracking";
import { ReturnForm } from "@/components/support/ReturnForm";
import { ReasonForm } from "./ReasonForm";
import { Timeline } from "./Timeline";

// UI-BUY-05: one order with each seller's part, tracking, history, cancel and invoice.
export function OrderDetail({ id }: { id: string }) {
  const t = useTranslations("orders");
  const tr = useTranslations("returns");
  const format = useFormatter();
  const order = useOrder(id);
  const cancel = useBuyerCancel(id);

  if (order.isPending) return <div className="skeleton h-96" />;
  if (order.isError || !order.data) return <Alert>{t("loadErrorOne")}</Alert>;
  const o = order.data;
  if (o.status === "PENDING_PAYMENT" || o.status === "EXPIRED") {
    return (
      <div className="card p-8 text-center">
        <p className="text-muted">{t("notPlaced")}</p>
        <Link href={`/checkout/result?order=${o.id}`} className={buttonClass("primary", "mt-4")}>
          {t("seePayment")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/account/orders" className="text-sm font-medium text-brand">
            ← {t("title")}
          </Link>
          <h1 className="mt-1 text-2xl font-bold">
            {t("order")} <span className="font-mono">{o.number}</span>
          </h1>
          <p className="text-sm text-muted">
            {t("placedOn", { date: format.dateTime(new Date(o.placedAt), { dateStyle: "medium" }) })} ·{" "}
            {o.payMethod === "COD" ? t("payCod") : t("payOnline")}
          </p>
        </div>
        <p className="text-right">
          <span className="block text-xs text-muted">{t("total")}</span>
          <span className="text-xl font-bold">{rupees(o.payablePaise)}</span>
        </p>
      </div>
      {cancel.isError && <Alert>{cancel.error instanceof ApiError ? cancel.error.message : t("cancelError")}</Alert>}
      {cancel.isSuccess && (
        <Alert tone="info">{o.payMethod === "COD" ? t("cancelledCod") : t("cancelledRefund")}</Alert>
      )}

      {o.subOrders.map((s, i) => (
        <section key={s.id} className="card rise space-y-4 p-5" style={{ "--d": `${i * 60}ms` } as CSSProperties}>
          <header className="flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-2 font-semibold">
              <Icon name="store" size={16} className="text-brand" />
              {t("soldBy", { store: s.storeName })}
              {s.isReplacement && (
                <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs text-brand">{t("replacement")}</span>
              )}
            </p>
            <StatusChip tone={statusTone[s.status] ?? "neutral"}>{t(`status.${s.status}`)}</StatusChip>
          </header>

          <Tracking status={s.status} shipment={s.shipment} />
          {s.status === "CANCELLED" && s.cancelReason && (
            <p className="text-sm text-muted">
              {t(`cancelledBy.${s.cancelledBy ?? "BUYER"}`)}: {s.cancelReason}
            </p>
          )}

          <ul className="divide-y divide-line rounded-xl border border-line">
            {s.items.map((it) => (
              <li key={it.id} className="flex flex-wrap items-center gap-3 p-3">
                <span className="block size-14 shrink-0 overflow-hidden rounded-lg bg-bg">
                  {it.coverUrl && (
                    // eslint-disable-next-line @next/next/no-img-element -- sized by the API
                    <img src={it.coverUrl} alt="" className="size-full object-cover" />
                  )}
                </span>
                <span className="min-w-0 flex-1 text-sm">
                  <Link href={`/p/${it.slug}`} className="line-clamp-1 font-medium hover:text-brand">
                    {it.name}
                  </Link>
                  <span className="block text-muted">
                    {Object.values(it.attrs).join(" · ")} × {it.qty}
                  </span>
                </span>
                <span className="text-right text-sm">
                  <span className="block font-semibold">{s.isReplacement ? t("free") : rupees(it.lineTotalPaise)}</span>
                  {it.return && (
                    <Link href="/account/returns" className="block text-xs text-brand">
                      {tr(`type.${it.return.type}`)}: {tr(`status.${it.return.status}`)}
                    </Link>
                  )}
                </span>
                {it.canReturn && (
                  <span className="basis-full">
                    <ReturnForm orderId={o.id} itemId={it.id} windowEnds={s.returnWindowEndsAt} />
                  </span>
                )}
              </li>
            ))}
          </ul>

          <details>
            <summary className="cursor-pointer text-sm font-medium text-brand">{t("history")}</summary>
            <div className="mt-3">
              <Timeline events={s.events} />
            </div>
          </details>

          <div className="flex flex-wrap items-center gap-2">
            {s.hasInvoice && (
              <a
                href={invoiceUrl(s.id)}
                target="_blank"
                rel="noopener"
                className={buttonClass("secondary", "min-h-9 px-4")}
              >
                {t("invoice")}
              </a>
            )}
            {s.canCancel && (
              <ReasonForm
                label={o.subOrders.length > 1 ? t("cancelPart") : t("cancel")}
                confirm={t("confirmCancel")}
                busy={cancel.isPending}
                suggestions={[t("reasons.mistake"), t("reasons.cheaper"), t("reasons.late"), t("reasons.changed")]}
                onSubmit={(reason) => cancel.mutate({ id: s.id, reason })}
              />
            )}
          </div>
        </section>
      ))}

      <section className="card flex flex-wrap items-center justify-between gap-3 p-5 text-sm">
        <span>{t("helpPrompt")}</span>
        <Link href={`/account/issues/new?order=${o.id}`} className={buttonClass("secondary", "min-h-9 px-4")}>
          {t("getHelp")}
        </Link>
      </section>

      <section className="card space-y-1 p-5 text-sm">
        <h2 className="font-semibold">{t("deliverTo")}</h2>
        <p>{o.address.name}</p>
        <p className="text-muted">{oneLine(o.address)}</p>
        <p className="text-muted">+91 {o.address.phone}</p>
      </section>
    </div>
  );
}
