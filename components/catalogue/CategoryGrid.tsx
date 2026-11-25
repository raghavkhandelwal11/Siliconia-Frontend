import Link from "next/link";
import { useTranslations } from "next-intl";
import type { CategoryNode } from "@/lib/catalogue";
import { CategoryIcon } from "./CategoryIcon";

const SHOWN = 5;

// UI-PUB: the "All categories" page (FR-CAT-04).
export function CategoryGrid({ categories }: { categories: CategoryNode[] }) {
  const t = useTranslations("categories");
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((c) => {
        const children = c.children ?? [];
        return (
          <li key={c.id} className="rounded-2xl border border-line bg-surface p-5">
            <h2 className="flex items-center gap-3 text-lg font-semibold">
              <span className="inline-flex size-10 items-center justify-center rounded-full bg-bg text-brand">
                <CategoryIcon icon={c.icon} />
              </span>
              <Link href={`/c/${c.slug}`} className="hover:underline">
                {c.name}
              </Link>
            </h2>
            <ul className="mt-3 space-y-1 text-sm">
              {children.slice(0, SHOWN).map((s) => (
                <li key={s.id}>
                  <Link href={`/c/${s.slug}`} className="text-muted hover:text-ink hover:underline">
                    {s.name}
                  </Link>
                </li>
              ))}
            </ul>
            <Link href={`/c/${c.slug}`} className="mt-3 inline-block text-sm font-semibold text-accent underline">
              {children.length > SHOWN ? t("seeAll", { count: children.length }) : t("open", { name: c.name })}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
