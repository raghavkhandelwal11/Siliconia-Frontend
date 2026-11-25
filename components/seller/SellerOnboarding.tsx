"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { api, ApiError, unwrap } from "@/lib/api/client";
import {
  BUSINESS_TYPES,
  useSellerApplication,
  useSetApplication,
  type Address,
  type BusinessType,
  type SellerApplication,
} from "@/lib/seller";
import { formatPhone } from "@/lib/auth/session";
import { Alert, Button, Card, Field } from "@/components/ui/Form";
import { Icon } from "@/components/ui/Icon";
import { ApplicationStatus } from "./ApplicationStatus";
import { KycResult } from "./KycResult";

const STEPS = ["business", "pan", "bank", "pickup", "review"] as const;
type Step = (typeof STEPS)[number];

// UI-SEL-01: onboarding wizard (FR-SEL-01). Each step saves to the API, so the
// seller can stop and come back; the review step submits for approval.
export function SellerOnboarding({ testMode = false }: { testMode?: boolean }) {
  const t = useTranslations("seller");
  const app = useSellerApplication();
  if (app.isPending) return <p className="text-muted">{t("loading")}</p>;
  if (app.isError || !app.data) return <Alert>{t("loadError")}</Alert>;
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <ApplicationStatus app={app.data} />
      {app.data.editable ? <Wizard app={app.data} testMode={testMode} /> : <Summary app={app.data} />}
    </div>
  );
}

