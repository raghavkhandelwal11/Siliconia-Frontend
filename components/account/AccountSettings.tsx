"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { api, ApiError, unwrap, type Account } from "@/lib/api/client";
import { formatPhone, sessionKey, type Session } from "@/lib/auth/session";
import { StatusChip } from "@/components/ui/StatusChip";
import { Alert, Button, buttonClass, Card, Field } from "@/components/ui/Form";

// UI-ACC-01: profile, mobile number and signed-in devices (FR-AUTH-07).
export function AccountSettings({ account }: { account: Account }) {
  const t = useTranslations("account");
  const tr = useTranslations("roles");
  const format = useFormatter();
  const qc = useQueryClient();
  const [name, setName] = useState(account.name);
  const [email, setEmail] = useState(account.email ?? "");

  const save = useMutation({
    mutationFn: async () => unwrap(await api.PATCH("/me", { body: { name, email: email || null } })),
    onSuccess: (updated) => qc.setQueryData(sessionKey, { state: "signed-in", account: updated } satisfies Session),
  });

  const sessions = useQuery({
    queryKey: ["sessions"],
    queryFn: async () => unwrap(await api.GET("/me/sessions")).sessions,
  });
  const revoke = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.DELETE("/me/sessions/{id}", { params: { path: { id } } });
      if (!res.response.ok) throw new ApiError(res.response.status, "", t("errors.revoke"));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      {account.role === "BUYER" && (
        <nav className="flex flex-wrap gap-2" aria-label={t("shortcuts")}>
          {(["orders", "returns", "issues", "addresses", "wishlist"] as const).map((k) => (
            <Link key={k} href={`/account/${k}`} className={buttonClass("secondary")}>
              {t(`links.${k}`)}
            </Link>
          ))}
        </nav>
      )}

      <Card>
        <h2 className="text-lg font-semibold">{t("profile")}</h2>
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
          <dt className="text-muted">{t("role")}</dt>
          <dd>{tr(account.role)}</dd>
          <dt className="text-muted">{t("phone")}</dt>
          <dd className="flex flex-wrap items-center gap-2">
            {account.phone ? formatPhone(account.phone) : t("phoneMissing")}
            {account.phoneVerified ? (
              <StatusChip tone="success">{t("phoneVerified")}</StatusChip>
            ) : (
              <Link href="/auth/verify-phone?next=/account" className="font-semibold text-accent underline">
                {t("addPhone")}
              </Link>
            )}
          </dd>
        </dl>
        <form
          className="mt-5 grid gap-4 sm:max-w-md"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
        >
          <Field
            label={t("name")}
            value={name}
            maxLength={100}
            autoComplete="name"
            onChange={(e) => setName(e.target.value)}
          />
          <Field
            label={t("email")}
            type="email"
            value={email}
            autoComplete="email"
            maxLength={254}
            onChange={(e) => setEmail(e.target.value)}
          />
          {save.isError && <Alert>{save.error instanceof ApiError ? save.error.message : t("errors.save")}</Alert>}
          {save.isSuccess && <Alert tone="info">{t("saved")}</Alert>}
          <div>
            <Button type="submit" disabled={save.isPending}>
              {t("save")}
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold">{t("sessions")}</h2>
        {sessions.isPending && <p className="mt-3 text-muted">{t("loading")}</p>}
        <ul className="mt-3 divide-y divide-line">
          {sessions.data?.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{s.userAgent || t("unknownDevice")}</p>
                <p className="text-sm text-muted">
                  {t("lastUsed", {
                    date: format.dateTime(new Date(s.lastUsedAt), { dateStyle: "medium", timeStyle: "short" }),
                  })}
                </p>
              </div>
              {s.current ? (
                <StatusChip tone="info">{t("thisDevice")}</StatusChip>
              ) : (
                <Button variant="secondary" disabled={revoke.isPending} onClick={() => revoke.mutate(s.id)}>
                  {t("signOutDevice")}
                </Button>
              )}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
