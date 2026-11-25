import { Icon, type IconName } from "./Icon";

export type StatusTone = "success" | "info" | "warning" | "danger" | "neutral";

const toneClass: Record<StatusTone, string> = {
  success: "text-success border-success/35 bg-success/10",
  info: "text-info border-info/35 bg-info/10",
  warning: "text-warning border-warning/40 bg-warning/10",
  danger: "text-danger border-danger/35 bg-danger/10",
  neutral: "text-neutral border-neutral/35 bg-neutral/10",
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
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-sm font-medium transition ${toneClass[tone]}`}
    >
      <Icon name={icon ?? toneIcon[tone]} size={16} />
      <span className="text-ink">{children}</span>
    </span>
  );
}
