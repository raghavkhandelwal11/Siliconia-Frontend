"use client";

import { useSearchParams } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { ApiError } from "@/lib/api/client";
import { rupees, browser } from "@/lib/checkout";
import { useAutoRenew, useBalance, useBuyMembership, useMembership } from "@/lib/m3";
import { Alert, Button, Card } from "@/components/ui/Form";
import { Icon } from "@/components/ui/Icon";

// /membership: Electra Membership benefits, purchase and auto-renew (UI-MEM-01/02).
export function MembershipPage() {
  const t = useTranslations("membership");
  const format = useFormatter();
  const returned = useSearchParams().get("purchase");
  const m = useMembership(true, Boolean(returned));
  const bal = useBalance();
  const buy = useBuyMembership();
  const auto = useAutoRenew();
  const [use, setUse] = useState(0);
  const [renew, setRenew] = useState(true);

  if (m.isPending) return <div className="skeleton h-96" />;
  if (m.isError || !m.data) return <Alert>{t("loadError")}</Alert>;
  const v = m.data;
  const maxE = Math.min(bal.data?.available ?? 0, Math.floor(v.feePaise / 100));
  const err = buy.error ?? auto.error;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="card rise overflow-hidden">
        <div className="bg-brand-gradient p-6 text-white">
          <p className="text-sm font-semibold uppercase tracking-wide opacity-90">Electra</p>
          <h1 className="text-3xl font-extrabold">{t("title")}</h1>
          <p className="mt-1 opacity-90">{t("price", { amount: rupees(v.feePaise) })}</p>
        </div>
        <ul className="grid gap-3 p-6 sm:grid-cols-2">
          {(["earn", "launch", "cod", "early"] as const).map((k) => (
            <li key={k} className="flex items-start gap-2 text-sm">
              <Icon name="check" size={18} className="mt-0.5 shrink-0 text-success" />
              {t(`benefit.${k}`)}
            </li>
          ))}
        </ul>
      </section>

      {err && <Alert>{err instanceof ApiError ? err.message : t("error")}</Alert>}
      {returned && !v.isMember && <Alert tone="info">{t("confirming")}</Alert>}

      {v.isMember ? (
        <Card className="space-y-3">
          <p className="text-lg font-semibold">
            {t("activeUntil", { date: format.dateTime(new Date(v.expiresAt!), { dateStyle: "long" }) })}
          </p>
          <label className="flex items-center justify-between gap-3 text-sm">
            <span>
              <span className="block font-medium">{t("autoRenew")}</span>
              <span className="text-muted">
                {v.autoRenew && v.nextChargeAt
                  ? t("nextCharge", {
                      amount: rupees(v.feePaise),
                      date: format.dateTime(new Date(v.nextChargeAt), { dateStyle: "medium" }),
                    })
                  : t("autoOff")}
              </span>
            </span>
            <input
              type="checkbox"
              role="switch"
              checked={v.autoRenew}
              disabled={auto.isPending || (!v.autoRenew && !v.hasMandate)}
              onChange={() => auto.mutate(!v.autoRenew)}
              className="size-5 accent-[var(--color-brand)]"
            />
          </label>
          <p className="text-xs text-muted">{t("renewEarly")}</p>
        </Card>
      ) : null}

      <Card className="space-y-4">
        <h2 className="text-lg font-semibold">{v.isMember ? t("extend") : t("join")}</h2>
        {v.pending ? (
          <Button onClick={() => browser.go(v.pending!.checkoutUrl!)}>{t("continuePayment")}</Button>
        ) : (
          <>
            {maxE > 0 && (
              <div>
                <label htmlFor="m-electrons" className="text-sm">
                  {t("useElectrons", { n: use, max: maxE })}
                </label>
                <input
                  id="m-electrons"
                  type="range"
                  min={0}
                  max={maxE}
                  value={use}
                  onChange={(e) => setUse(Number(e.target.value))}
                  className="mt-1 w-full accent-[var(--color-gold)]"
                />
              </div>
            )}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={renew}
                onChange={(e) => setRenew(e.target.checked)}
                className="size-4 accent-[var(--color-brand)]"
              />
              {t("autoRenewChoice")}
            </label>
            <Button
              disabled={buy.isPending}
              onClick={() =>
                buy.mutate(
                  { electrons: use, autoRenew: renew },
                  { onSuccess: (co) => (co.checkoutUrl ? browser.go(co.checkoutUrl) : void m.refetch()) },
                )
              }
            >
              {t("pay", { amount: rupees(v.feePaise - use * 100) })}
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}
