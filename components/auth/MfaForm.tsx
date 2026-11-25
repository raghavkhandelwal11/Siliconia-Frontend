"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { api, ApiError, unwrap } from "@/lib/api/client";
import { safeNext, sessionKey } from "@/lib/auth/session";
import { Alert, Button, Card, Field } from "@/components/ui/Form";

// UI-AUTH-04: admins pass an authenticator (TOTP) code after the SMS code
// (FR-AUTH-06). The first time, they add the setup key to their app.
export function MfaForm() {
  const t = useTranslations("auth.mfa");
  const te = useTranslations("auth.errors");
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"), "/admin");
  const qc = useQueryClient();
  const [setup, setSetup] = useState<{ secret: string; otpauthUri: string } | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const status = useQuery({
    queryKey: ["totp-status"],
    queryFn: async () => unwrap(await api.GET("/auth/totp/status")),
    retry: false,
  });
  const message = (e: unknown) => (e instanceof ApiError ? e.message : te("generic"));

  const signedOut = status.error instanceof ApiError && status.error.status === 401;
  useEffect(() => {
    if (signedOut) router.replace(`/auth/sign-in?role=ADMIN&next=${encodeURIComponent(next)}`);
  }, [signedOut, next, router]);
  if (signedOut) return null;

  async function startSetup() {
    setError(null);
    setBusy(true);
    try {
      setSetup(unwrap(await api.POST("/auth/totp/setup")));
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      unwrap(await api.POST("/auth/totp/verify", { body: { code } }));
      await qc.invalidateQueries({ queryKey: sessionKey });
      router.push(next);
    } catch (err) {
      setError(message(err));
      setBusy(false);
    }
  }

  const enrolled = status.data?.enrolled ?? false;
  const needsSetup = status.isSuccess && !enrolled && !setup;
  return (
    <Card className="mx-auto w-full max-w-md">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      {error && (
        <div className="mt-4">
          <Alert>{error}</Alert>
        </div>
      )}
      {status.isPending && <p className="mt-4 text-muted">{t("loading")}</p>}
      {needsSetup && (
        <div className="mt-4 space-y-4">
          <p className="text-muted">{t("setupIntro")}</p>
          <Button onClick={startSetup} disabled={busy}>
            {t("setup")}
          </Button>
        </div>
      )}
      {setup && (
        <div className="mt-4 space-y-3">
          <p className="text-muted">{t("setupKeyIntro")}</p>
          <p className="text-sm font-medium">{t("keyLabel")}</p>
          <code className="block rounded-lg bg-bg p-3 font-mono text-lg tracking-wider break-all select-all">
            {setup.secret.match(/.{1,4}/g)?.join(" ")}
          </code>
          <a href={setup.otpauthUri} className="text-sm font-semibold text-accent underline">
            {t("openApp")}
          </a>
        </div>
      )}
      {(enrolled || setup) && (
        <form onSubmit={verify} className="mt-6 space-y-5" noValidate>
          <p className="text-muted">{t("verifyIntro")}</p>
          <Field
            label={t("codeLabel")}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          />
          <Button type="submit" className="w-full" disabled={busy || code.length !== 6}>
            {t("verify")}
          </Button>
        </form>
      )}
    </Card>
  );
}
