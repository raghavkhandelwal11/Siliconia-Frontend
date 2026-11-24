"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { api, ApiError, unwrap, type Account, type Role } from "@/lib/api/client";
import { homeFor, safeNext, sessionKey, type Session } from "@/lib/auth/session";
import { Alert, Button, Card, Field } from "@/components/ui/Form";
import { useCountdown } from "./useCountdown";

const SIGN_UP_ROLES: Role[] = ["BUYER", "SELLER", "PROMOTER", "CREATOR"];

/** Where to go after the code is accepted. */
export function afterSignIn(account: Account, next: string | null): string {
  if (account.role === "ADMIN") return `/auth/mfa?next=${encodeURIComponent(safeNext(next, "/admin"))}`;
  return safeNext(next, homeFor(account.role));
}

// UI-AUTH-01/02: mobile number + OTP is the main sign-in (FR-AUTH-01); Google
// is offered when configured (FR-AUTH-04). One account per role (FR-ROLE-02).
export function SignInForm({ testMode = false }: { testMode?: boolean }) {
  const t = useTranslations("auth");
  const tr = useTranslations("roles");
  const params = useSearchParams();
  const router = useRouter();
  const qc = useQueryClient();
  const next = params.get("next");
  const initialRole = (params.get("role") ?? "BUYER").toUpperCase() as Role;

  const [role, setRole] = useState<Role>(
    initialRole === "ADMIN" || SIGN_UP_ROLES.includes(initialRole) ? initialRole : "BUYER",
  );
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [challenge, setChallenge] = useState<{ id: string; resendAt: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(params.get("error") ? t("errors.google") : null);
  const resendIn = useCountdown(challenge?.resendAt ?? 0);

  const google = useQuery({
    queryKey: ["google-status"],
    queryFn: async () => unwrap(await api.GET("/auth/google/status")).enabled,
    staleTime: Infinity,
  });

  const message = (e: unknown) => (e instanceof ApiError ? e.message : t("errors.generic"));

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = unwrap(await api.POST("/auth/otp/send", { body: { phone, role } }));
      setChallenge({ id: res.challengeId, resendAt: Date.now() + res.resendAfterSec * 1000 });
      setCode("");
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    if (!challenge) return;
    setError(null);
    setBusy(true);
    try {
      const res = unwrap(await api.POST("/auth/otp/verify", { body: { challengeId: challenge.id, code } }));
      qc.setQueryData(
        sessionKey,
        (res.account.role === "ADMIN"
          ? { state: "mfa-required" }
          : { state: "signed-in", account: res.account }) satisfies Session,
      );
      router.push(afterSignIn(res.account, next));
    } catch (err) {
      setError(message(err));
      setBusy(false);
    }
  }

  const isAdmin = role === "ADMIN";
  return (
    <Card className="mx-auto max-w-md">
      <h1 className="text-2xl font-bold">{isAdmin ? t("signIn.adminTitle") : t("signIn.title")}</h1>
      <p className="mt-1 text-muted">{t("signIn.intro")}</p>

      {error && (
        <div className="mt-4">
          <Alert>{error}</Alert>
        </div>
      )}

      {!challenge ? (
        <form onSubmit={send} className="mt-6 space-y-5" noValidate>
          {!isAdmin && (
            <fieldset>
              <legend className="text-sm font-medium">{t("signIn.roleLabel")}</legend>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {SIGN_UP_ROLES.map((r) => (
                  <label
                    key={r}
                    className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm ${role === r ? "border-accent bg-bg font-semibold" : "border-line"}`}
                  >
                    <input type="radio" name="role" value={r} checked={role === r} onChange={() => setRole(r)} />
                    {t(`signIn.roles.${r}`)}
                  </label>
                ))}
              </div>
              <p className="mt-2 text-sm text-muted">{t("signIn.roleHint")}</p>
            </fieldset>
          )}
          <Field
            label={t("signIn.phoneLabel")}
            hint={t("signIn.phoneHint")}
            prefix="+91"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            maxLength={14}
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Button type="submit" className="w-full" disabled={busy || phone.replace(/\D/g, "").length < 10}>
            {busy ? t("signIn.sending") : t("signIn.sendCode")}
          </Button>
        </form>
      ) : (
        <form onSubmit={verify} className="mt-6 space-y-5" noValidate>
          <p className="text-sm">
            {t("signIn.codeSentTo", { phone: `+91 ${phone.replace(/\D/g, "").slice(-10)}`, role: tr(role) })}{" "}
            <button type="button" className="font-semibold text-accent underline" onClick={() => setChallenge(null)}>
              {t("signIn.changeNumber")}
            </button>
          </p>
          <Field
            label={t("signIn.codeLabel")}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          />
          {testMode && (
            <Alert tone="info">
              {t("signIn.testInboxHint")}{" "}
              <a href="/test-inbox" target="_blank" rel="noreferrer" className="font-semibold underline">
                {t("signIn.openTestInbox")}
              </a>
            </Alert>
          )}
          <Button type="submit" className="w-full" disabled={busy || code.length !== 6}>
            {busy ? t("signIn.verifying") : t("signIn.verify")}
          </Button>
          <div className="text-center text-sm">
            {resendIn > 0 ? (
              <span className="text-muted">{t("signIn.resendIn", { seconds: resendIn })}</span>
            ) : (
              <Button type="button" variant="ghost" onClick={() => send()} disabled={busy}>
                {t("signIn.resend")}
              </Button>
            )}
          </div>
        </form>
      )}

      {!isAdmin && !challenge && google.data && (
        <>
          <div className="my-5 flex items-center gap-3 text-sm text-muted">
            <span className="h-px flex-1 bg-line" />
            {t("signIn.or")}
            <span className="h-px flex-1 bg-line" />
          </div>
          <a
            href={`/api/v1/auth/google/start?role=${role}&next=${encodeURIComponent(safeNext(next, homeFor(role)))}`}
            className="flex min-h-11 w-full items-center justify-center rounded-full border border-line text-sm font-semibold hover:bg-bg"
          >
            {t("signIn.google")}
          </a>
        </>
      )}

      <p className="mt-6 text-center text-sm">
        {isAdmin ? (
          <Link href="/auth/sign-in" className="text-accent underline">
            {t("signIn.notAdmin")}
          </Link>
        ) : (
          <Link href="/auth/sign-in?role=ADMIN" className="text-muted underline">
            {t("signIn.adminLink")}
          </Link>
        )}
      </p>
    </Card>
  );
}
