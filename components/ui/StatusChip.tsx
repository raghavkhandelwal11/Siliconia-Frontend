import { Icon, type IconName } from "./Icon";

export type StatusTone = "success" | "info" | "warning" | "danger" | "neutral";

const toneClass: Record<StatusTone, string> = {
  success: "text-success border-success",
  info: "text-info border-info",
  warning: "text-warning border-warning",
  danger: "text-danger border-danger",
  neutral: "text-neutral border-neutral",
};

const toneIcon: Record<StatusTone, IconName> = {
  success: "check",
  info: "info",
  warning: "clock",
  danger: "alert",
  neutral: "info",
};

/**
 * Status chip that never relies on colour alone: it always shows an icon and
 * text (NFR-ACC-02). Used for order, application, launch and Electrons states.
 */
export function StatusChip({ tone, children, icon }: { tone: StatusTone; children: React.ReactNode; icon?: IconName }) {
  return (
    <span
      data-tone={tone}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-sm font-medium ${toneClass[tone]}`}
    >
      <Icon name={icon ?? toneIcon[tone]} size={16} />
      <span className="text-ink">{children}</span>
    </span>
  );
}
