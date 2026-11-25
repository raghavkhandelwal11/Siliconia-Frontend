"use client";

import { useFormatter, useTranslations } from "next-intl";
import type { Order } from "@/lib/checkout";

type Shipment = NonNullable<Order["subOrders"][number]["shipment"]>;

const STEPS = ["CONFIRMED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"] as const;

/** Progress bar and courier scans for one seller's part of an order (UI-BUY-05). */
export function Tracking({ status, shipment }: { status: string; shipment?: Shipment }) {
  const t = useTranslations("shipping");
  const format = useFormatter();
  const reached = STEPS.indexOf(status as (typeof STEPS)[number]);
  if (status === "RTO" || reached < 0) {
    return status === "RTO" ? <p className="text-sm font-semibold text-danger">{t("rto")}</p> : null;
  }
  const events = [...(shipment?.events ?? [])].reverse();
  return (
    <div className="space-y-3">
      <ol className="grid grid-cols-4 gap-1" aria-label={t("progress")}>
        {STEPS.map((s, i) => (
          <li key={s} className="space-y-1">
            <span
              className={`block h-1.5 rounded-full transition-colors duration-500 ${i <= reached ? "bg-brand-gradient" : "bg-line"}`}
            />
            <span className={`block text-[11px] leading-tight ${i <= reached ? "font-semibold" : "text-muted"}`}>
              {t(`step.${s}`)}
              {i === reached && <span className="sr-only"> ({t("current")})</span>}
            </span>
          </li>
        ))}
      </ol>
      {shipment && (
        <div className="text-xs text-muted">
          <p>
            {t("awb", { courier: shipment.courier, awb: shipment.awb })}
            {shipment.eta && status !== "DELIVERED" && (
              <>
                {" "}
                ·{" "}
                {t("eta", {
                  date: format.dateTime(new Date(shipment.eta), { weekday: "short", day: "numeric", month: "short" }),
                })}
              </>
            )}
          </p>
          {events.length > 0 && (
            <details className="mt-1">
              <summary className="cursor-pointer font-medium text-brand">{t("scans", { n: events.length })}</summary>
              <ul className="mt-2 space-y-1.5 border-l border-line pl-3">
                {events.map((e, i) => (
                  <li key={i} className={i === 0 ? "text-ink" : ""}>
                    <span className="font-medium">{t(`scan.${e.status}`)}</span>
                    {e.location && <> · {e.location}</>}
                    <span className="block">
                      {format.dateTime(new Date(e.at), {
                        day: "numeric",
                        month: "short",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
