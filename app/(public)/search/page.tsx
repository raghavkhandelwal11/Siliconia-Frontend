import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { Listing } from "@/components/listing/Listing";
import { fetchListing, listingParams } from "@/lib/search";
import { Alert } from "@/components/ui/Form";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const q = (await searchParams).q;
  const t = await getTranslations("listing");
  return { title: q ? t("resultsFor", { q: String(q) }) : t("searchTitle") };
}

// /search?q=…: results across every category (UI-PUB-03).
export default async function Page({ searchParams }: Props) {
  await connection();
  const raw = await searchParams;
  const t = await getTranslations("listing");
  const result = await fetchListing(listingParams(raw));
  if (!result || result === "not-found") return <Alert>{t("loadError")}</Alert>;
  const q = typeof raw.q === "string" ? raw.q : "";
  return (
    <Suspense>
      <Listing result={result} title={q ? t("resultsFor", { q }) : t("allProducts")} />
    </Suspense>
  );
}
