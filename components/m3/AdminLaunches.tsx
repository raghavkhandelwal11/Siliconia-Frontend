"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { ApiError } from "@/lib/api/client";
import { rupees } from "@/lib/checkout";
import { previewLaunch, useAdminLaunch, useLaunches, type LaunchDraft, type LaunchPreview } from "@/lib/m3";
import { Alert, Button, Card, Field } from "@/components/ui/Form";

// /admin/launches: deal-unit calculator, create, schedule and cancel (UI-ADM-04).
export function AdminLaunches() {
  const t = useTranslations("adminLaunch");
  const format = useFormatter();
  const list = useLaunches(true);
  const act = useAdminLaunch();
  const [f, setF] = useState({
    productId: "",
    variantId: "",
    sellerId: "",
    units: "20",
    cost: "14000",
    normal: "20000",
    discount: "80",
    profit: "4",
    limit: "1",
    starts: "",
    rps: "",
  });
  const [preview, setPreview] = useState<LaunchPreview | null>(null);
  const [error, setError] = useState<string>();
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  const draft = (): LaunchDraft => ({
    productId: f.productId.trim(),
    variantId: f.variantId.trim(),
    sellerId: f.sellerId.trim(),
    unitsBought: Number(f.units),
    unitCostPaise: Math.round(Number(f.cost) * 100),
    normalPricePaise: Math.round(Number(f.normal) * 100),
    dealDiscountBps: Math.round(Number(f.discount) * 100),
    minProfitBps: Math.round(Number(f.profit) * 100),
    perMemberLimit: Number(f.limit),
    startsAt: f.starts ? new Date(f.starts).toISOString() : new Date(Date.now() + 3600e3).toISOString(),
    normalSaleMode: "IMMEDIATE",
    waitingRoomRps: f.rps ? Number(f.rps) : undefined,
  });
  const fail = (e: unknown) => setError(e instanceof ApiError ? e.message : t("error"));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <Card className="space-y-4">
        <h2 className="font-semibold">{t("new")}</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label={t("productId")} value={f.productId} onChange={set("productId")} />
          <Field label={t("variantId")} value={f.variantId} onChange={set("variantId")} />
          <Field label={t("sellerId")} hint={t("sellerHint")} value={f.sellerId} onChange={set("sellerId")} />
          <Field label={t("units")} inputMode="numeric" value={f.units} onChange={set("units")} />
          <Field label={t("cost")} prefix="₹" inputMode="decimal" value={f.cost} onChange={set("cost")} />
          <Field label={t("normal")} prefix="₹" inputMode="decimal" value={f.normal} onChange={set("normal")} />
          <Field label={t("discount")} inputMode="decimal" value={f.discount} onChange={set("discount")} />
          <Field label={t("profit")} inputMode="decimal" value={f.profit} onChange={set("profit")} />
          <Field label={t("limit")} inputMode="numeric" value={f.limit} onChange={set("limit")} />
          <Field label={t("starts")} type="datetime-local" value={f.starts} onChange={set("starts")} />
          <Field label={t("rps")} hint={t("rpsHint")} inputMode="numeric" value={f.rps} onChange={set("rps")} />
        </div>
        {error && <Alert>{error}</Alert>}
        {preview && (
          <p className="rounded-xl bg-brand-soft p-3 text-sm">
            {t("preview", {
              deal: preview.dealUnits,
              price: rupees(preview.dealPricePaise),
              normal: preview.normalUnits,
              profit: rupees(preview.profitPaise),
            })}
          </p>
        )}
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() =>
              previewLaunch(draft())
                .then((p) => {
                  setPreview(p);
                  setError(undefined);
                })
                .catch(fail)
            }
          >
            {t("calculate")}
          </Button>
          <Button
            disabled={act.create.isPending}
            onClick={() => act.create.mutate(draft(), { onError: fail, onSuccess: () => setError(undefined) })}
          >
            {t("create")}
          </Button>
        </div>
      </Card>
      {list.isPending && <div className="skeleton h-40" />}
      <ul className="space-y-2">
        {list.data?.map((l) => (
          <li key={l.id} className="card flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
            <span>
              <span className="block font-semibold">{l.productName}</span>
              <span className="text-muted">
                {l.status} · {t("dealUnits", { n: l.dealUnits, left: l.dealRemaining })} ·{" "}
                {format.dateTime(new Date(l.startsAt), { dateStyle: "medium", timeStyle: "short" })}
              </span>
            </span>
            <span className="flex gap-2">
              {l.status === "DRAFT" && (
                <Button className="min-h-9 px-4" onClick={() => act.schedule.mutate(l.id, { onError: fail })}>
                  {t("schedule")}
                </Button>
              )}
              {(l.status === "DRAFT" || l.status === "SCHEDULED") && (
                <Button
                  variant="secondary"
                  className="min-h-9 px-4"
                  onClick={() => act.cancel.mutate(l.id, { onError: fail })}
                >
                  {t("cancel")}
                </Button>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