function Wizard({ app, testMode }: { app: SellerApplication; testMode: boolean }) {
  const t = useTranslations("seller");
  const setApp = useSetApplication();
  const [step, setStep] = useState<Step>(firstOpenStep(app));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    businessType: (app.businessType ?? "") as BusinessType | "",
    legalName: app.legalName,
    storeName: app.storeName,
    gstin: app.gstin ?? "",
    pickup: {
      line1: "",
      line2: "",
      city: "",
      state: "",
      pincode: "",
      phone: "",
      ...app.pickupAddress,
    } as Required<Address>,
  });
  const [pan, setPan] = useState("");
  const [bank, setBank] = useState({ account: "", ifsc: app.ifsc ?? "" });
  const [terms, setTerms] = useState(false);
  const typeId = useId();
  const termsId = useId();

  async function run(fn: () => Promise<SellerApplication>, next?: Step) {
    setError(null);
    setBusy(true);
    try {
      const updated = await fn();
      setApp(updated);
      if (next) setStep(next);
      return updated;
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("genericError"));
    } finally {
      setBusy(false);
    }
  }

  const save = (next: Step) =>
    run(
      async () =>
        unwrap(
          await api.PUT("/seller/application", {
            body: {
              businessType: form.businessType || undefined,
              legalName: form.legalName,
              storeName: form.storeName,
              gstin: form.gstin,
              pickupAddress: form.pickup,
            },
          }),
        ),
      next,
    );

  const gstinRequired = form.businessType !== "" && form.businessType !== "INDIVIDUAL";
  const idx = STEPS.indexOf(step);

  return (
    <div className="space-y-4">
      {!app.phoneVerified && (
        <Alert>
          {t("phoneNeeded")}{" "}
          <Link href="/auth/verify-phone?next=/seller/onboarding" className="font-semibold underline">
            {t("verifyPhone")}
          </Link>
        </Alert>
      )}
      <nav aria-label={t("stepsLabel")} className="card p-4">
        <div className="relative">
          <div aria-hidden="true" className="absolute left-5 right-5 top-5 h-0.5 rounded-full bg-line">
            <div
              className="bg-brand-gradient h-full rounded-full transition-all duration-500"
              style={{ width: `${(STEPS.filter((x) => stepDone(app, x)).length / (STEPS.length - 1)) * 100}%` }}
            />
          </div>
          <ol className="relative grid grid-cols-5 gap-1">
            {STEPS.map((s, i) => {
              const done = stepDone(app, s);
              const current = s === step;
              return (
                <li key={s} className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => setStep(s)}
                    aria-current={current ? "step" : undefined}
                    className="group flex flex-col items-center gap-1.5 text-center"
                  >
                    <span
                      className={`flex size-10 items-center justify-center rounded-full border-2 text-sm font-bold transition ${
                        current
                          ? "bg-brand-gradient border-transparent text-white shadow-lift"
                          : done
                            ? "border-success bg-surface text-success"
                            : "border-line bg-surface text-muted group-hover:border-brand/50"
                      }`}
                    >
                      {done && !current ? <Icon name="check" size={18} /> : i + 1}
                    </span>
                    <span className={`hidden text-xs sm:block ${current ? "font-semibold text-ink" : "text-muted"}`}>
                      {t(`steps.${s}`)}
                    </span>
                    {done && <span className="sr-only">({t("done")})</span>}
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </nav>

      <Card>
        <h2 className="text-lg font-semibold">
          {idx + 1}. {t(`steps.${step}`)}
        </h2>
        {error && (
          <div className="mt-3">
            <Alert>{error}</Alert>
          </div>
        )}

        {step === "business" && (
          <form
            className="mt-4 grid gap-4 sm:max-w-lg"
            onSubmit={(e) => {
              e.preventDefault();
              void save("pan");
            }}
          >
            <div>
              <label htmlFor={typeId} className="block text-sm font-medium">
                {t("business.type")}
              </label>
              <select
                id={typeId}
                className="mt-1.5 min-h-11 w-full rounded-xl border border-line bg-surface px-3 transition focus:border-brand"
                value={form.businessType}
                onChange={(e) => setForm({ ...form, businessType: e.target.value as BusinessType })}
                required
              >
                <option value="">{t("business.choose")}</option>
                {BUSINESS_TYPES.map((b) => (
                  <option key={b} value={b}>
                    {t(`businessTypes.${b}`)}
                  </option>
                ))}
              </select>
            </div>
            <Field
              label={t("business.legalName")}
              hint={t("business.legalNameHint")}
              value={form.legalName}
              maxLength={120}
              required
              onChange={(e) => setForm({ ...form, legalName: e.target.value })}
            />
            <Field
              label={t("business.storeName")}
              hint={t("business.storeNameHint")}
              value={form.storeName}
              maxLength={60}
              required
              onChange={(e) => setForm({ ...form, storeName: e.target.value })}
            />
            <Field
              label={gstinRequired ? t("business.gstin") : t("business.gstinOptional")}
              hint={t("business.gstinHint")}
              value={form.gstin}
              maxLength={15}
              autoCapitalize="characters"
              onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })}
            />
            <div>
              <Button type="submit" disabled={busy}>
                {t("saveContinue")}
              </Button>
            </div>
          </form>
        )}

        {step === "pan" && (
          <form
            className="mt-4 grid gap-4 sm:max-w-lg"
            onSubmit={(e) => {
              e.preventDefault();
              void run(async () => unwrap(await api.POST("/seller/application/pan", { body: { pan } })));
            }}
          >
            <p className="text-sm text-muted">{t("pan.intro", { name: app.legalName || "—" })}</p>
            <Field
              label={t("pan.label")}
              hint={testMode ? t("pan.testHint") : undefined}
              value={pan}
              maxLength={10}
              autoCapitalize="characters"
              onChange={(e) => setPan(e.target.value.toUpperCase())}
            />
            <KycResult check={app.panCheck} last4={app.panLast4} />
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={busy || pan.length !== 10}>
                {busy ? t("checking") : t("pan.verify")}
              </Button>
              <Button type="button" variant="secondary" disabled={!app.panVerified} onClick={() => setStep("bank")}>
                {t("continue")}
              </Button>
            </div>
          </form>
        )}

        {step === "bank" && (
          <form
            className="mt-4 grid gap-4 sm:max-w-lg"
            onSubmit={(e) => {
              e.preventDefault();
              void run(async () => unwrap(await api.POST("/seller/application/bank", { body: bank })));
            }}
          >
            <p className="text-sm text-muted">{t("bank.intro", { name: app.legalName || "—" })}</p>
            <Field
              label={t("bank.account")}
              hint={testMode ? t("bank.testHint") : undefined}
              inputMode="numeric"
              value={bank.account}
              maxLength={22}
              onChange={(e) => setBank({ ...bank, account: e.target.value })}
            />
            <Field
              label={t("bank.ifsc")}
              value={bank.ifsc}
              maxLength={11}
              autoCapitalize="characters"
              onChange={(e) => setBank({ ...bank, ifsc: e.target.value.toUpperCase() })}
            />
            <KycResult check={app.bankCheck} last4={app.bankLast4} />
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={busy || bank.account.length < 9 || bank.ifsc.length !== 11}>
                {busy ? t("checking") : t("bank.verify")}
              </Button>
              <Button type="button" variant="secondary" disabled={!app.bankVerified} onClick={() => setStep("pickup")}>
                {t("continue")}
              </Button>
            </div>
          </form>
        )}

        {step === "pickup" && (
          <form
            className="mt-4 grid gap-4 sm:max-w-lg"
            onSubmit={(e) => {
              e.preventDefault();
              void save("review");
            }}
          >
            <p className="text-sm text-muted">{t("pickup.intro")}</p>
            {(["line1", "line2", "city", "state", "pincode", "phone"] as const).map((k) => (
              <Field
                key={k}
                label={t(`pickup.${k}`)}
                value={form.pickup[k]}
                required={k !== "line2"}
                inputMode={k === "pincode" || k === "phone" ? "numeric" : undefined}
                maxLength={k === "pincode" ? 6 : k === "phone" ? 10 : 120}
                onChange={(e) => setForm({ ...form, pickup: { ...form.pickup, [k]: e.target.value } })}
              />
            ))}
            <div>
              <Button type="submit" disabled={busy}>
                {t("saveContinue")}
              </Button>
            </div>
          </form>
        )}

        {step === "review" && (
          <form
            className="mt-4 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void run(async () =>
                unwrap(await api.POST("/seller/application/submit", { body: { acceptTerms: terms } })),
              );
            }}
          >
            <Details app={app} />
            {app.missing.length > 0 ? (
              <Alert>
                {t("review.missing")} {app.missing.map((m) => t(`missing.${m}`)).join(", ")}
              </Alert>
            ) : (
              <p className="text-sm text-success">{t("review.ready")}</p>
            )}
            <div className="flex items-start gap-2 text-sm">
              <input
                id={termsId}
                type="checkbox"
                className="mt-1 size-4"
                checked={terms}
                onChange={(e) => setTerms(e.target.checked)}
              />
              <label htmlFor={termsId}>{t("review.terms", { version: app.termsVersion })}</label>
            </div>
            <Button type="submit" disabled={busy || !terms || app.missing.length > 0}>
              {t("review.submit")}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}

