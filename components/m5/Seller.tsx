"use client";

import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import { rupees } from "@/lib/checkout";
import { useAct, useGet } from "@/lib/m4";
import { csvUrl, m5, type LegalDoc } from "@/lib/m5";
import { useSession } from "@/lib/auth/session";
import { Alert, Button, Card } from "@/components/ui/Form";
import { StatusChip } from "@/components/ui/StatusChip";

// /seller/payouts (UI-SEL-09): weekly payouts and statements.
export function SellerPayouts() {
  const t = useTranslations("m5.sellerPayouts");
  const format = useFormatter();
  const rows = useGet(["seller-payouts"], m5.sellerPayouts);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <p className="text-muted">{t("help")}</p>
      {rows.isError && <Alert>{t("loadError")}</Alert>}
      {(rows.data ?? []).map((p) => (
        <Card key={p.id}>
          <div className="flex flex-wrap items-center gap-3">
            <strong className="text-xl">{rupees(p.netPaise)}</strong>
            <StatusChip tone={p.status === "PAID" ? "success" : p.status === "FAILED" ? "danger" : "warning"}>
              {t(`status.${p.status}`)}
            </StatusChip>
            <span className="text-muted">{format.dateTime(new Date(p.createdAt), { dateStyle: "medium" })}</span>
          </div>
          <p className="mt-2 text-sm text-muted">
            {t("breakdown", {
              gross: rupees(p.grossPaise),
              commission: rupees(p.commissionPaise),
              tds: rupees(p.tdsPaise),
            })}
          </p>
          {p.bankRef && <p className="text-sm">{t("bankRef", { ref: p.bankRef })}</p>}
          {p.failureReason && <Alert>{t("failed", { reason: p.failureReason })}</Alert>}
          <a
            className="mt-2 inline-block font-semibold text-accent underline"
            href={csvUrl(`/seller/payouts/${p.id}/statement.csv`)}
          >
            {t("statement")}
          </a>
        </Card>
      ))}
      {rows.data?.length === 0 && <p className="text-muted">{t("none")}</p>}
    </div>
  );
}

// Asks a signed-in account to accept new terms or privacy versions.
export function LegalPrompt() {
  const t = useTranslations("m5.legal");
  const session = useSession();
  const signedIn = !!session.data;
  const pending = useGet<LegalDoc[]>(["legal-pending"], m5.pendingLegal, signedIn);
  const accept = useAct((ids: string[]) => m5.acceptLegal(ids), [["legal-pending"]]);
  const docs = pending.data ?? [];
  if (!signedIn || docs.length === 0) return null;
  return (
    <div role="region" aria-label={t("label")} className="card mb-4 border-brand p-4">
      <p className="font-semibold">{t("updated")}</p>
      <ul className="my-2 list-disc pl-5">
        {docs.map((d) => (
          <li key={d.id}>
            <Link className="text-accent underline" href={`/legal/${d.kind.toLowerCase()}`}>
              {d.title}
            </Link>{" "}
            ({t("version", { version: d.version })})
          </li>
        ))}
      </ul>
      <Button onClick={() => accept.mutate(docs.map((d) => d.id))} disabled={accept.isPending}>
        {t("accept")}
      </Button>
    </div>
  );
}

// /legal/[kind]: the current version of a legal document.
export function LegalPage({ kind }: { kind: string }) {
  const t = useTranslations("m5.legal");
  const format = useFormatter();
  const doc = useGet<LegalDoc>(["legal", kind], () => m5.legal(kind.toUpperCase()));
  if (doc.isPending) return <div className="skeleton h-64" />;
  if (!doc.data) return <Alert>{t("missing")}</Alert>;
  return (
    <article className="prose max-w-3xl space-y-3">
      <h1 className="text-2xl font-bold">{doc.data.title}</h1>
      <p className="text-sm text-muted">
        {t("versionDate", {
          version: doc.data.version,
          date: format.dateTime(new Date(doc.data.publishedAt), { dateStyle: "long" }),
        })}
      </p>
      <div className="whitespace-pre-wrap">{doc.data.bodyMd}</div>
    </article>
  );
}
