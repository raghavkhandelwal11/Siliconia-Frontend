import { useTranslations } from "next-intl";

// Placeholder for route groups that later milestones fill in.
export function ComingSoon({ section, milestone }: { section: string; milestone: string }) {
  const t = useTranslations();
  const name = t(`sections.${section}`);
  return (
    <section className="rounded-2xl border border-dashed border-line bg-surface p-8">
      <h1 className="text-2xl font-bold text-brand">{t("comingSoon.title", { section: name, milestone })}</h1>
      <p className="mt-2 max-w-prose text-muted">{t("comingSoon.body")}</p>
    </section>
  );
}
