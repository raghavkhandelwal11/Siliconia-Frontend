import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { Icon, type IconName } from "@/components/ui/Icon";

const items: { key: string; icon: IconName; hue: number }[] = [
  { key: "returns", icon: "returns", hue: 165 },
  { key: "sellers", icon: "shield", hue: 248 },
  { key: "payments", icon: "coin", hue: 40 },
  { key: "local", icon: "flag", hue: 18 },
];

// Reasons to trust the store, in one calm row.
export function TrustStrip() {
  const t = useTranslations("home.trust");
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((it) => (
        <li key={it.key} className="flex items-start gap-3">
          <span className="icon-tile size-10" style={{ "--hue": it.hue } as CSSProperties}>
            <Icon name={it.icon} size={20} />
          </span>
          <div>
            <p className="font-semibold">{t(`${it.key}.title`)}</p>
            <p className="text-sm text-muted">{t(`${it.key}.body`)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
