import { useFormatter, useTranslations } from "next-intl";
import { StatusChip, type StatusTone } from "@/components/ui/StatusChip";
import type { SellerApplication } from "@/lib/seller";

const tone: Record<SellerApplication["approval"], StatusTone> = {
  DRAFT: "neutral",
  SUBMITTED: "info",
  UNDER_REVIEW: "info",
  APPROVED: "success",
  REJECTED: "danger",
  SUSPENDED: "warning",
};

// Approval status tracker (UI-SEL-01): where the application stands and why.
export function ApplicationStatus({
  app,
  audience = "seller",
}: {
  app: SellerApplication;
  audience?: "seller" | "admin";
}) {
  const t = useTranslations("seller.status");
  const format = useFormatter();
  const stages = ["DRAFT", "SUBMITTED", "DECIDED"] as const;
  const current =
    app.approval === "DRAFT" ? 0 : app.approval === "SUBMITTED" || app.approval === "UNDER_REVIEW" ? 1 : 2;
  return (
    <section aria-label={t("label")} className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex flex-wrap items-center gap-3">
        <StatusChip tone={tone[app.approval]}>{t(app.approval)}</StatusChip>
        {app.submittedAt && (
          <span className="text-sm text-muted">
            {t("submittedOn", { date: format.dateTime(new Date(app.submittedAt), { dateStyle: "medium" }) })}
          </span>
        )}
      </div>
      <ol className="mt-4 grid grid-cols-3 gap-2 text-center text-xs sm:text-sm">
        {stages.map((s, i) => (
          <li
            key={s}
            aria-current={i === current ? "step" : undefined}
            className={`rounded-lg border px-2 py-2 ${i <= current ? "border-accent font-semibold" : "border-line text-muted"}`}
          >
            {t(`stage.${s}`)}
          </li>
        ))}
      </ol>
      {audience === "seller" && <p className="mt-3 text-sm text-muted">{t(`help.${app.approval}`)}</p>}
      {app.approval === "REJECTED" && app.reason && (
        <p className="mt-2 rounded-lg border-l-4 border-danger bg-bg px-3 py-2 text-sm">
          <span className="font-semibold">{t("reason")}: </span>
          {app.reason}
        </p>
      )}
    </section>
  );
}
