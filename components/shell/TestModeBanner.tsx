import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/Icon";

// UI-GLB-05: shown on every page of the prototype (FR-NOT-05, D-20).
export function TestModeBanner() {
  const t = useTranslations("shell");
  return (
    <div role="status" className="bg-test px-4 py-2 text-center text-sm font-semibold text-white">
      <span className="inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
        <span className="inline-flex items-center gap-1.5">
          <Icon name="flask" size={16} />
          {t("testMode")}
        </span>
        <a href="/test-inbox" className="underline underline-offset-2">
          {t("testInbox")}
        </a>
      </span>
    </div>
  );
}
