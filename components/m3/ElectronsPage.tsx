"use client";

import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import { useBalance, useLedger } from "@/lib/m3";
import { Alert, buttonClass } from "@/components/ui/Form";
import { Icon } from "@/components/ui/Icon";

// /account/electrons: balances and history (UI-REW-01).
export function ElectronsPage() {
  const t = useTranslations("electrons");
  const format = useFormatter();
  const bal = useBalance();
  const ledger = useLedger();
  if (bal.isPending) return <div className="skeleton h-48" />;
  if (bal.isError || !bal.data) return <Alert>{t("loadError")}</Alert>;
  const b = bal.data;
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold sm:text-3xl">{t("title")}</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card rise p-5">
          <p className="flex items-center gap-2 text-sm text-muted">
            <Icon name="coin" size={16} className="text-gold" /> {t("available")}
          </p>
          <p className="mt-1 text-3xl font-extrabold">{b.available}</p>
          <p className="text-xs text-muted">{t("worth", { n: b.available })}</p>
        </div>
        <div className="card rise p-5">
          <p className="text-sm text-muted">{t("pending")}</p>
          <p className="mt-1 text-3xl font-extrabold">{b.pending}</p>
          <p className="text-xs text-muted">{t("pendingHint")}</p>
        </div>
        <div className="card rise p-5">
          <p className="text-sm text-muted">{t("nextExpiry")}</p>
          {b.nextExpiry ? (
            <p className="mt-1 text-lg font-bold">
              {t("expiresOn", {
                n: b.nextExpiry.amount,
                date: format.dateTime(new Date(b.nextExpiry.at), { dateStyle: "medium" }),
              })}
            </p>
          ) : (
            <p className="mt-1 text-muted">{t("noExpiry")}</p>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link href="/categories" className={buttonClass("primary")}>
          {t("spend")}
        </Link>
        <Link href="/membership" className={buttonClass("secondary")}>
          {t("earnMore")}
        </Link>
      </div>
      <section className="card p-5">
        <h2 className="mb-3 font-semibold">{t("history")}</h2>
        {ledger.data?.length === 0 && <p className="text-sm text-muted">{t("empty")}</p>}
        <ul className="divide-y divide-line">
          {ledger.data?.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <span>
                <span className="font-medium">{t(`type.${e.type}`)}</span>
                {e.note && <span className="text-muted"> · {e.note}</span>}
                <span className="block text-xs text-muted">
                  {format.dateTime(new Date(e.at), { dateStyle: "medium", timeStyle: "short" })}
                </span>
              </span>
              <span className={`font-semibold ${e.amount > 0 ? "text-success" : "text-muted"}`}>
                {e.amount > 0 ? "+" : ""}
                {e.amount}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
