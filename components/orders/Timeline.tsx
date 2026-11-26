"use client";

import { useFormatter, useTranslations } from "next-intl";
import type { TimelineEvent } from "@/lib/orders";

/** Who did what and when, newest last (UI-BUY-05 order timeline). */
export function Timeline({ events, viewer = "buyer" }: { events: TimelineEvent[]; viewer?: "buyer" | "seller" }) {
  const t = useTranslations("orders");
  const format = useFormatter();
  if (events.length === 0) return null;
  return (
    <ol className="space-y-2 border-l-2 border-line pl-4" aria-label={t("timeline")}>
      {events.map((e, i) => (
        <li key={i} className="relative text-sm">
          <span
            aria-hidden
            className={`absolute -left-[1.4rem] top-1 size-2.5 rounded-full ${i === events.length - 1 ? "bg-brand" : "bg-line"}`}
          />
          <span className="font-medium">{t(`status.${e.status}`)}</span>
          <span className="text-muted">
            {" "}
            · {t(viewer === "seller" ? `sellerActor.${e.actor}` : `actor.${e.actor}`)}
          </span>
          {e.note && <span className="block text-muted">{e.note}</span>}
          <span className="block text-xs text-muted">
            {format.dateTime(new Date(e.at), { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
          </span>
        </li>
      ))}
    </ol>
  );
}
