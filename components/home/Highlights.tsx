import Link from "next/link";
import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { Icon, type IconName } from "@/components/ui/Icon";

const items: { key: string; icon: IconName; hue: number; href: string }[] = [
  { key: "electra", icon: "sparkle", hue: 262, href: "/membership" },
  { key: "electrons", icon: "coin", hue: 40, href: "/membership#electrons" },
  { key: "launches", icon: "rocket", hue: 330, href: "/launches" },
  { key: "creators", icon: "play", hue: 192, href: "/for-creators" },
];

// What makes Siliconics different (BRD sections 3–6), one card each.
export function Highlights() {
  const t = useTranslations("home.highlights");
  return (
    <section aria-labelledby="why">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-brand">{t("eyebrow")}</p>
          <h2 id="why" className="mt-1 text-2xl font-bold sm:text-3xl">
            {t("title")}
          </h2>
        </div>
      </div>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((it, i) => (
          <li key={it.key} className="rise" style={{ "--d": `${i * 70}ms` } as CSSProperties}>
            <Link href={it.href} className="card card-hover group flex h-full flex-col p-5">
              <span className="icon-tile size-12 group-hover:scale-110" style={{ "--hue": it.hue } as CSSProperties}>
                <Icon name={it.icon} size={24} />
              </span>
              <h3 className="mt-4 text-lg font-semibold">{t(`${it.key}.title`)}</h3>
              <p className="mt-1 text-2xl font-extrabold tracking-tight">{t(`${it.key}.stat`)}</p>
              <p className="mt-2 flex-1 text-sm text-muted">{t(`${it.key}.body`)}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand">
                {t("more")}
                <Icon name="arrow" size={16} className="transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
