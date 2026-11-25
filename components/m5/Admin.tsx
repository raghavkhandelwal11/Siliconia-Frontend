"use client";

import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { ApiError } from "@/lib/api/client";
import { rupees } from "@/lib/checkout";
import { useAct, useGet, type Row } from "@/lib/m4";
import { csvUrl, m5 } from "@/lib/m5";
import { Alert, Button, Card, Field } from "@/components/ui/Form";
import { StatusChip, type StatusTone } from "@/components/ui/StatusChip";

const str = (v: unknown) => (v == null ? "" : String(v));
const num = (v: unknown) => Number(v ?? 0);
const errText = (e: unknown, fallback: string) => (e instanceof ApiError ? e.message : fallback);
const tone = (s: string): StatusTone =>
  ["PAID", "ACTIVE", "APPLIED", "RELEASED", "APPROVED"].includes(s)
    ? "success"
    : ["FAILED", "SUSPENDED", "REJECTED", "CANCELLED"].includes(s)
      ? "danger"
      : ["PROCESSING", "REQUESTED", "DRAFT"].includes(s)
        ? "warning"
        : "neutral";

function Table({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="text-muted">
          <tr>
            {head.map((h) => (
              <th key={h} className="px-2 py-2 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-line">
              {r.map((c, j) => (
                <td key={j} className="px-2 py-2 align-top">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Empty({ show }: { show: boolean }) {
  const t = useTranslations("m5");
  return show ? <p className="text-muted">{t("empty")}</p> : null;
}

// ---- Overview tiles (UI-ADM-01) ---------------------------------------------------------

export function AdminOverviewTiles() {
  const t = useTranslations("m5.overview");
  const o = useGet(["admin-overview"], m5.overview);
  if (!o.data) return <div className="skeleton h-28" />;
  const d = o.data;
  const tiles: [string, string, string][] = [
    [t("ordersToday"), `${d.ordersToday} · ${rupees(d.revenueToday)}`, "/admin/orders"],
    [t("approvals"), String(d.approvalsWaiting), "/admin/approvals/sellers"],
    [t("issues"), `${d.issuesOpen} (${t("overdue", { count: d.issuesOverdue })})`, "/admin/issues"],
    [t("returns"), String(d.returnsWaiting), "/admin/orders"],
    [t("payouts"), String(d.batchesWaiting), "/admin/payouts"],
    [t("health"), d.openIncidents ? t("incidents", { count: d.openIncidents }) : t("allGood"), "/admin/health"],
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {tiles.map(([label, value, href]) => (
        <Link key={label} href={href} className="card card-hover block p-4">
          <p className="text-sm text-muted">{label}</p>
          <p className="mt-1 text-2xl font-extrabold">{value}</p>
        </Link>
      ))}
    </div>
  );
}

export function AdminNav() {
  const t = useTranslations("m5.nav");
  const links = ["users", "orders", "payouts", "settings", "audit", "health"] as const;
  return (
    <nav aria-label={t("label")} className="flex flex-wrap gap-2">
      {links.map((l) => (
        <Link
          key={l}
          href={`/admin/${l}`}
          className="rounded-full border border-line px-3 py-1.5 text-sm font-medium transition hover:border-brand"
        >
          {t(l)}
        </Link>
      ))}
    </nav>
  );
}

// ---- Users (UI-ADM-05) ------------------------------------------------------------------

export function AdminUsers() {
  const t = useTranslations("m5.users");
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [reason, setReason] = useState("");
  const rows = useGet(["admin-accounts", search], () => m5.accounts(search));
  const act = useAct(m5.setStatus, [["admin-accounts", search]]);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setSearch(q.trim());
        }}
      >
        <Field label={t("search")} value={q} onChange={(e) => setQ(e.target.value)} />
        <Button type="submit">{t("find")}</Button>
      </form>
      <Field label={t("reason")} value={reason} onChange={(e) => setReason(e.target.value)} />
      {act.isError && <Alert>{errText(act.error, t("failed"))}</Alert>}
      <Card>
        <Table
          head={[t("name"), t("role"), t("phone"), t("status"), ""]}
          rows={(rows.data ?? []).map((a) => [
            str(a.name) || "—",
            str(a.role),
            str(a.phone),
            <StatusChip key="s" tone={tone(str(a.status))}>
              {str(a.status)}
            </StatusChip>,
            a.role === "ADMIN" ? null : (
              <Button
                key="b"
                variant="secondary"
                disabled={act.isPending}
                onClick={() => act.mutate({ id: str(a.id), suspend: a.status !== "SUSPENDED", reason })}
              >
                {a.status === "SUSPENDED" ? t("reactivate") : t("suspend")}
              </Button>
            ),
          ])}
        />
        <Empty show={rows.data?.length === 0} />
      </Card>
    </div>
  );
}

// ---- Orders and returns (UI-ADM-06) -----------------------------------------------------

export function AdminOrders() {
  const t = useTranslations("m5.orders");
  const format = useFormatter();
  const [q, setQ] = useState("");
  const orders = useGet(["admin-orders", q], () => m5.orders(q));
  const returns = useGet(["admin-returns"], m5.returns);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <a className="font-semibold text-accent underline" href={csvUrl("/admin/reports/orders.csv")}>
          {t("csv")}
        </a>
      </div>
      <Field label={t("search")} value={q} onChange={(e) => setQ(e.target.value)} />
      <Card>
        <Table
          head={[t("number"), t("placed"), t("status"), t("pay"), t("amount"), t("buyer")]}
          rows={(orders.data ?? []).map((o) => [
            str(o.number),
            format.dateTime(new Date(str(o.placedAt)), { dateStyle: "medium" }),
            <StatusChip key="s" tone={tone(str(o.status))}>
              {str(o.status)}
            </StatusChip>,
            str(o.payMethod),
            rupees(num(o.payablePaise)),
            str(o.buyerName) || str(o.buyerPhone),
          ])}
        />
        <Empty show={orders.data?.length === 0} />
      </Card>
      <h2 className="text-xl font-semibold">{t("returns")}</h2>
      <Card>
        <Table
          head={[t("number"), t("order"), t("product"), t("type"), t("status")]}
          rows={(returns.data ?? []).map((r) => [
            str(r.number),
            str(r.orderNumber),
            str(r.productName),
            str(r.type),
            <StatusChip key="s" tone={tone(str(r.status))}>
              {str(r.status)}
            </StatusChip>,
          ])}
        />
        <Empty show={returns.data?.length === 0} />
      </Card>
    </div>
  );
}

// ---- Payout batches (UI-ADM-07) ---------------------------------------------------------

function BatchDetail({ id }: { id: string }) {
  const t = useTranslations("m5.payouts");
  const rows = useGet(["admin-batch", id], () => m5.batch(id));
  return (
    <Table
      head={[t("store"), t("gross"), t("commission"), t("tds"), t("net"), t("status"), ""]}
      rows={(rows.data ?? []).map((p) => [
        str(p.storeName),
        rupees(num(p.grossPaise)),
        rupees(num(p.commissionPaise)),
        rupees(num(p.tdsPaise)),
        <strong key="n">{rupees(num(p.netPaise))}</strong>,
        <span key="s">
          <StatusChip tone={tone(str(p.status))}>{str(p.status)}</StatusChip>
          {p.failureReason ? <span className="block text-xs text-muted">{str(p.failureReason)}</span> : null}
        </span>,
        <a key="c" className="text-accent underline" href={csvUrl(`/admin/payouts/${str(p.id)}/statement.csv`)}>
          {t("statement")}
        </a>,
      ])}
    />
  );
}

export function AdminPayouts() {
  const t = useTranslations("m5.payouts");
  const format = useFormatter();
  const [open, setOpen] = useState<string | null>(null);
  const batches = useGet(["admin-batches"], m5.batches);
  const create = useAct(() => m5.createBatch(), [["admin-batches"]]);
  const act = useAct(m5.batchAction, [["admin-batches"], ["admin-batch"]]);
  const err = create.error ?? act.error;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <div className="flex gap-3">
          <a className="font-semibold text-accent underline" href={csvUrl("/admin/reports/payouts.csv")}>
            {t("csv")}
          </a>
          <Button onClick={() => create.mutate(undefined)} disabled={create.isPending}>
            {t("draft")}
          </Button>
        </div>
      </div>
      <p className="text-muted">{t("help")}</p>
      {err && <Alert>{errText(err, t("failed"))}</Alert>}
      {(batches.data ?? []).map((b) => {
        const id = str(b.id);
        const status = str(b.status);
        return (
          <Card key={id}>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-semibold">
                {t("week", { date: format.dateTime(new Date(str(b.weekEnding)), { dateStyle: "medium" }) })}
              </h2>
              <StatusChip tone={tone(status)}>{status}</StatusChip>
              <span className="text-muted">
                {t("summary", { count: num(b.payouts), paid: num(b.paid), failed: num(b.failed) })} ·{" "}
                {rupees(num(b.netPaise))}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => setOpen(open === id ? null : id)}>
                {open === id ? t("hide") : t("show")}
              </Button>
              {status === "DRAFT" && (
                <Button onClick={() => act.mutate({ id, action: "approve" })} disabled={act.isPending}>
                  {t("approve")}
                </Button>
              )}
              {status === "APPROVED" && (
                <Button onClick={() => act.mutate({ id, action: "release" })} disabled={act.isPending}>
                  {t("release")}
                </Button>
              )}
              {(status === "DRAFT" || status === "APPROVED") && (
                <Button
                  variant="secondary"
                  onClick={() => act.mutate({ id, action: "cancel" })}
                  disabled={act.isPending}
                >
                  {t("cancel")}
                </Button>
              )}
            </div>
            {open === id && (
              <div className="mt-3">
                <BatchDetail id={id} />
              </div>
            )}
          </Card>
        );
      })}
      <Empty show={batches.data?.length === 0} />
    </div>
  );
}

// ---- Settings: config, categories, legal (UI-ADM-08) -----------------------------------------

function ConfigRow({ row }: { row: Row }) {
  const t = useTranslations("m5.settings");
  const [value, setValue] = useState(JSON.stringify(row.value));
  const [bad, setBad] = useState(false);
  const save = useAct(m5.setConfig, [["admin-config"]]);
  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        try {
          const parsed = JSON.parse(value);
          setBad(false);
          save.mutate({ key: str(row.key), value: parsed, version: num(row.version) });
        } catch {
          setBad(true);
        }
      }}
    >
      <Field
        label={`${str(row.key)} (v${num(row.version)})`}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        error={bad ? t("badJson") : save.isError ? errText(save.error, t("failed")) : undefined}
        className="min-w-64 flex-1"
      />
      <Button type="submit" variant="secondary" disabled={save.isPending}>
        {save.isSuccess ? t("saved") : t("save")}
      </Button>
    </form>
  );
}

