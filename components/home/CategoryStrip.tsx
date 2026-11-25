import Link from "next/link";
import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";
import type { CategoryNode } from "@/lib/catalogue";
import { Icon } from "@/components/ui/Icon";
import { CategoryTile } from "@/components/catalogue/CategoryIcon";

// Shop by category: all 12 as colour tiles.
export function CategoryStrip({ categories }: { categories: CategoryNode[] | null }) {
  const t = useTranslations("home.categories");
  return (
    <section aria-labelledby="shop-by-category">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 id="shop-by-category" className="text-2xl font-bold sm:text-3xl">
          {t("title")}
        </h2>
        <Link href="/categories" className="group inline-flex items-center gap-1 text-sm font-semibold text-brand">
          {t("all")}
          <Icon name="arrow" size={16} className="transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
      {categories ? (
        <ul className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {categories.map((c, i) => (
            <li key={c.id} className="rise" style={{ "--d": `${i * 35}ms` } as CSSProperties}>
              <Link
                href={`/c/${c.slug}`}
                className="card card-hover group flex h-full flex-col items-center gap-3 p-4 text-center"
              >
                <CategoryTile icon={c.icon} size={52} className="group-hover:scale-110" />
                <span className="text-sm font-medium leading-tight">{c.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6" aria-label={t("loading")}>
          {Array.from({ length: 12 }, (_, i) => (
            <li key={i} className="card flex flex-col items-center gap-3 p-4">
              <div className="skeleton size-13" />
              <div className="skeleton h-4 w-20" />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
