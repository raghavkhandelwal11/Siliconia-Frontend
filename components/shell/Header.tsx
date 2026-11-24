import Link from "next/link";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/Icon";
import { AccountMenu } from "@/components/auth/AccountMenu";

// UI-GLB-01/02: logo, search, categories, wishlist, notifications, cart and
// account. Counts and the bell's live updates arrive with M1–M2.
export function Header() {
  const t = useTranslations();
  const iconLink = "inline-flex size-10 items-center justify-center rounded-full hover:bg-bg";
  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <Link href="/" className="text-lg font-bold tracking-tight text-brand">
          {t("app.name")}
        </Link>
        <Link href="/categories" className="hidden items-center gap-1.5 text-sm font-medium md:inline-flex">
          <Icon name="grid" size={18} />
          {t("shell.categories")}
        </Link>
        <form role="search" action="/search" className="mx-2 flex flex-1">
          <label htmlFor="site-search" className="sr-only">
            {t("shell.search")}
          </label>
          <input
            id="site-search"
            name="q"
            type="search"
            placeholder={t("shell.searchPlaceholder")}
            className="w-full rounded-l-full border border-line bg-bg px-4 py-2 text-sm"
          />
          <button type="submit" className="rounded-r-full bg-brand px-3 text-brand-ink" aria-label={t("shell.search")}>
            <Icon name="search" size={18} />
          </button>
        </form>
        <nav aria-label={t("shell.mainNav")} className="flex items-center gap-1">
          <Link
            href="/account/wishlist"
            className={`${iconLink} hidden sm:inline-flex`}
            aria-label={t("shell.wishlist")}
          >
            <Icon name="heart" />
          </Link>
          <Link
            href="/account/notifications"
            className={`${iconLink} hidden sm:inline-flex`}
            aria-label={t("shell.notifications")}
          >
            <Icon name="bell" />
          </Link>
          <Link href="/cart" className={iconLink} aria-label={t("shell.cart")}>
            <Icon name="cart" />
          </Link>
          <AccountMenu />
        </nav>
      </div>
    </header>
  );
}
