import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { buttonClass } from "@/components/ui/Form";

export const metadata: Metadata = { title: "Page not found" };

// Any unknown URL: say so in the app's own shell and offer a way back.
export default async function NotFound() {
  const t = await getTranslations("notFound");
  return (
    <div className="card rise mx-auto max-w-lg p-10 text-center">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <p className="mt-2 text-muted">{t("body")}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/" className={buttonClass("primary")}>
          {t("home")}
        </Link>
        <Link href="/categories" className={buttonClass("secondary")}>
          {t("browse")}
        </Link>
      </div>
    </div>
  );
}
