import { connection } from "next/server";
import { getTranslations } from "next-intl/server";
import { Hero } from "@/components/home/Hero";
import { Highlights } from "@/components/home/Highlights";
import { CategoryStrip } from "@/components/home/CategoryStrip";
import { SellBand } from "@/components/home/SellBand";
import { TrustStrip } from "@/components/home/TrustStrip";
import { ProductRail } from "@/components/listing/ProductRail";
import { HomeRails } from "@/components/m4/CardRail";
import { fetchCategoryTree } from "@/lib/catalogue";
import { fetchListing } from "@/lib/search";

const rail = async (query: string) => {
  const r = await fetchListing(new URLSearchParams(`${query}&pageSize=10`));
  return r && r !== "not-found" ? r.items : [];
};

// UI-PUB-01/02, home v1: product rails from live listings. Products of the
// week (weekly job), launch countdown (M3) and personal picks come later.
export default async function HomePage() {
  await connection(); // per request; the data below is cached for 30 s to 5 min
  const [t, categories, popular, local, fresh] = await Promise.all([
    getTranslations("home.rails"),
    fetchCategoryTree(),
    rail("sort=popular&inStock=true"),
    rail("local=true&sort=popular"),
    rail("sort=newest"),
  ]);
  return (
    <div className="space-y-16">
      <Hero />
      <ProductRail eyebrow={t("popularEyebrow")} title={t("popular")} items={popular} href="/search?sort=popular" />
      <HomeRails week={t("week")} forYou={t("forYou")} />
      <Highlights />
      <ProductRail eyebrow={t("localEyebrow")} title={t("local")} items={local} href="/search?local=true" />
      <CategoryStrip categories={categories} />
      <ProductRail eyebrow={t("newEyebrow")} title={t("new")} items={fresh} href="/search?sort=newest" />
      <SellBand />
      <TrustStrip />
    </div>
  );
}
