import Link from "next/link";
import { useTranslations } from "next-intl";

// UI-GLB-07: programme pages, help, legal and grievance officer.
export function Footer() {
  const t = useTranslations("shell.footer");
  const links = [
    { href: "/for-creators", label: t("forCreators") },
    { href: "/for-promoters", label: t("forPromoters") },
    { href: "/help", label: t("help") },
    { href: "/legal/terms", label: t("legal") },
    { href: "/legal/grievance", label: t("grievance") },
  ];
  return (
    <footer className="mt-12 border-t border-line bg-surface pb-20 md:pb-0">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 md:flex-row md:items-center md:justify-between">
        <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="text-muted hover:text-ink">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        <p className="text-sm text-muted">{t("copyright", { year: new Date().getFullYear() })}</p>
      </div>
    </footer>
  );
}