function CategoryRow({ row }: { row: Row }) {
  const t = useTranslations("m5.settings");
  const [c, setC] = useState(row.commissionBps == null ? "" : String(num(row.commissionBps) / 100));
  const [g, setG] = useState(String(num(row.gstRateBps) / 100));
  const save = useAct(m5.setRates, [["admin-categories"]]);
  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate({
          id: str(row.id),
          commissionBps: c === "" ? null : Math.round(Number(c) * 100),
          gstRateBps: Math.round(Number(g) * 100),
          hsn: (row.hsn as string | null) ?? null,
        });
      }}
    >
      <span className="w-48 font-semibold">{str(row.name)}</span>
      <Field label={t("commission")} value={c} onChange={(e) => setC(e.target.value)} inputMode="decimal" />
      <Field label={t("gst")} value={g} onChange={(e) => setG(e.target.value)} inputMode="decimal" />
      <Button type="submit" variant="secondary" disabled={save.isPending}>
        {save.isSuccess ? t("saved") : t("save")}
      </Button>
      {save.isError && <Alert>{errText(save.error, t("failed"))}</Alert>}
    </form>
  );
}

export function AdminSettings() {
  const t = useTranslations("m5.settings");
  const config = useGet(["admin-config"], m5.config);
  const cats = useGet(["admin-categories"], m5.categories);
  const legal = useGet(["admin-legal"], m5.legalDocs);
  const [doc, setDoc] = useState({ kind: "TERMS" as const, title: "", bodyMd: "" });
  const publish = useAct(m5.publishLegal, [["admin-legal"]]);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <Card>
        <h2 className="mb-3 text-lg font-semibold">{t("config")}</h2>
        <div className="space-y-3">
          {(config.data ?? []).map((r) => (
            <ConfigRow key={`${str(r.key)}-${num(r.version)}`} row={r} />
          ))}
        </div>
        <Empty show={config.data?.length === 0} />
      </Card>
      <Card>
        <h2 className="mb-1 text-lg font-semibold">{t("categories")}</h2>
        <p className="mb-3 text-muted">{t("categoriesHelp")}</p>
        <div className="space-y-3">
          {(cats.data ?? []).map((r) => (
            <CategoryRow key={str(r.id)} row={r} />
          ))}
        </div>
      </Card>
      <Card>
        <h2 className="mb-3 text-lg font-semibold">{t("legal")}</h2>
        <ul className="mb-4 space-y-1">
          {(legal.data ?? []).map((d) => (
            <li key={d.id}>
              <strong>{d.title}</strong> · {d.kind} v{d.version}
            </li>
          ))}
        </ul>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            publish.mutate(doc);
          }}
        >
          <label className="block">
            <span className="text-sm font-semibold">{t("kind")}</span>
            <select
              className="mt-1 min-h-11 w-full rounded-xl border border-line bg-surface px-3 py-2 transition focus:border-brand"
              value={doc.kind}
              onChange={(e) => setDoc({ ...doc, kind: e.target.value as typeof doc.kind })}
            >
              {["TERMS", "PRIVACY", "SELLER_TERMS", "CREATOR_TERMS", "RETURNS"].map((k) => (
                <option key={k}>{k}</option>
              ))}
            </select>
          </label>
          <Field label={t("docTitle")} value={doc.title} onChange={(e) => setDoc({ ...doc, title: e.target.value })} />
          <label className="block">
            <span className="text-sm font-semibold">{t("body")}</span>
            <textarea
              className="mt-1 h-40 w-full rounded-xl border border-line bg-surface px-3 py-2 transition focus:border-brand"
              value={doc.bodyMd}
              onChange={(e) => setDoc({ ...doc, bodyMd: e.target.value })}
            />
          </label>
          {publish.isError && <Alert>{errText(publish.error, t("failed"))}</Alert>}
          {publish.isSuccess && <Alert tone="info">{t("published")}</Alert>}
          <Button type="submit" disabled={publish.isPending}>
            {t("publish")}
          </Button>
        </form>
      </Card>
    </div>
  );
}

