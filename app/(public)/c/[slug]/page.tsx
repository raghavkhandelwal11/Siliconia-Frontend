import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getTranslations } from "next-intl/server";
import { CategoryOverview } from "@/components/catalogue/CategoryOverview";
import { fetchCategory } from "@/lib/catalogue";
import { Alert } from "@/components/ui/Form";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = await fetchCategory((await params).slug);
  return { title: c && c !== "not-found" ? c.name : (await getTranslations("categories"))("title") };
}

export default async function Page({ params }: Props) {
  await connection();
  const category = await fetchCategory((await params).slug);
  if (category === "not-found") notFound();
  if (!category) return <Alert>{(await getTranslations("categories"))("unavailable")}</Alert>;
  return <CategoryOverview category={category} />;
}
