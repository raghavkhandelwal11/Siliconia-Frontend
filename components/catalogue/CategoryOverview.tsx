import Link from "next/link";
import { useTranslations } from "next-intl";
import type { CategoryDetail } from "@/lib/catalogue";
import type { CSSProperties } from "react";
import { CategoryTile, hueFor } from "./CategoryIcon";

// /c/[slug]: a top-level category lists its sub-categories; a sub-category
// shows what shoppers can filter by. Product listings arrive with search (T1.7).
export function CategoryOverview({ category }: { category: CategoryDetail }) {
  const t = useTranslations("categories");
  const filters = category.specSchema.fields.filter((f) => f.filter);
  return (
    <div className="space-y-6">
      <nav aria-label={t("breadcrumb")} className="text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-1">
          <li>
            <Link href="/categories" className="hover:underline">
              {t("title")}
            </Link>
          </li>
          {category.parent && (
            <li>
              <span aria-hidden="true"> / </span>
              <Link href={`/c/${category.parent.slug}`} className="hover:underline">
                {category.parent.name}
              </Link>
            </li>
          )}
          <li aria-current="page">
            <span aria-hidden="true"> / </span>
            {category.name}
          </li>
        </ol>
      </nav>

      <header
        className="card rise relative overflow-hidden p-6 sm:p-8"
        style={{ "--hue": hueFor(category.icon ?? category.parent?.icon) } as CSSProperties}
      >
        <div
          aria-hidden="true"
          className="glow-orb -right-16 -top-20 size-64"
          style={{ background: "hsl(var(--hue) 85% 60% / 0.22)" }}
        />
        <div className="relative flex items-center gap-4">
          <CategoryTile icon={category.icon ?? category.parent?.icon} size={56} />
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">{category.name}</h1>
            {category.examples && <p className="mt-1 text-muted">{category.examples}</p>}
          </div>
        </div>
      </header>

      {category.children.length > 0 && (
        <section aria-labelledby="subcats">
          <h2 id="subcats" className="text-lg font-semibold">
            {t("subcategories")}
          </h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {category.children.map((s, i) => (
              <li key={s.id} className="rise" style={{ "--d": `${i * 40}ms` } as CSSProperties}>
                <Link href={`/c/${s.slug}`} className="card card-hover flex h-full flex-col p-4">
                  <span className="font-semibold">{s.name}</span>
                  {s.examples && <span className="mt-1 text-sm text-muted">{s.examples}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {filters.length > 0 && (
        <section aria-labelledby="filters">
          <h2 id="filters" className="text-lg font-semibold">
            {t("filterBy")}
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {filters.map((f) => (
              <li
                key={f.key}
                className="rounded-full border border-line bg-surface px-3 py-1 text-sm transition hover:border-brand/40 hover:bg-brand-soft"
              >
                {f.unit ? `${f.label} (${f.unit})` : f.label}
              </li>
            ))}
          </ul>
        </section>
      )}

      {category.parent && (
        <section className="rounded-3xl border border-dashed border-line bg-surface/60 p-8 text-center">
          <h2 className="text-lg font-semibold">{t("noProducts")}</h2>
          <p className="mt-1 text-muted">{t("noProductsBody")}</p>
        </section>
      )}
    </div>
  );
}
