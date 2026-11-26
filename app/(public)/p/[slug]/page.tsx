import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { fetchProduct, fetchSimilar } from "@/lib/pdp";
import { Gallery } from "@/components/pdp/Gallery";
import { BuyBox } from "@/components/pdp/BuyBox";
import { MainSpecs, SpecTable } from "@/components/pdp/Specs";
import { ProductRail } from "@/components/listing/ProductRail";
import { ProductCommunity } from "@/components/m4/ProductCommunity";
import { Alert } from "@/components/ui/Form";
import { Icon } from "@/components/ui/Icon";

type Props = { params: Promise<{ slug: string }> };

// Static parts revalidate every 60 s (ISR); price, stock and actions load live.
export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await fetchProduct((await params).slug);
  if (!p || p === "not-found") return {};
  return {
    title: p.name,
    description: p.description.slice(0, 160),
    openGraph: {
      title: p.name,
      description: p.description.slice(0, 160),
      images: p.images[0] ? [p.images[0].url] : [],
    },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const [p, t] = await Promise.all([fetchProduct(slug), getTranslations("pdp")]);
  if (p === "not-found") notFound();
  if (!p) return <Alert>{t("loadError")}</Alert>;
  const similar = await fetchSimilar(p.id);
  const low = Math.min(...p.variants.map((v) => v.pricePaise));
  // Structured data so search engines show price and availability.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    brand: { "@type": "Brand", name: p.brand },
    description: p.description,
    image: p.images.map((i) => i.url),
    sku: p.variants[0]?.sku,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "INR",
      lowPrice: (low / 100).toFixed(2),
      offerCount: p.variants.length,
    },
  };

  return (
    <article className="space-y-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <nav aria-label={t("breadcrumb")} className="text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-1">
          {p.category.parentSlug && (
            <li>
              <Link href={`/c/${p.category.parentSlug}`} className="hover:text-brand">
                {p.category.parentName}
              </Link>
              <span aria-hidden="true"> / </span>
            </li>
          )}
          <li>
            <Link href={`/c/${p.category.slug}`} className="hover:text-brand">
              {p.category.name}
            </Link>
          </li>
        </ol>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1.05fr_1fr]">
        <div className="rise lg:sticky lg:top-24 lg:self-start">
          <Gallery images={p.images} name={p.name} />
        </div>
        <div className="rise space-y-5" style={{ animationDelay: "80ms" }}>
          <div>
            <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-brand">
              <Link href={`/search?brand=${encodeURIComponent(p.brand)}`} className="hover:underline">
                {p.brand}
              </Link>
              {p.isLocal && (
                <span className="rounded-full bg-gold-soft px-2 py-0.5 text-xs text-gold">{t("local")}</span>
              )}
            </p>
            <h1 className="mt-1 text-2xl font-bold leading-tight sm:text-3xl">{p.name}</h1>
            <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted">
              {p.ratingCount > 0 ? (
                <>
                  <Icon name="star" size={16} filled className="text-gold" />
                  <span className="font-semibold text-ink">{p.ratingAvg.toFixed(1)}</span> ({p.ratingCount})
                </>
              ) : (
                t("noReviews")
              )}
            </p>
          </div>
          <MainSpecs specs={p.specs} />
          <div className="card p-5">
            <BuyBox product={p} />
          </div>
          <div className="card flex items-center gap-3 p-4">
            <span className="bg-brand-gradient inline-flex size-11 items-center justify-center rounded-xl text-white">
              <Icon name="store" size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted">{t("soldBy")}</p>
              <p className="flex items-center gap-1.5 font-semibold">
                {p.seller.storeName}
                {p.seller.verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-xs text-brand">
                    <Icon name="shield" size={12} />
                    {t("verified")}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-6" aria-labelledby="about">
          <h2 id="about" className="text-lg font-semibold">
            {t("about")}
          </h2>
          <p className="mt-3 whitespace-pre-line leading-relaxed text-muted">{p.description}</p>
        </section>
        <section className="card p-6" aria-labelledby="specs">
          <h2 id="specs" className="text-lg font-semibold">
            {t("specsTitle")}
          </h2>
          <div className="mt-2">
            <SpecTable product={p} />
          </div>
        </section>
      </div>

      <ProductCommunity productId={p.id} />
      <ProductRail title={t("similar")} items={similar} href={`/c/${p.category.slug}`} />
    </article>
  );
}
