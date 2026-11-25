import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { Icon, type IconName } from "@/components/ui/Icon";

const perks: { key: string; icon: IconName; hue: number }[] = [
  { key: "rewards", icon: "coin", hue: 40 },
  { key: "launches", icon: "rocket", hue: 330 },
  { key: "returns", icon: "returns", hue: 165 },
];

// Sign-in screens: the form beside a calm brand panel (desktop only).
export function AuthFrame({ children }: { children: React.ReactNode }) {
  const t = useTranslations("auth.frame");
  return (
    <div className="mx-auto grid max-w-5xl items-stretch gap-6 lg:grid-cols-[1fr_1.05fr]">
      <aside className="bg-brand-gradient relative hidden overflow-hidden rounded-[2rem] p-10 text-white lg:flex lg:flex-col">
        <div aria-hidden="true" className="glow-orb -left-10 -top-10 size-64 bg-white/25" />
        <div
          aria-hidden="true"
          className="glow-orb -bottom-16 right-0 size-72 bg-cyan-300/30"
          style={{ animationDelay: "-6s" }}
        />
        <div className="relative">
          <p className="text-sm font-semibold uppercase tracking-wider text-white/75">{t("eyebrow")}</p>
          <h2 className="mt-2 text-3xl font-bold leading-tight">{t("title")}</h2>
        </div>
        <ul className="relative mt-8 space-y-4">
          {perks.map((p, i) => (
            <li key={p.key} className="rise flex items-start gap-3" style={{ "--d": `${i * 90}ms` } as CSSProperties}>
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
                <Icon name={p.icon} size={20} />
              </span>
              <span>
                <span className="block font-semibold">{t(`${p.key}.title`)}</span>
                <span className="text-sm text-white/80">{t(`${p.key}.body`)}</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="relative mt-auto pt-10 text-sm text-white/70">{t("footnote")}</p>
      </aside>
      <div className="flex items-center">{children}</div>
    </div>
  );
}
