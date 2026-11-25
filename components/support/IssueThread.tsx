"use client";

import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { ApiError } from "@/lib/api/client";
import { issueTone, useIssue, useIssueReply, useReopenIssue, type SupportStatus } from "@/lib/support";
import { Alert, Button } from "@/components/ui/Form";
import { StatusChip } from "@/components/ui/StatusChip";

/** An issue's conversation, for the buyer or for support (support can set the status). */
export function IssueThread({ id, support = false }: { id: string; support?: boolean }) {
  const t = useTranslations("issues");
  const format = useFormatter();
  const issue = useIssue(id, support);
  const reply = useIssueReply(id, support);
  const reopen = useReopenIssue(id);
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<SupportStatus>("WAITING_CUSTOMER");

  if (issue.isPending) return <div className="skeleton h-72" />;
  if (issue.isError || !issue.data) return <Alert>{t("loadErrorOne")}</Alert>;
  const is = issue.data;
  const canReply = is.status !== "CLOSED" && (support || is.status !== "RESOLVED");
  const err = reply.error ?? reopen.error;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <Link href={support ? "/admin/issues" : "/account/issues"} className="text-sm font-medium text-brand">
          ← {t("title")}
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="font-mono text-2xl font-bold">{is.number}</h1>
          <StatusChip tone={issueTone[is.status] ?? "neutral"}>{t(`status.${is.status}`)}</StatusChip>
        </div>
        <p className="text-sm text-muted">
          {t(`type.${is.type}`)} · {t("order", { number: is.orderNumber })}
        </p>
      </div>

      <ol className="space-y-3" aria-label={t("conversation")}>
        {(is.messages ?? []).map((m) => {
          const mine = support ? m.authorRole === "SUPPORT" : m.authorRole === "BUYER";
          return (
            <li key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${mine ? "bg-brand-soft" : "card"}`}>
                <p className="text-xs font-semibold text-muted">{t(`author.${m.authorRole}`)}</p>
                <p className="whitespace-pre-wrap">{m.body}</p>
                <p className="mt-1 text-right text-[11px] text-muted">
                  {format.dateTime(new Date(m.at), {
                    day: "numeric",
                    month: "short",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      {err && <Alert>{err instanceof ApiError ? err.message : t("error")}</Alert>}
      {canReply && (
        <form
          className="card space-y-3 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (body.trim())
              reply.mutate(
                { body: body.trim(), status: support ? status : undefined },
                { onSuccess: () => setBody("") },
              );
          }}
        >
          <label htmlFor="issue-reply" className="block text-sm font-medium">
            {t("reply")}
          </label>
          <textarea
            id="issue-reply"
            rows={3}
            maxLength={2000}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full rounded-xl border border-line bg-surface p-2 text-sm"
          />
          {support && (
            <div>
              <label htmlFor="issue-status" className="block text-sm font-medium">
                {t("setStatus")}
              </label>
              <select
                id="issue-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as SupportStatus)}
                className="mt-1 min-h-11 w-full rounded-xl border border-line bg-surface px-3"
              >
                {(["IN_PROGRESS", "WAITING_CUSTOMER", "RESOLVED"] as const).map((s) => (
                  <option key={s} value={s}>
                    {t(`status.${s}`)}
                  </option>
                ))}
              </select>
            </div>
          )}
          <Button type="submit" disabled={!body.trim() || reply.isPending}>
            {t("send")}
          </Button>
        </form>
      )}
      {!support && is.status === "RESOLVED" && (
        <div className="card flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
          <span>{t("resolvedHint")}</span>
          <Button variant="secondary" disabled={reopen.isPending} onClick={() => reopen.mutate()}>
            {t("reopen")}
          </Button>
        </div>
      )}
      {is.status === "CLOSED" && <p className="text-center text-sm text-muted">{t("closedHint")}</p>}
    </div>
  );
}
