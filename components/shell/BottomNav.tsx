import Link from "next/link";
import { useTranslations } from "next-intl";
import { Icon, type IconName } from "@/components/ui/Icon";

// UI-GLB-11: phone bottom navigation (hidden from md up).
export function BottomNav() {
  const t = useTranslations("shell");
  const items: { href: string; label: string; icon: IconName }[] = [
    { href: "/", label: t("home"), icon: "home" },
    { href: "/categories", label: t("categories"), icon: "grid" },
    { href: "/cart", label: t("cart"), icon: "cart" },
    { href: "/account", label: t("account"), icon: "user" },
  ];
  return (
    <nav
      aria-label={t("mobileNav")}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface md:hidden"
    >
      <ul className="grid grid-cols-4">
        {items.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className="flex flex-col items-center gap-0.5 py-2 text-xs">
              <Icon name={item.icon} />
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
