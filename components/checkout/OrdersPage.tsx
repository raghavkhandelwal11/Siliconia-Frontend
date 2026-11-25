"use client";

import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { api, unwrap } from "@/lib/api/client";
import { rupees } from "@/lib/checkout";
import { Alert, buttonClass } from "@/components/ui/Form";
import { StatusChip } from "@/components/ui/StatusChip";

const TONE: Record<string, "success" | "warning" | "neutral"> = {
  CONFIRMED: "success",
  PENDING_PAYMENT: "warning",
};

/** The buyer's orders, newest first (full tracking arrives with T2.5). */
export function OrdersPage() {
  const t = useTranslations("orders");
  const format = useFormatter();
  const list = useQuery({ queryKey: ["orders"], queryFn: async () => unwrap(await api.GET("/orders")).items });

  if (list.isPending) return <div className="skeleton h-48" />;
  if (list.isError) return <Alert>{t("loadError")}</Alert>;
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold sm:text-3xl">{t("title")}</h1>
      {list.data.length === 0 ? (
        <div className="card rise p-8 text-center">
          <p className="text-muted">{t("empty")}</p>
          <Link href="/categories" className={buttonClass("primary", "mt-4")}>
            {t("browse")}
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {list.data.map((o) => (
            <li key={o.id}>
              <Link
                href={`/checkout/result?order=${o.id}`}
                className="card rise flex items-center gap-4 p-4 transition hover:border-brand/40"
              >
                <span className="block size-14 shrink-0 overflow-hidden rounded-lg bg-bg">
                  {o.coverUrl && (
                    // eslint-disable-next-line @next/next/no-img-element -- sized by the API
                    <img src={o.coverUrl} alt="" className="size-full object-cover" />
                  )}
                </span>
                <span className="min-w-0 flex-1 text-sm">
                  <span className="block font-mono font-semibold">{o.number}</span>
                  <span className="block text-muted">
                    {format.dateTime(new Date(o.placedAt), { dateStyle: "medium" })} · {t("items", { n: o.itemCount })}
                  </span>
                </span>
                <span className="text-right text-sm">
                  <span className="block font-semibold">{rupees(o.payablePaise)}</span>
                  <StatusChip tone={TONE[o.status] ?? "neutral"}>{t(`status.${o.status}`)}</StatusChip>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
