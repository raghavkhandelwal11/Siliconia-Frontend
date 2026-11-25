import Link from "next/link";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/Icon";
import { AccountMenu } from "@/components/auth/AccountMenu";
import { CategoryMenu } from "@/components/catalogue/CategoryMenu";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { SearchBox } from "@/components/listing/SearchBox";
import { CartButton } from "@/components/cart/CartButton";

// UI-GLB-01/02: logo, categories, search, theme, wishlist, notifications, cart
// and account. Sticky frosted glass so content scrolls softly underneath.
export function Header() {
  const t = useTranslations();
  // Display is set per link so "hidden md:inline-flex" is never overridden.
  const iconLink = "size-10 items-center justify-center rounded-full text-muted transition hover:bg-bg hover:text-ink";
  return (
    <header className="glass sticky top-0 z-40 border-b border-line">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2.5 sm:gap-3">
        <Logo label={t("app.name")} />
        <CategoryMenu />
        <SearchBox />
        <nav aria-label={t("shell.mainNav")} className="flex items-center gap-0.5">
          <ThemeToggle className="hidden md:inline-flex" />
          <Link
            href="/account/wishlist"
            className={`${iconLink} hidden md:inline-flex`}
            aria-label={t("shell.wishlist")}
          >
            <Icon name="heart" />
          </Link>
          <Link
            href="/account/notifications"
            className={`${iconLink} hidden md:inline-flex`}
            aria-label={t("shell.notifications")}
          >
            <Icon name="bell" />
          </Link>
          <CartButton />
          <AccountMenu />
        </nav>
      </div>
    </header>
  );
}
