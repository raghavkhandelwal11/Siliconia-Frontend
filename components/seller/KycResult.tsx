import { useTranslations } from "next-intl";
import { StatusChip } from "@/components/ui/StatusChip";
import type { KycCheck } from "@/lib/seller";

/** Result of the latest PAN or bank check. */
export function KycResult({ check, last4 }: { check?: KycCheck; last4?: string }) {
  const t = useTranslations("seller.kyc");
  if (!check) return null;
  if (check.status === "VERIFIED") {
    return <StatusChip tone="success">{t("verified", { last4: last4 ?? "" })}</StatusChip>;
  }
  return (
    <div className="space-y-1" role="status">
      <StatusChip tone="danger">{t(check.status)}</StatusChip>
      {check.reason && <p className="text-sm text-muted">{check.reason}</p>}
    </div>
  );
}
