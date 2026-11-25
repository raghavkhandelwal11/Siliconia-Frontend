import Link from "next/link";
import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";
import type { CategoryNode } from "@/lib/catalogue";
import { Icon } from "@/components/ui/Icon";
import { CategoryTile } from "./CategoryIcon";

const SHOWN = 5;

// The "All categories" page (FR-CAT-04): colour-coded cards that rise in turn.
export function CategoryGrid({ categories }: { categories: CategoryNode[] }) {
  const t = useTranslations("categories");
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((c, i) => {
        const children = c.children ?? [];
        return (
          <li key={c.id} className="rise" style={{ "--d": `${i * 45}ms` } as CSSProperties}>
            <div className="card card-hover group flex h-full flex-col p-5">
              <h2 className="flex items-center gap-3 text-lg font-semibold">
                <CategoryTile icon={c.icon} className="group-hover:scale-110" />
                <Link href={`/c/${c.slug}`} className="after:absolute after:inset-0 hover:text-brand">
                  {c.name}
                </Link>
              </h2>
              <ul className="relative mt-4 flex flex-wrap gap-1.5 text-sm">
                {children.slice(0, SHOWN).map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/c/${s.slug}`}
                      className="inline-block rounded-full border border-line px-2.5 py-1 text-muted transition hover:border-brand/40 hover:bg-brand-soft hover:text-brand"
                    >
                      {s.name}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href={`/c/${c.slug}`}
                className="relative mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-brand"
              >
                {children.length > SHOWN ? t("seeAll", { count: children.length }) : t("open", { name: c.name })}
                <Icon name="arrow" size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
