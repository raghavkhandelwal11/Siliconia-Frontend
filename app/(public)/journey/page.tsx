import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { buttonClass } from "@/components/ui/Form";
import { Icon, type IconName } from "@/components/ui/Icon";

export const metadata: Metadata = { title: "Our journey" };

type Stage = { title: string; body: string; points: string[] };
type Problem = { problem: string; fix: string };
type Status = { label: string; text: string };

// One icon and hue per stage, in order.
const stageLook: [IconName, number][] = [
  ["flag", 248],
  ["info", 200],
  ["grid", 170],
  ["shield", 140],
  ["store", 30],
  ["rocket", 290],
  ["check", 150],
];

// /journey: how Siliconics was planned, built and tested, and what we fixed on the way.
export default async function JourneyPage() {
  const t = await getTranslations("journey");
  const stages = t.raw("stages") as Stage[];
  const problems = t.raw("problems") as Problem[];
  const status = t.raw("status") as Status[];
  return (
    <article className="space-y-14">
      <header className="rise max-w-3xl">
        <p className="text-sm font-semibold text-brand">{t("eyebrow")}</p>
        <h1 className="mt-1 text-3xl font-extrabold sm:text-4xl">
          <span className="text-gradient">{t("title")}</span>
        </h1>
        <p className="mt-3 text-lg text-muted">{t("intro")}</p>
      </header>

      <section aria-labelledby="stages">
        <h2 id="stages" className="mb-6 text-2xl font-bold">
          {t("stagesTitle")}
        </h2>
        <ol className="relative space-y-6 border-l-2 border-line pl-6 sm:pl-8">
          {stages.map((s, i) => {
            const [icon, hue] = stageLook[i % stageLook.length];
            return (
              <li key={s.title} className="relative">
                <span
                  aria-hidden
                  className="icon-tile absolute -left-[2.6rem] top-4 size-9 sm:-left-[3.1rem]"
                  style={{ "--hue": hue } as React.CSSProperties}
                >
                  <Icon name={icon} size={18} />
                </span>
                <div className="card p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <h3 className="text-lg font-semibold">{s.title}</h3>
                  <p className="mt-1 text-muted">{s.body}</p>
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
                    {s.points.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <section aria-labelledby="problems">
        <h2 id="problems" className="text-2xl font-bold">
          {t("problemsTitle")}
        </h2>
        <p className="mt-1 max-w-3xl text-muted">{t("problemsIntro")}</p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {problems.map((p) => (
            <div key={p.problem} className="card space-y-3 p-5">
              <p className="text-sm">
                <span className="mr-2 inline-flex items-center gap-1 font-semibold text-danger">
                  <Icon name="alert" size={16} />
                  {t("problemLabel")}
                </span>
                {p.problem}
              </p>
              <p className="text-sm">
                <span className="mr-2 inline-flex items-center gap-1 font-semibold text-success">
                  <Icon name="check" size={16} />
                  {t("fixLabel")}
                </span>
                {p.fix}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="status" className="card p-6">
        <h2 id="status" className="text-2xl font-bold">
          {t("statusTitle")}
        </h2>
        <dl className="mt-4 space-y-3">
          {status.map((s) => (
            <div key={s.label} className="flex flex-col gap-1 sm:flex-row sm:gap-4">
              <dt className="w-20 shrink-0 font-semibold text-brand">{s.label}</dt>
              <dd className="text-muted">{s.text}</dd>
            </div>
          ))}
        </dl>
        <Link href="/" className={buttonClass("primary", "mt-6")}>
          {t("cta")}
        </Link>
      </section>
    </article>
  );
}
