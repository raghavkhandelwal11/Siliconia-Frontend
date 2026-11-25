import { connection } from "next/server";
import { Hero } from "@/components/home/Hero";
import { Highlights } from "@/components/home/Highlights";
import { CategoryStrip } from "@/components/home/CategoryStrip";
import { SellBand } from "@/components/home/SellBand";
import { TrustStrip } from "@/components/home/TrustStrip";
import { fetchCategoryTree } from "@/lib/catalogue";

// UI-PUB-01/02, first version: product sections (products of the week, local
// picks, trending) join in T1.8 once products exist.
export default async function HomePage() {
  await connection(); // per request; the category tree itself is cached for 5 minutes
  const categories = await fetchCategoryTree();
  return (
    <div className="space-y-16">
      <Hero />
      <Highlights />
      <CategoryStrip categories={categories} />
      <SellBand />
      <TrustStrip />
    </div>
  );
}
