import Link from "next/link";
import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/Icon";
import { buttonClass } from "@/components/ui/Form";

// UI-PUB-01: the first thing a visitor sees. Drifting colour glows behind,
// three floating cards that preview what makes Siliconics different.
export function Hero() {
  const t = useTranslations("home.hero");
  return (
    <section className="relative isolate overflow-hidden rounded-[2rem] border border-line bg-surface px-6 py-12 shadow-card sm:px-10 lg:py-16">
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <div className="glow-orb -left-20 -top-24 size-80" style={{ background: "var(--glow-1)" }} />
        <div
          className="glow-orb right-0 top-10 size-72"
          style={{ background: "var(--glow-2)", animationDelay: "-5s" }}
        />
        <div
          className="glow-orb bottom-[-6rem] left-1/3 size-72"
          style={{ background: "var(--glow-3)", animationDelay: "-9s" }}
        />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: "radial-gradient(var(--color-line) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
            maskImage: "radial-gradient(ellipse at 30% 40%, black 30%, transparent 75%)",
          }}
        />
      </div>

      <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_1fr]">
        <div>
          <p className="rise inline-flex items-center gap-2 rounded-full border border-line bg-surface/80 px-3 py-1 text-xs font-semibold text-brand">
            <Icon name="sparkle" size={14} />
            {t("eyebrow")}
          </p>
          <h1
            className="rise mt-5 text-4xl font-extrabold leading-[1.08] sm:text-5xl lg:text-6xl"
            style={{ "--d": "80ms" } as CSSProperties}
          >
            {t("titleStart")} <span className="text-gradient">{t("titleHighlight")}</span> {t("titleEnd")}
          </h1>
          <p className="rise mt-5 max-w-xl text-lg text-muted" style={{ "--d": "160ms" } as CSSProperties}>
            {t("subtitle")}
          </p>
          <div className="rise mt-8 flex flex-wrap gap-3" style={{ "--d": "240ms" } as CSSProperties}>
            <Link href="/categories" className={buttonClass("primary", "px-6 text-base")}>
              {t("explore")}
              <Icon name="arrow" size={18} />
            </Link>
            <Link href="/membership" className={buttonClass("secondary", "px-6 text-base")}>
              {t("electra")}
            </Link>
          </div>
          <ul
            className="rise mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted"
            style={{ "--d": "320ms" } as CSSProperties}
          >
            {(["returns", "verified", "rewards"] as const).map((k) => (
              <li key={k} className="inline-flex items-center gap-1.5">
                <Icon name="check" size={16} className="text-success" />
                {t(`points.${k}`)}
              </li>
            ))}
          </ul>
        </div>

        <div aria-hidden="true" className="relative mx-auto h-[23rem] w-full max-w-sm sm:h-[25rem]">
          {/* Launch deal preview */}
          <div className="card float absolute left-0 top-0 w-64 p-4" style={{ "--d": "0s" } as CSSProperties}>
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="rounded-full bg-brand-soft px-2 py-0.5 text-brand">{t("preview.launch")}</span>
              <span className="text-muted">{t("preview.members")}</span>
            </div>
            <p className="mt-3 text-sm font-semibold">{t("preview.phone")}</p>
            <p className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold">₹4,000</span>
              <span className="text-sm text-muted line-through">₹20,000</span>
              <span className="text-sm font-bold text-success">−80%</span>
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-line">
              <div className="bg-brand-gradient h-full w-[70%] rounded-full" />
            </div>
            <p className="mt-1.5 text-xs text-muted">{t("preview.unitsLeft")}</p>
          </div>
          {/* Electrons preview */}
          <div className="card float absolute right-0 top-36 w-56 p-4" style={{ "--d": "-2s" } as CSSProperties}>
            <div className="flex items-center gap-3">
              <span className="icon-tile size-11" style={{ "--hue": 40 } as CSSProperties}>
                <Icon name="coin" size={22} />
              </span>
              <div>
                <p className="text-lg font-extrabold text-gold">+40</p>
                <p className="text-xs text-muted">{t("preview.electrons")}</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted">{t("preview.electronValue")}</p>
          </div>
          {/* Creator review preview */}
          <div className="card float absolute bottom-0 left-6 w-60 p-4" style={{ "--d": "-4s" } as CSSProperties}>
            <div className="flex items-center gap-2">
              <span className="bg-brand-gradient inline-flex size-8 items-center justify-center rounded-full text-xs font-bold text-white">
                RK
              </span>
              <div className="text-xs">
                <p className="font-semibold">{t("preview.creator")}</p>
                <p className="text-muted">{t("preview.followers")}</p>
              </div>
            </div>
            <p className="mt-2 flex gap-0.5 text-gold">
              {Array.from({ length: 5 }, (_, i) => (
                <Icon key={i} name="star" size={14} filled />
              ))}
            </p>
            <p className="mt-1 text-xs text-muted">{t("preview.review")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
