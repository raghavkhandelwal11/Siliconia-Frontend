"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useSellerApplication } from "@/lib/seller";
import { Alert, buttonClass, Card } from "@/components/ui/Form";
import { ApplicationStatus } from "./ApplicationStatus";

// /seller: until approved, the portal is the application; afterwards it will
// grow into the dashboard (UI-SEL-02) as products and orders arrive.
export function SellerHome() {
  const t = useTranslations("seller.home");
  const app = useSellerApplication();
  if (app.isPending) return <p className="text-muted">{t("loading")}</p>;
  if (app.isError || !app.data) return <Alert>{t("loadError")}</Alert>;
  const a = app.data;
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{a.storeName || t("title")}</h1>
      <ApplicationStatus app={a} />
      {a.approval === "APPROVED" ? (
        <Card>
          <h2 className="text-lg font-semibold">{t("approvedTitle")}</h2>
          <p className="mt-1 text-muted">{t("approvedBody")}</p>
        </Card>
      ) : (
        <Link href="/seller/onboarding" className={buttonClass("primary")}>
          {a.editable ? t("continue") : t("view")}
        </Link>
      )}
    </div>
  );
}
