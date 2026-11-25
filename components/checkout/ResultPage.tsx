"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState, type CSSProperties } from "react";
import { ApiError } from "@/lib/api/client";
import { browser, oneLine, restartPayment, rupees, useOrder } from "@/lib/checkout";
import { Alert, Button, buttonClass } from "@/components/ui/Form";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Tracking } from "@/components/shipping/Tracking";

// UI-BUY-04: where the payment page returns to. Polls until the payment
// webhook confirms the order, or offers a retry while the order is held.
export function ResultPage() {
  const t = useTranslations("orderResult");
  const id = useSearchParams().get("order") ?? "";
  const order = useOrder(id);
  const [retryError, setRetryError] = useState<string>();
  const [retrying, setRetrying] = useState(false);
  const now = useNow();

  if (!id) return <Alert>{t("missing")}</Alert>;
  if (order.isPending) return <div className="skeleton mx-auto h-80 max-w-xl" />;
  if (order.isError || !order.data) return <Alert>{t("loadError")}</Alert>;
  const o = order.data;
  const failed = o.status === "PENDING_PAYMENT" && o.payment?.status === "FAILED";
  const delivered = o.subOrders.length > 0 && o.subOrders.every((s) => s.status === "DELIVERED");
  const moving = o.subOrders.some((s) => ["SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"].includes(s.status));
  const left = Math.max(0, Math.floor((new Date(o.expiresAt).getTime() - now) / 1000));

  const view: { icon: IconName; hue: number; title: string; body: string } =
    o.status === "CONFIRMED" && delivered
      ? { icon: "check", hue: 150, title: t("deliveredTitle"), body: t("deliveredBody") }
      : o.status === "CONFIRMED" && moving
        ? { icon: "truck", hue: 200, title: t("onTheWayTitle"), body: t("onTheWayBody") }
        : o.status === "CONFIRMED"
          ? {
              icon: "check",
              hue: 150,
              title: t("confirmedTitle"),
              body: o.payMethod === "COD" ? t("confirmedCod", { amount: rupees(o.payablePaise) }) : t("confirmedPaid"),
            }
          : o.status === "EXPIRED"
            ? { icon: "clock", hue: 25, title: t("expiredTitle"), body: t("expiredBody") }
            : failed
              ? { icon: "alert", hue: 25, title: t("failedTitle"), body: t("failedBody") }
              : { icon: "clock", hue: 248, title: t("waitingTitle"), body: t("waitingBody") };

  async function retry() {
    setRetrying(true);
    setRetryError(undefined);
    try {
      browser.go(await restartPayment(o.id));
    } catch (e) {
      setRetryError(e instanceof ApiError ? e.message : t("retryError"));
      setRetrying(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <section className="card rise flex flex-col items-center gap-3 p-8 text-center">
        <span
          className={`icon-tile size-16 ${o.status === "CONFIRMED" ? "pop" : ""}`}
          style={{ "--hue": view.hue } as CSSProperties}
        >
          <Icon name={view.icon} size={30} />
        </span>
        <h1 className="text-2xl font-bold">{view.title}</h1>
        <p className="text-muted" aria-live="polite">
          {view.body}
        </p>
        <p className="text-sm">
          {t("number")} <span className="font-mono font-semibold">{o.number}</span>
        </p>
        {o.status === "PENDING_PAYMENT" && (
          <>
            {left > 0 && (
              <p className="text-sm text-muted">
                {t("heldFor", { time: `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}` })}
              </p>
            )}
            {(failed || o.payment?.checkoutUrl) && left > 0 && (
              <Button onClick={retry} disabled={retrying}>
                {failed ? t("retry") : t("continuePayment")}
              </Button>
            )}
            {retryError && <Alert>{retryError}</Alert>}
          </>
        )}
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Link href="/categories" className={buttonClass("secondary")}>
            {t("keepShopping")}
          </Link>
          {o.status === "EXPIRED" && o.subOrders[0]?.items[0] && (
            <Link href={`/p/${o.subOrders[0].items[0].slug}`} className={buttonClass("primary")}>
              {t("shopAgain")}
            </Link>
          )}
        </div>
      </section>

      <section className="card rise space-y-3 p-5 text-sm" style={{ "--d": "80ms" } as CSSProperties}>
        <h2 className="font-semibold">{t("details")}</h2>
        {o.subOrders.map((s) => (
          <div key={s.id}>
            <p className="flex items-center gap-2 font-medium">
              <Icon name="store" size={14} className="text-brand" />
              {s.storeName}
            </p>
            {o.status === "CONFIRMED" && (
              <div className="my-2">
                <Tracking status={s.status} shipment={s.shipment} />
              </div>
            )}
            <ul className="mt-1 space-y-1 text-muted">
              {s.items.map((it, i) => (
                <li key={i} className="flex justify-between gap-3">
                  <span className="line-clamp-1">
                    {it.name} × {it.qty}
                  </span>
                  <span>{rupees(it.lineTotalPaise)}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <p className="flex justify-between border-t border-line pt-2 font-bold">
          <span>
            {o.payMethod === "COD" ? t("payOnDelivery") : o.status === "CONFIRMED" ? t("total") : t("amount")}
          </span>
          <span>{rupees(o.payablePaise)}</span>
        </p>
        <p className="text-muted">
          {t("deliverTo", { name: o.address.name })} {oneLine(o.address)}
        </p>
      </section>
    </div>
  );
}

function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}
