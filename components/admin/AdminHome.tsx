"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { api, unwrap } from "@/lib/api/client";
import { Card } from "@/components/ui/Form";
import { Icon } from "@/components/ui/Icon";

// UI-ADM-01 (first piece): what needs an admin's attention.
export function AdminHome() {
  const t = useTranslations("admin.home");
  const pending = useQuery({
    queryKey: ["admin", "seller-queue", "pending"],
    queryFn: async () =>
      unwrap(await api.GET("/admin/approvals/sellers", { params: { query: { status: "pending" } } })).applications,
  });
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <Card>
        <div className="flex items-center gap-3">
          <span className="icon-tile size-11" style={{ "--hue": 248 } as React.CSSProperties}>
            <Icon name="store" size={22} />
          </span>
          <h2 className="text-lg font-semibold">{t("sellerApprovals")}</h2>
        </div>
        <p className="mt-3 text-3xl font-extrabold">{pending.data?.length ?? "–"}</p>
        <p className="text-muted">{pending.data ? t("pending", { count: pending.data.length }) : t("loading")}</p>
        <Link href="/admin/approvals/sellers" className="mt-3 inline-block font-semibold text-accent underline">
          {t("open")}
        </Link>
      </Card>
    </div>
  );
}
