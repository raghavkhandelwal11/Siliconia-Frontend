"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { api, unwrap } from "@/lib/api/client";
import { Icon } from "@/components/ui/Icon";
import { CategoryTile } from "./CategoryIcon";

// UI-GLB-02: category menu in the desktop header. It loads the tree the first
// time it is opened. On phones the bottom bar links to /categories instead.
export function CategoryMenu() {
  const t = useTranslations();
  const menu = useRef<HTMLDetailsElement>(null);
  const [open, setOpen] = useState(false);
  const tree = useQuery({
    queryKey: ["categories"],
    queryFn: async () => unwrap(await api.GET("/categories")).categories,
    enabled: open,
    staleTime: 5 * 60_000,
  });
  const close = () => {
    menu.current?.removeAttribute("open");
    setOpen(false);
  };

  return (
    <details
      ref={menu}
      className="relative hidden md:block"
      onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}
    >
      <summary className="inline-flex min-h-10 cursor-pointer list-none items-center gap-1.5 rounded-full px-3 text-sm font-medium transition hover:bg-brand-soft hover:text-brand">
        <Icon name="grid" size={18} />
        {t("shell.categories")}
      </summary>
      <div className="menu-panel absolute left-0 z-50 mt-3 w-[min(58rem,calc(100vw-2rem))] rounded-3xl border border-line bg-elevated p-6 shadow-lift">
        {tree.isPending && (
          <div className="grid grid-cols-3 gap-6" aria-label={t("categories.loading")}>
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="space-y-2">
                <div className="skeleton h-6 w-40" />
                <div className="skeleton h-4 w-28" />
                <div className="skeleton h-4 w-32" />
              </div>
            ))}
          </div>
        )}
        {tree.isError && <p className="text-danger">{t("categories.unavailable")}</p>}
        {tree.data && (
          <ul className="grid grid-cols-3 gap-x-6 gap-y-4">
            {tree.data.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/c/${c.slug}`}
                  onClick={close}
                  className="flex items-center gap-2.5 font-semibold transition hover:text-brand"
                >
                  <CategoryTile icon={c.icon} size={30} />
                  {c.name}
                </Link>
                <ul className="mt-1.5 space-y-1 pl-10 text-sm">
                  {(c.children ?? []).map((s) => (
                    <li key={s.id}>
                      <Link href={`/c/${s.slug}`} onClick={close} className="text-muted transition hover:text-brand">
                        {s.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
        <Link
          href="/categories"
          onClick={close}
          className="mt-4 inline-block text-sm font-semibold text-accent underline"
        >
          {t("categories.viewAll")}
        </Link>
      </div>
    </details>
  );
}
