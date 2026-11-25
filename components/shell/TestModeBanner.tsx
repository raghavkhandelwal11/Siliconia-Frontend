import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/Icon";

// UI-GLB-05: shown on every page of the prototype (FR-NOT-05, D-20). Striped
// like hazard tape so it never looks like part of the real store.
export function TestModeBanner() {
  const t = useTranslations("shell");
  return (
    <div
      role="status"
      className="bg-test px-4 py-1.5 text-center text-xs font-semibold text-white sm:text-sm"
      style={{
        backgroundImage: "repeating-linear-gradient(135deg, rgb(255 255 255 / 0.08) 0 12px, transparent 12px 24px)",
      }}
    >
      <span className="inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
        <span className="inline-flex items-center gap-1.5">
          <Icon name="flask" size={16} />
          {t("testMode")}
        </span>
        <a href="/test-inbox" className="rounded-full bg-white/15 px-2.5 py-0.5 underline-offset-2 hover:bg-white/25">
          {t("testInbox")}
        </a>
      </span>
    </div>
  );
}
