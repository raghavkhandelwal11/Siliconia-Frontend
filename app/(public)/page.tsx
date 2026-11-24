import { useTranslations } from "next-intl";
import { ApiStatus } from "@/components/system/ApiStatus";

export default function HomePage() {
  const t = useTranslations("home");
  return (
    <section className="rounded-2xl bg-surface p-8 shadow-sm">
      <h1 className="text-3xl font-bold tracking-tight text-brand">{t("title")}</h1>
      <p className="mt-2 max-w-prose text-muted">{t("intro")}</p>
      <div className="mt-6">
        <ApiStatus />
      </div>
    </section>
  );
}