// ---- Audit, reports and ledger adjustments (UI-ADM-09) -----------------------------------------

export function AdminAudit() {
  const t = useTranslations("m5.audit");
  const format = useFormatter();
  const audit = useGet(["admin-audit"], m5.audit);
  const adj = useGet(["admin-adjustments"], m5.adjustments);
  const [form, setForm] = useState({ accountId: "", amount: "", reason: "" });
  const request = useAct(m5.requestAdjustment, [["admin-adjustments"]]);
  const decide = useAct(m5.decideAdjustment, [["admin-adjustments"]]);
  const err = request.error ?? decide.error;
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <Card>
        <h2 className="mb-2 text-lg font-semibold">{t("reports")}</h2>
        <div className="flex flex-wrap gap-4">
          {["orders", "payouts", "audit"].map((r) => (
            <a key={r} className="font-semibold text-accent underline" href={csvUrl(`/admin/reports/${r}.csv`)}>
              {t(`report.${r}`)}
            </a>
          ))}
        </div>
      </Card>
      <Card>
        <h2 className="mb-1 text-lg font-semibold">{t("adjustments")}</h2>
        <p className="mb-3 text-muted">{t("adjustmentsHelp")}</p>
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            request.mutate({ accountId: form.accountId.trim(), amount: Number(form.amount), reason: form.reason });
          }}
        >
          <Field
            label={t("account")}
            value={form.accountId}
            onChange={(e) => setForm({ ...form, accountId: e.target.value })}
          />
          <Field
            label={t("amount")}
            value={form.amount}
            inputMode="numeric"
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />
          <Field
            label={t("reason")}
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
          />
          <Button type="submit" disabled={request.isPending}>
            {t("request")}
          </Button>
        </form>
        {err && (
          <div className="mt-3">
            <Alert>{errText(err, t("failed"))}</Alert>
          </div>
        )}
        <div className="mt-4">
          <Table
            head={[t("account"), t("amount"), t("reason"), t("status"), ""]}
            rows={(adj.data ?? []).map((a) => [
              str(a.accountName) || str(a.accountId),
              num(a.amount) > 0 ? `+${num(a.amount)}` : String(num(a.amount)),
              str(a.reason),
              <StatusChip key="s" tone={tone(str(a.status))}>
                {str(a.status)}
              </StatusChip>,
              a.status === "REQUESTED" ? (
                <span key="b" className="flex gap-2">
                  <Button onClick={() => decide.mutate({ id: str(a.id), approve: true })} disabled={decide.isPending}>
                    {t("apply")}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => decide.mutate({ id: str(a.id), approve: false })}
                    disabled={decide.isPending}
                  >
                    {t("reject")}
                  </Button>
                </span>
              ) : null,
            ])}
          />
        </div>
      </Card>
      <Card>
        <h2 className="mb-3 text-lg font-semibold">{t("log")}</h2>
        <Table
          head={[t("at"), t("actor"), t("action"), t("target")]}
          rows={(audit.data ?? []).map((a) => [
            format.dateTime(new Date(str(a.at)), { dateStyle: "medium", timeStyle: "short" }),
            str(a.actorName) || "—",
            str(a.action),
            `${str(a.targetType)} ${str(a.targetId).slice(0, 8)}`,
          ])}
        />
        <Empty show={audit.data?.length === 0} />
      </Card>
    </div>
  );
}

