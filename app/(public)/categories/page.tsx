import type { Metadata } from "next";
import { connection } from "next/server";
import { getTranslations } from "next-intl/server";
import { CategoryGrid } from "@/components/catalogue/CategoryGrid";
import { fetchCategoryTree } from "@/lib/catalogue";
import { Alert } from "@/components/ui/Form";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("categories"))("title") };
}

export default async function Page() {
  await connection(); // render per request (data is cached for 5 minutes), never at build time
  const [t, tree] = await Promise.all([getTranslations("categories"), fetchCategoryTree()]);
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted">{t("intro")}</p>
      </header>
      {tree ? <CategoryGrid categories={tree} /> : <Alert>{t("unavailable")}</Alert>}
    </div>
  );
}
