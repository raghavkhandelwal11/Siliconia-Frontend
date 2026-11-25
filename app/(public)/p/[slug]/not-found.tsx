import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { buttonClass } from "@/components/ui/Form";

export default async function NotFound() {
  const t = await getTranslations("pdp");
  return (
    <div className="card rise mx-auto max-w-lg p-10 text-center">
      <h1 className="text-2xl font-bold">{t("notFoundTitle")}</h1>
      <p className="mt-2 text-muted">{t("notFoundBody")}</p>
      <Link href="/categories" className={buttonClass("primary", "mt-6")}>
        {t("browse")}
      </Link>
    </div>
  );
}
