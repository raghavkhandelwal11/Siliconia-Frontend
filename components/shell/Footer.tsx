import Link from "next/link";
import { useTranslations } from "next-intl";
import { ApiStatus } from "@/components/system/ApiStatus";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

// UI-GLB-07: programme pages, help, legal and grievance officer.
export function Footer({ testMode }: { testMode: boolean }) {
  const t = useTranslations("shell.footer");
  const app = useTranslations("app");
  const groups = [
    {
      title: t("shop"),
      links: [
        { href: "/categories", label: t("allCategories") },
        { href: "/membership", label: t("electra") },
        { href: "/launches", label: t("launches") },
      ],
    },
    {
      title: t("partners"),
      links: [
        { href: "/seller", label: t("sell") },
        { href: "/for-creators", label: t("forCreators") },
        { href: "/for-promoters", label: t("forPromoters") },
      ],
    },
    {
      title: t("support"),
      links: [
        { href: "/help", label: t("help") },
        { href: "/legal/terms", label: t("legal") },
        { href: "/legal/grievance", label: t("grievance") },
      ],
    },
  ];
  return (
    <footer className="relative mt-16 overflow-hidden border-t border-line bg-surface pb-20 md:pb-0">
      <div aria-hidden="true" className="bg-brand-gradient absolute inset-x-0 top-0 h-px opacity-60" />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="space-y-3">
          <Logo label={app("name")} />
          <p className="max-w-xs text-sm text-muted">{app("tagline")}</p>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <span className="text-sm text-muted">{t("theme")}</span>
          </div>
        </div>
        {groups.map((g) => (
          <nav key={g.title} aria-label={g.title}>
            <h2 className="text-sm font-semibold">{g.title}</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {g.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-muted transition hover:text-brand">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-5 text-sm text-muted md:flex-row md:items-center md:justify-between">
          <p>{t("copyright", { year: new Date().getFullYear() })}</p>
          {testMode && <ApiStatus compact />}
        </div>
      </div>
    </footer>
  );
}