function Summary({ app }: { app: SellerApplication }) {
  const t = useTranslations("seller");
  return (
    <Card>
      <h2 className="text-lg font-semibold">{t("summary")}</h2>
      <div className="mt-3">
        <Details app={app} />
      </div>
      <Link href="/seller" className="mt-4 inline-block font-semibold text-accent underline">
        {t("backToPortal")}
      </Link>
    </Card>
  );
}

/** Read-only details of the application (masked). */
export function Details({ app }: { app: SellerApplication }) {
  const t = useTranslations("seller");
  const a = app.pickupAddress;
  const rows: [string, string][] = [
    [t("business.type"), app.businessType ? t(`businessTypes.${app.businessType}`) : "—"],
    [t("business.legalName"), app.legalName || "—"],
    [t("business.storeName"), app.storeName || "—"],
    [t("business.gstinShort"), app.gstin || "—"],
    [t("pan.label"), app.panLast4 ? `•••••${app.panLast4} ${app.panVerified ? "✓" : ""}` : "—"],
    [
      t("bank.account"),
      app.bankLast4 ? `••••${app.bankLast4} · ${app.ifsc ?? ""} ${app.bankVerified ? "✓" : ""}` : "—",
    ],
    [
      t("steps.pickup"),
      a
        ? [a.line1, a.line2, a.city, a.state, a.pincode].filter(Boolean).join(", ") +
          (a.phone ? ` · ${formatPhone(`+91${a.phone}`)}` : "")
        : "—",
    ],
  ];
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-[auto_1fr]">
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-muted">{k}</dt>
          <dd className="break-words">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function stepDone(app: SellerApplication, s: Step): boolean {
  switch (s) {
    case "business":
      return !app.missing.includes("business") && !app.missing.includes("gstin");
    case "pan":
      return app.panVerified;
    case "bank":
      return app.bankVerified;
    case "pickup":
      return !app.missing.includes("pickup");
    default:
      return false;
  }
}

function firstOpenStep(app: SellerApplication): Step {
  return STEPS.find((s) => s !== "review" && !stepDone(app, s)) ?? "review";
}