// ---- Health (UI-ADM-10) -------------------------------------------------------------------

export function AdminHealth() {
  const t = useTranslations("m5.health");
  const format = useFormatter();
  const h = useGet(["admin-health"], m5.health);
  const recon = useGet(["admin-recon"], m5.recon);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <p className="text-muted">{t("help")}</p>
      <Card>
        <Table
          head={[t("check"), t("last"), t("latency"), t("uptime")]}
          rows={(h.data?.checks ?? []).map((c) => [
            c.checkName,
            <span key="s">
              <StatusChip tone={c.lastOk ? "success" : "danger"}>{c.lastOk ? t("up") : t("down")}</StatusChip>
              <span className="ml-2 text-xs text-muted">
                {format.dateTime(new Date(c.lastAt), { timeStyle: "short" })}
              </span>
              {c.lastError ? <span className="block text-xs text-muted">{c.lastError}</span> : null}
            </span>,
            `${c.avgLatencyMs} ms`,
            `${c.uptime30d.toFixed(2)}%`,
          ])}
        />
        <Empty show={h.data?.checks.length === 0} />
      </Card>
      <h2 className="text-xl font-semibold">{t("incidents")}</h2>
      <Card>
        <Table
          head={[t("check"), t("opened"), t("state"), t("error")]}
          rows={(h.data?.incidents ?? []).map((i) => [
            i.checkName,
            format.dateTime(new Date(i.openedAt), { dateStyle: "medium", timeStyle: "short" }),
            <StatusChip key="s" tone={i.resolvedAt ? "success" : "danger"}>
              {i.resolvedAt ? t("resolved") : t("open")}
            </StatusChip>,
            i.lastError ?? "",
          ])}
        />
        <Empty show={h.data?.incidents.length === 0} />
      </Card>
      <h2 className="text-xl font-semibold">{t("recon")}</h2>
      <Card>
        <Table
          head={[t("day"), t("kind"), t("ref"), t("detail")]}
          rows={(recon.data ?? []).map((r) => [str(r.day), str(r.kind), str(r.ref), str(r.detail)])}
        />
        <Empty show={recon.data?.length === 0} />
      </Card>
    </div>
  );
}
