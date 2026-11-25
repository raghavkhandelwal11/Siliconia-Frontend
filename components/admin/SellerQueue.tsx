"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { api, unwrap } from "@/lib/api/client";
import { Alert } from "@/components/ui/Form";

const TABS = ["pending", "approved", "rejected"] as const;
type Tab = (typeof TABS)[number];

// UI-ADM-02: seller approval queue (FR-ADM-01).
export function SellerQueue() {
  const t = useTranslations("admin.approvals");
  const format = useFormatter();
  const [tab, setTab] = useState<Tab>("pending");
  const list = useQuery({
    queryKey: ["admin", "seller-queue", tab],
    queryFn: async () =>
      unwrap(await api.GET("/admin/approvals/sellers", { params: { query: { status: tab } } })).applications,
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <div role="tablist" aria-label={t("filter")} className="flex gap-2">
        {TABS.map((x) => (
          <button
            key={x}
            role="tab"
            aria-selected={tab === x}
            onClick={() => setTab(x)}
            className={`min-h-10 rounded-full border px-4 text-sm transition ${tab === x ? "bg-brand-gradient border-transparent font-semibold text-white shadow-card" : "border-line text-muted hover:border-brand/40"}`}
          >
            {t(`tabs.${x}`)}
          </button>
        ))}
      </div>
      {list.isPending && (
        <div className="card space-y-3 p-4" aria-label={t("loading")}>
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-8" />
          ))}
        </div>
      )}
      {list.isError && <Alert>{t("loadError")}</Alert>}
      {list.data && list.data.length === 0 && <p className="text-muted">{t(`empty.${tab}`)}</p>}
      {list.data && list.data.length > 0 && (
        <div className="card rise overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">{t("store")}</th>
                <th className="px-4 py-3 font-medium">{t("legal")}</th>
                <th className="px-4 py-3 font-medium">{t("checks")}</th>
                <th className="px-4 py-3 font-medium">{t("submitted")}</th>
              </tr>
            </thead>
            <tbody>
              {list.data.map((a) => (
                <tr key={a.accountId} className="border-b border-line transition last:border-0 hover:bg-brand-soft/50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/approvals/sellers/${a.accountId}`}
                      className="font-semibold text-accent underline"
                    >
                      {a.storeName || t("unnamed")}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{a.legalName}</td>
                  <td className="px-4 py-3">
                    {[a.panVerified && "PAN", a.bankVerified && t("bank"), a.hasGstin && "GSTIN"]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {a.submittedAt
                      ? format.dateTime(new Date(a.submittedAt), { dateStyle: "medium", timeStyle: "short" })
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
