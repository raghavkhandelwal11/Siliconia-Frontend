import Link from "next/link";
import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { Icon, type IconName } from "@/components/ui/Icon";

const steps: { key: string; icon: IconName }[] = [
  { key: "apply", icon: "store" },
  { key: "verify", icon: "shield" },
  { key: "list", icon: "rocket" },
];

// Invites sellers: the three onboarding steps, on the brand gradient.
export function SellBand() {
  const t = useTranslations("home.sell");
  return (
    <section className="bg-brand-gradient relative overflow-hidden rounded-[2rem] px-6 py-10 text-white sm:px-10">
      <div aria-hidden="true" className="glow-orb -right-10 -top-16 size-72 bg-white/20" />
      <div className="relative grid gap-8 lg:grid-cols-[1fr_1.3fr] lg:items-center">
        <div>
          <h2 className="text-2xl font-bold sm:text-3xl">{t("title")}</h2>
          <p className="mt-2 text-white/85">{t("body")}</p>
          <Link
            href="/auth/sign-in?role=SELLER&next=/seller/onboarding"
            className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-[#2b1fb8] shadow-lg transition hover:-translate-y-0.5 active:scale-[0.97]"
          >
            {t("cta")}
            <Icon name="arrow" size={18} />
          </Link>
        </div>
        <ol className="grid gap-3 sm:grid-cols-3">
          {steps.map((s, i) => (
            <li
              key={s.key}
              className="rise rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur"
              style={{ "--d": `${i * 90}ms` } as CSSProperties}
            >
              <span className="inline-flex size-10 items-center justify-center rounded-xl bg-white/15">
                <Icon name={s.icon} size={20} />
              </span>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-white/70">
                {t("step", { n: i + 1 })}
              </p>
              <p className="font-semibold">{t(`${s.key}.title`)}</p>
              <p className="mt-1 text-sm text-white/80">{t(`${s.key}.body`)}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
