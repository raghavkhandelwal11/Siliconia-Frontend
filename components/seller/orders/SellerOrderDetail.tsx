"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ApiError } from "@/lib/api/client";
import { oneLine, rupees } from "@/lib/checkout";
import { invoiceUrl, labelUrl, statusTone, useSellerAction, useSellerOrder } from "@/lib/orders";
import { Alert, Button, buttonClass, Card } from "@/components/ui/Form";
import { StatusChip } from "@/components/ui/StatusChip";
import { ReasonForm } from "@/components/orders/ReasonForm";
import { Timeline } from "@/components/orders/Timeline";

// UI-SEL-05: pack, ship (courier label), invoice and cancel one sub-order.
export function SellerOrderDetail({ id }: { id: string }) {
  const t = useTranslations("sellerOrders");
  const ts = useTranslations("orders");
  const order = useSellerOrder(id);
  const act = useSellerAction(id);
  const [weight, setWeight] = useState("500");

  if (order.isPending) return <div className="skeleton h-96" />;
  if (order.isError || !order.data) return <Alert>{t("loadErrorOne")}</Alert>;
  const o = order.data;
  const failed = [act.pack, act.ship, act.cancel].find((m) => m.isError)?.error;
  const shipped = Boolean(o.awb);
  const grams = Number(weight);

  return (
    <div className="space-y-5">
      <div>
        <Link href="/seller/orders" className="text-sm font-medium text-brand">
          ← {t("title")}
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="font-mono text-2xl font-bold">{o.orderNumber}</h1>
          <StatusChip tone={statusTone[o.status] ?? "neutral"}>{ts(`status.${o.status}`)}</StatusChip>
        </div>
        <p className="text-sm text-muted">
          {rupees(o.subtotalPaise)} ·{" "}
          {o.payMethod === "COD" ? t("collectCod", { amount: rupees(o.subtotalPaise) }) : t("prepaid")}
        </p>
      </div>
      {failed && <Alert>{failed instanceof ApiError ? failed.message : t("actionError")}</Alert>}

      <div className="grid items-start gap-5 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-5">
          <Card>
            <h2 className="mb-3 font-semibold">{t("itemsTitle")}</h2>
            <ul className="divide-y divide-line">
              {o.items.map((it) => (
                <li key={it.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span>
                    <span className="font-medium">{it.name}</span>
                    <span className="block text-muted">
                      {Object.values(it.attrs).join(" · ")} × {it.qty}
                    </span>
                  </span>
                  <span className="font-semibold">{rupees(it.lineTotalPaise)}</span>
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <h2 className="mb-3 font-semibold">{ts("history")}</h2>
            <Timeline events={o.events} />
          </Card>
        </div>

        <aside className="space-y-5">
          <Card>
            <h2 className="mb-2 font-semibold">{t("shipTo")}</h2>
            <p className="text-sm">{o.address.name}</p>
            <p className="text-sm text-muted">{oneLine(o.address)}</p>
            <p className="text-sm text-muted">+91 {o.address.phone}</p>
          </Card>
          <Card className="space-y-3">
            <h2 className="font-semibold">{t("actions")}</h2>
            {o.canPack && (
              <Button
                className="w-full"
                variant="secondary"
                disabled={act.pack.isPending}
                onClick={() => act.pack.mutate()}
              >
                {t("markPacked")}
              </Button>
            )}
            {o.canShip && (
              <form
                className="space-y-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  act.ship.mutate(grams);
                }}
              >
                <label className="block text-sm font-medium" htmlFor="ship-weight">
                  {t("weight")}
                </label>
                <input
                  id="ship-weight"
                  inputMode="numeric"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value.replace(/\D/g, "").slice(0, 5))}
                  className="min-h-11 w-full rounded-xl border border-line bg-surface px-3"
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={act.ship.isPending || !(grams > 0 && grams <= 50000)}
                >
                  {act.ship.isPending ? t("booking") : t("ship")}
                </Button>
                <p className="text-xs text-muted">{t("shipHint")}</p>
              </form>
            )}
            {shipped && (
              <p className="text-sm">
                {t("awb", { awb: o.awb ?? "" })}
                <span className="block text-xs text-muted">
                  {o.shipmentStatus && ts(`scanStatus.${o.shipmentStatus}`)}
                </span>
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {shipped && (
                <a
                  href={labelUrl(o.id)}
                  target="_blank"
                  rel="noopener"
                  className={buttonClass("secondary", "min-h-9 px-4")}
                >
                  {t("label")}
                </a>
              )}
              {shipped && (
                <a
                  href={invoiceUrl(o.id)}
                  target="_blank"
                  rel="noopener"
                  className={buttonClass("secondary", "min-h-9 px-4")}
                >
                  {ts("invoice")}
                </a>
              )}
            </div>
            {o.canCancel && (
              <ReasonForm
                label={t("cancel")}
                confirm={t("confirmCancel")}
                busy={act.cancel.isPending}
                suggestions={[t("reasons.stock"), t("reasons.damaged"), t("reasons.address")]}
                onSubmit={(reason) => act.cancel.mutate(reason)}
              />
            )}
            {o.status === "CANCELLED" && o.cancelReason && (
              <p className="text-sm text-muted">{t("cancelled", { reason: o.cancelReason })}</p>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}
