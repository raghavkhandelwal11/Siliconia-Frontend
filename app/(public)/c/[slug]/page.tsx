import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense, type CSSProperties } from "react";
import { getTranslations } from "next-intl/server";
import { Listing } from "@/components/listing/Listing";
import { CategoryTile, hueFor } from "@/components/catalogue/CategoryIcon";
import { fetchCategory } from "@/lib/catalogue";
import { fetchListing, listingParams } from "@/lib/search";
import { Alert } from "@/components/ui/Form";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = await fetchCategory((await params).slug);
  return { title: c && c !== "not-found" ? c.name : (await getTranslations("categories"))("title") };
}

// /c/[slug]: a category header, its sub-categories, then the listing (UI-PUB-03).
export default async function Page({ params, searchParams }: Props) {
  await connection();
  const { slug } = await params;
  const [category, t, tl] = await Promise.all([
    fetchCategory(slug),
    getTranslations("categories"),
    getTranslations("listing"),
  ]);
  if (category === "not-found") notFound();
  if (!category) return <Alert>{t("unavailable")}</Alert>;
  const result = await fetchListing(listingParams(await searchParams, { category: slug }));
  if (result === "not-found") notFound();
  const icon = category.icon || category.parent?.icon;

  return (
    <div className="space-y-6">
      <nav aria-label={t("breadcrumb")} className="text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-1">
          <li>
            <Link href="/categories" className="hover:text-brand">
              {t("title")}
            </Link>
          </li>
          {category.parent && (
            <li>
              <span aria-hidden="true"> / </span>
              <Link href={`/c/${category.parent.slug}`} className="hover:text-brand">
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
      <header className="card rise relative overflow-hidden p-6" style={{ "--hue": hueFor(icon) } as CSSProperties}>
        <div
          aria-hidden="true"
          className="glow-orb -right-16 -top-20 size-64"
          style={{ background: "hsl(var(--hue) 85% 60% / 0.2)" }}
        />
        <div className="relative flex items-center gap-4">
          <CategoryTile icon={icon} size={52} />
          <div>
            <p className="text-sm text-muted">{category.examples || category.parent?.name}</p>
            <p className="text-2xl font-bold">{category.name}</p>
          </div>
        </div>
        {category.children.length > 0 && (
          <ul className="relative mt-4 flex flex-wrap gap-2">
            {category.children.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/c/${s.slug}`}
                  className="inline-block rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-medium transition hover:border-brand/40 hover:bg-brand-soft hover:text-brand"
                >
                  {s.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </header>
      {result ? (
        <Suspense>
          <Listing
            result={result}
            title={category.name}
            subtitle={tl("count", { n: result.total })}
            fixed={{ category: slug }}
            titleHidden
          />
        </Suspense>
      ) : (
        <Alert>{tl("loadError")}</Alert>
      )}
    </div>
  );
}
