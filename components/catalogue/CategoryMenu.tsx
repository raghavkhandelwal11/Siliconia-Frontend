"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { api, unwrap } from "@/lib/api/client";
import { Icon } from "@/components/ui/Icon";
import { CategoryIcon } from "./CategoryIcon";

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
      <summary className="inline-flex min-h-10 cursor-pointer list-none items-center gap-1.5 rounded-full px-2 text-sm font-medium hover:bg-bg">
        <Icon name="grid" size={18} />
        {t("shell.categories")}
      </summary>
      <div className="absolute left-0 z-50 mt-2 w-[min(56rem,calc(100vw-2rem))] rounded-2xl border border-line bg-surface p-5 shadow-lg">
        {tree.isPending && <p className="text-muted">{t("categories.loading")}</p>}
        {tree.isError && <p className="text-danger">{t("categories.unavailable")}</p>}
        {tree.data && (
          <ul className="grid grid-cols-3 gap-x-6 gap-y-4">
            {tree.data.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/c/${c.slug}`}
                  onClick={close}
                  className="flex items-center gap-2 font-semibold hover:underline"
                >
                  <CategoryIcon icon={c.icon} size={18} />
                  {c.name}
                </Link>
                <ul className="mt-1 space-y-0.5 pl-7 text-sm">
                  {(c.children ?? []).map((s) => (
                    <li key={s.id}>
                      <Link href={`/c/${s.slug}`} onClick={close} className="text-muted hover:text-ink hover:underline">
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
