import Link from "next/link";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/Icon";
import { AccountMenu } from "@/components/auth/AccountMenu";
import { CategoryMenu } from "@/components/catalogue/CategoryMenu";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

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
        <form role="search" action="/search" className="group mx-1 flex min-w-0 flex-1 sm:mx-2">
          <label htmlFor="site-search" className="sr-only">
            {t("shell.search")}
          </label>
          <div className="flex w-full items-center rounded-full border border-line bg-bg px-3 transition focus-within:border-brand focus-within:bg-surface focus-within:shadow-card">
            <Icon name="search" size={18} className="shrink-0 text-muted" />
            <input
              id="site-search"
              name="q"
              type="search"
              placeholder={t("shell.searchPlaceholder")}
              className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm outline-none"
            />
          </div>
          <button type="submit" className="sr-only">
            {t("shell.search")}
          </button>
        </form>
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
          <Link href="/cart" className={`${iconLink} inline-flex`} aria-label={t("shell.cart")}>
            <Icon name="cart" />
          </Link>
          <AccountMenu />
        </nav>
      </div>
    </header>
  );
}
