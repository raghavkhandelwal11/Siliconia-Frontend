"use client";

import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import { rupees } from "@/lib/checkout";
import { useLaunches } from "@/lib/m3";
import { Alert } from "@/components/ui/Form";

// /launches: launch deals, live first.
export function LaunchList() {
  const t = useTranslations("launch");
  const format = useFormatter();
  const list = useLaunches();
  if (list.isPending) return <div className="skeleton h-48" />;
  if (list.isError) return <Alert>{t("loadError")}</Alert>;
  const order = ["LIVE", "SCHEDULED", "DEAL_SOLD_OUT", "NORMAL_ON_SALE", "COMPLETED"];
  const items = [...list.data].sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status));
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold sm:text-3xl">{t("listTitle")}</h1>
      {items.length === 0 && <p className="text-muted">{t("none")}</p>}
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((l) => (
          <li key={l.id}>
            <Link
              href={`/launches/${l.id}`}
              className="card rise block overflow-hidden transition hover:border-brand/40"
            >
              {l.coverUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- sized by the API
                <img src={l.coverUrl} alt="" className="aspect-[4/3] w-full bg-bg object-contain" />
              )}
              <span className="block space-y-1 p-4">
                <span className="block text-xs font-semibold text-brand">{t(`status.${l.status}`)}</span>
                <span className="block font-semibold">{l.productName}</span>
                <span className="block text-sm">
                  <span className="font-bold">{rupees(l.dealPricePaise)}</span>{" "}
                  <span className="text-muted line-through">{rupees(l.normalPricePaise)}</span>
                </span>
                <span className="block text-xs text-muted">
                  {l.status === "SCHEDULED"
                    ? t("startsOn", {
                        date: format.dateTime(new Date(l.startsAt), { dateStyle: "medium", timeStyle: "short" }),
                      })
                    : t("unitsLeft", { left: l.dealRemaining, total: l.dealUnits })}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
