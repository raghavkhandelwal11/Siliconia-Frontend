"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { api, ApiError, unwrap } from "@/lib/api/client";
import { safeNext, sessionKey, type Session } from "@/lib/auth/session";
import { Alert, Button, Card, Field } from "@/components/ui/Form";
import { useCountdown } from "./useCountdown";

// UI-AUTH-03: accounts created with Google add a verified mobile number, which
// orders, payouts and SMS updates need (FR-AUTH-05).
export function VerifyPhoneForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const qc = useQueryClient();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [challenge, setChallenge] = useState<{ id: string; resendAt: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resendIn = useCountdown(challenge?.resendAt ?? 0);
  const message = (e: unknown) => (e instanceof ApiError ? e.message : t("errors.generic"));

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = unwrap(await api.POST("/me/phone/otp", { body: { phone } }));
      setChallenge({ id: res.challengeId, resendAt: Date.now() + res.resendAfterSec * 1000 });
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
      const account = unwrap(await api.POST("/me/phone/verify", { body: { challengeId: challenge.id, code } }));
      qc.setQueryData(sessionKey, { state: "signed-in", account } satisfies Session);
      router.push(next);
    } catch (err) {
      setError(message(err));
      setBusy(false);
    }
  }

  return (
    <Card className="mx-auto w-full max-w-md">
      <h1 className="text-2xl font-bold">{t("verifyPhone.title")}</h1>
      <p className="mt-1 text-muted">{t("verifyPhone.intro")}</p>
      {error && (
        <div className="mt-4">
          <Alert>{error}</Alert>
        </div>
      )}
      {!challenge ? (
        <form onSubmit={send} className="mt-6 space-y-5" noValidate>
          <Field
            label={t("signIn.phoneLabel")}
            hint={t("signIn.phoneHint")}
            prefix="+91"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            maxLength={14}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Button type="submit" className="w-full" disabled={busy || phone.replace(/\D/g, "").length < 10}>
            {busy ? t("signIn.sending") : t("signIn.sendCode")}
          </Button>
        </form>
      ) : (
        <form onSubmit={verify} className="mt-6 space-y-5" noValidate>
          <Field
            label={t("signIn.codeLabel")}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          />
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
      <p className="mt-6 text-center text-sm">
        <Link href={next} className="text-muted underline">
          {t("verifyPhone.later")}
        </Link>
      </p>
    </Card>
  );
}
