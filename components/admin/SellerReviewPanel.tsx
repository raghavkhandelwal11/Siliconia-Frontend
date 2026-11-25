"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { api, ApiError, unwrap } from "@/lib/api/client";
import { Alert, Button, Card } from "@/components/ui/Form";
import { StatusChip } from "@/components/ui/StatusChip";
import { ApplicationStatus } from "@/components/seller/ApplicationStatus";
import { Details } from "@/components/seller/SellerOnboarding";
import { KycResult } from "@/components/seller/KycResult";
import { formatPhone } from "@/lib/auth/session";

// UI-ADM-02: review one seller application and decide.
export function SellerReviewPanel({ id }: { id: string }) {
  const t = useTranslations("admin.review");
  const qc = useQueryClient();
  const [reason, setReason] = useState("");
  const review = useQuery({
    queryKey: ["admin", "seller", id],
    queryFn: async () =>
      unwrap(await api.GET("/admin/approvals/sellers/{accountId}", { params: { path: { accountId: id } } })),
  });
  const decide = useMutation({
    mutationFn: async (decision: "APPROVE" | "REJECT") =>
      unwrap(
        await api.POST("/admin/approvals/sellers/{accountId}/decision", {
          params: { path: { accountId: id } },
          body: { decision, reason: reason.trim() || undefined },
        }),
      ),
    onSuccess: (data) => {
      qc.setQueryData(["admin", "seller", id], data);
      void qc.invalidateQueries({ queryKey: ["admin", "seller-queue"] });
    },
  });

  if (review.isPending) return <p className="text-muted">{t("loading")}</p>;
  if (review.isError || !review.data) return <Alert>{t("loadError")}</Alert>;
  const r = review.data;
  const pending = r.approval === "SUBMITTED" || r.approval === "UNDER_REVIEW";

  return (
    <div className="space-y-6">
      <Link href="/admin/approvals/sellers" className="text-sm text-accent underline">
        {t("back")}
      </Link>
      <h1 className="text-2xl font-bold">{r.storeName || t("unnamed")}</h1>
      <ApplicationStatus app={r} audience="admin" />
      <Card>
        <h2 className="text-lg font-semibold">{t("details")}</h2>
        <div className="mt-3 space-y-3">
          <Details app={r} />
          {r.phone && (
            <p className="text-sm">
              <span className="text-muted">{t("phone")}: </span>
              {formatPhone(r.phone)}
            </p>
          )}
        </div>
      </Card>
      <Card>
        <h2 className="text-lg font-semibold">{t("checks")}</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-sm font-medium">PAN</p>
            <KycResult check={r.panCheck} last4={r.panLast4} />
            {r.panCheck && (
              <p className="text-xs text-muted">{t("nameMatch", { pct: Math.round(r.panCheck.nameMatch * 100) })}</p>
            )}
          </div>
          <div>
            <p className="text-sm font-medium">{t("bank")}</p>
            <KycResult check={r.bankCheck} last4={r.bankLast4} />
            {r.bankCheck && (
              <p className="text-xs text-muted">{t("nameMatch", { pct: Math.round(r.bankCheck.nameMatch * 100) })}</p>
            )}
          </div>
          <div>
            <p className="text-sm font-medium">GSTIN</p>
            {r.gstin ? (
              <StatusChip tone={r.gstinMatchesPan ? "success" : "danger"}>
                {r.gstinMatchesPan ? t("gstinMatches") : t("gstinMismatch")}
              </StatusChip>
            ) : (
              <p className="text-sm text-muted">{r.gstinRequired ? t("gstinMissing") : t("gstinNotNeeded")}</p>
            )}
          </div>
        </div>
      </Card>

      {pending ? (
        <Card>
          <h2 className="text-lg font-semibold">{t("decision")}</h2>
          <label className="mt-3 block text-sm font-medium" htmlFor="reason">
            {t("reasonLabel")}
          </label>
          <textarea
            id="reason"
            className="mt-1 min-h-24 w-full rounded-lg border border-line bg-surface p-3 text-base"
            maxLength={500}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            aria-describedby="reason-hint"
          />
          <p id="reason-hint" className="text-sm text-muted">
            {t("reasonHint")}
          </p>
          {decide.isError && (
            <div className="mt-3">
              <Alert>{decide.error instanceof ApiError ? decide.error.message : t("decideError")}</Alert>
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button disabled={decide.isPending} onClick={() => decide.mutate("APPROVE")}>
              {t("approve")}
            </Button>
            <Button
              variant="secondary"
              disabled={decide.isPending || reason.trim().length < 10}
              onClick={() => decide.mutate("REJECT")}
            >
              {t("reject")}
            </Button>
          </div>
        </Card>
      ) : (
        decide.isSuccess && <Alert tone="info">{t("decided")}</Alert>
      )}
    </div>
  );
}
