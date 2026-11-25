"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Icon, type IconName } from "@/components/ui/Icon";

// UI-GLB-11: phone bottom navigation (hidden from md up); the current section glows.
export function BottomNav() {
  const t = useTranslations("shell");
  const path = usePathname();
  const items: { href: string; label: string; icon: IconName; match: (p: string) => boolean }[] = [
    { href: "/", label: t("home"), icon: "home", match: (p) => p === "/" },
    {
      href: "/categories",
      label: t("categories"),
      icon: "grid",
      match: (p) => p.startsWith("/categories") || p.startsWith("/c/"),
    },
    { href: "/cart", label: t("cart"), icon: "cart", match: (p) => p.startsWith("/cart") },
    { href: "/account", label: t("account"), icon: "user", match: (p) => p.startsWith("/account") },
  ];
  return (
    <nav aria-label={t("mobileNav")} className="glass fixed inset-x-0 bottom-0 z-40 border-t border-line md:hidden">
      <ul className="grid grid-cols-4">
        {items.map((item) => {
          const active = item.match(path);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-0.5 py-2 text-xs transition ${active ? "font-semibold text-brand" : "text-muted"}`}
              >
                <span className={`rounded-full px-4 py-1 transition ${active ? "bg-brand-soft" : ""}`}>
                  <Icon name={item.icon} />
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
