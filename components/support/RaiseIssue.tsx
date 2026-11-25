"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { api, ApiError, unwrap } from "@/lib/api/client";
import { useOrder } from "@/lib/checkout";
import { ISSUE_TYPES, useRaiseIssue, type IssueType } from "@/lib/support";
import { Alert, Button } from "@/components/ui/Form";

/** Raise an issue in three steps: which order (and item), what went wrong, the details (LLD 14.2). */
export function RaiseIssue() {
  const t = useTranslations("issues");
  const router = useRouter();
  const preset = useSearchParams().get("order") ?? "";
  const [step, setStep] = useState(preset ? 2 : 1);
  const [orderId, setOrderId] = useState(preset);
  const [itemId, setItemId] = useState("");
  const [type, setType] = useState<IssueType | "">("");
  const [body, setBody] = useState("");
  const orders = useQuery({ queryKey: ["orders"], queryFn: async () => unwrap(await api.GET("/orders")).items });
  const order = useOrder(orderId);
  const raise = useRaiseIssue();
  const placed = (orders.data ?? []).filter((o) => o.status === "CONFIRMED" || o.status === "CLOSED");

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <h1 className="text-2xl font-bold">{t("raise")}</h1>
      <ol className="flex gap-2 text-xs font-semibold" aria-label={t("steps")}>
        {[1, 2, 3].map((n) => (
          <li
            key={n}
            aria-current={step === n ? "step" : undefined}
            className={`flex-1 rounded-full py-1 text-center ${step >= n ? "bg-brand-gradient text-white" : "bg-line text-muted"}`}
          >
            {t(`step${n}`)}
          </li>
        ))}
      </ol>

      {step === 1 && (
        <fieldset className="card space-y-2 p-4">
          <legend className="sr-only">{t("step1")}</legend>
          {orders.isPending && <div className="skeleton h-24" />}
          {orders.data && placed.length === 0 && <p className="text-muted">{t("noOrders")}</p>}
          {placed.map((o) => (
            <label
              key={o.id}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm ${orderId === o.id ? "border-brand bg-brand-soft/50" : "border-line"}`}
            >
              <input
                type="radio"
                name="order"
                className="accent-[var(--color-brand)]"
                checked={orderId === o.id}
                onChange={() => {
                  setOrderId(o.id);
                  setItemId("");
                }}
              />
              <span className="font-mono font-semibold">{o.number}</span>
              <span className="text-muted">{t("itemCount", { n: o.itemCount })}</span>
            </label>
          ))}
          <Button className="mt-2" disabled={!orderId} onClick={() => setStep(2)}>
            {t("next")}
          </Button>
        </fieldset>
      )}

      {step === 2 && (
        <div className="card space-y-4 p-4">
          {order.data && (
            <div>
              <label htmlFor="issue-item" className="block text-sm font-medium">
                {t("whichItem")}
              </label>
              <select
                id="issue-item"
                value={itemId}
                onChange={(e) => setItemId(e.target.value)}
                className="mt-1 min-h-11 w-full rounded-xl border border-line bg-surface px-3"
              >
                <option value="">{t("wholeOrder")}</option>
                {order.data.subOrders
                  .flatMap((s) => s.items)
                  .map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.name}
                    </option>
                  ))}
              </select>
            </div>
          )}
          <fieldset className="grid gap-2 sm:grid-cols-2">
            <legend className="mb-1 text-sm font-medium">{t("whatWrong")}</legend>
            {ISSUE_TYPES.map((ty) => (
              <label
                key={ty}
                className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-sm ${type === ty ? "border-brand bg-brand-soft/50" : "border-line"}`}
              >
                <input
                  type="radio"
                  name="type"
                  className="accent-[var(--color-brand)]"
                  checked={type === ty}
                  onChange={() => setType(ty)}
                />
                {t(`type.${ty}`)}
              </label>
            ))}
          </fieldset>
          <div className="flex gap-2">
            {!preset && (
              <Button variant="secondary" onClick={() => setStep(1)}>
                {t("back")}
              </Button>
            )}
            <Button disabled={!type} onClick={() => setStep(3)}>
              {t("next")}
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <form
          className="card space-y-3 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (type && body.trim()) {
              raise.mutate(
                { orderId, orderItemId: itemId || undefined, type, body: body.trim() },
                { onSuccess: (is) => router.push(`/account/issues/${is.id}`) },
              );
            }
          }}
        >
          <label htmlFor="issue-body" className="block text-sm font-medium">
            {t("describe")}
          </label>
          <textarea
            id="issue-body"
            rows={5}
            maxLength={2000}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full rounded-xl border border-line bg-surface p-2 text-sm"
          />
          {raise.isError && <Alert>{raise.error instanceof ApiError ? raise.error.message : t("error")}</Alert>}
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => setStep(2)}>
              {t("back")}
            </Button>
            <Button type="submit" disabled={!body.trim() || raise.isPending}>
              {t("submit")}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
