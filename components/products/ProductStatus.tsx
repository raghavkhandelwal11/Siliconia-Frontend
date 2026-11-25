import { useTranslations } from "next-intl";
import { StatusChip, type StatusTone } from "@/components/ui/StatusChip";

const tone: Record<string, StatusTone> = { DRAFT: "neutral", ACTIVE: "success", PAUSED: "warning", HIDDEN: "danger" };

export function ProductStatus({ status }: { status: string }) {
  const t = useTranslations("products.status");
  return (
    <span className="rounded-full bg-surface/90 backdrop-blur">
      <StatusChip tone={tone[status] ?? "neutral"}>{t(status)}</StatusChip>
    </span>
  );
}
