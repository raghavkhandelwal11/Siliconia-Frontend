"use client";

import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { issueTone, useMyIssues, useSupportIssues, type Issue } from "@/lib/support";
import { Alert, buttonClass } from "@/components/ui/Form";
import { StatusChip } from "@/components/ui/StatusChip";

function Rows({ items, base }: { items: Issue[]; base: string }) {
  const t = useTranslations("issues");
  const format = useFormatter();
  if (items.length === 0) return <p className="text-muted">{t("empty")}</p>;
  return (
    <ul className="space-y-3">
      {items.map((is) => (
        <li key={is.id}>
          <Link
            href={`${base}/${is.id}`}
            className="card flex flex-wrap items-center justify-between gap-3 p-4 transition hover:border-brand/40"
          >
            <span className="text-sm">
              <span className="block font-mono font-semibold">{is.number}</span>
              <span className="text-muted">
                {t(`type.${is.type}`)} · {t("order", { number: is.orderNumber })} ·{" "}
                {format.dateTime(new Date(is.updatedAt), { day: "numeric", month: "short" })}
              </span>
            </span>
            <StatusChip tone={issueTone[is.status] ?? "neutral"}>{t(`status.${is.status}`)}</StatusChip>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** The buyer's issues (/account/issues). */
export function IssuesPage() {
  const t = useTranslations("issues");
  const list = useMyIssues();
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold sm:text-3xl">{t("title")}</h1>
        <Link href="/account/issues/new" className={buttonClass("primary")}>
          {t("raise")}
        </Link>
      </div>
      {list.isPending && <div className="skeleton h-40" />}
      {list.isError && <Alert>{t("loadError")}</Alert>}
      {list.data && <Rows items={list.data} base="/account/issues" />}
    </div>
  );
}

const SUPPORT_TABS = ["", "OPEN", "IN_PROGRESS", "WAITING_CUSTOMER", "RESOLVED", "CLOSED"] as const;

/** The support queue (/admin/issues): open issues first, oldest first. */
export function SupportQueue() {
  const t = useTranslations("issues");
  const [tab, setTab] = useState<(typeof SUPPORT_TABS)[number]>("");
  const list = useSupportIssues(tab);
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold sm:text-3xl">{t("supportTitle")}</h1>
      <div role="tablist" aria-label={t("filter")} className="flex gap-2 overflow-x-auto pb-1">
        {SUPPORT_TABS.map((s) => (
          <button
            key={s || "all"}
            role="tab"
            aria-selected={tab === s}
            onClick={() => setTab(s)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium ${tab === s ? "border-brand bg-brand-soft text-brand" : "border-line"}`}
          >
            {s ? t(`status.${s}`) : t("all")}
          </button>
        ))}
      </div>
      {list.isPending && <div className="skeleton h-40" />}
      {list.isError && <Alert>{t("loadError")}</Alert>}
      {list.data && <Rows items={list.data} base="/admin/issues" />}
    </div>
  );
}
