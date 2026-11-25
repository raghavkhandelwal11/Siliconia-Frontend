"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { useSession } from "@/lib/auth/session";
import {
  browser,
  newIdempotencyKey,
  oneLine,
  rupees,
  useAddresses,
  usePlaceOrder,
  useQuote,
  type PayMethod,
} from "@/lib/checkout";
import { Alert, Button, buttonClass, Card } from "@/components/ui/Form";
import { Icon } from "@/components/ui/Icon";
import { deliveryDate } from "@/lib/shipping";
import { AddressForm } from "./AddressForm";

// UI-BUY-02/03: address, pay method, review and place order.
export function CheckoutPage() {
  const t = useTranslations("checkout");
  const router = useRouter();
  const session = useSession();
  const addresses = useAddresses();
  const [chosen, setChosen] = useState<string>();
  const [adding, setAdding] = useState(false);
  const [method, setMethod] = useState<PayMethod>("ONLINE");
  const items = addresses.data?.items ?? [];
  const addressId = chosen ?? items.find((a) => a.isDefault)?.id ?? items[0]?.id;
  const quote = useQuote(addressId, method);
  const place = usePlaceOrder();
  // One key per attempt: a double click or a retry after a network error
  // returns the same order instead of placing two.
  const key = useRef(newIdempotencyKey());

  if (addresses.isPending || quote.isPending) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="skeleton h-96" />
        <div className="skeleton h-72" />
      </div>
    );
  }
  if (quote.error instanceof ApiError && quote.error.code === "CART_EMPTY") {
    return (
      <div className="card rise mx-auto max-w-lg p-10 text-center">
        <h1 className="text-2xl font-bold">{t("emptyTitle")}</h1>
        <p className="mt-2 text-muted">{t("emptyBody")}</p>
        <Link href="/categories" className={buttonClass("primary", "mt-4")}>
          {t("browse")}
        </Link>
      </div>
    );
  }
  if (addresses.isError || quote.isError || !quote.data) return <Alert>{t("loadError")}</Alert>;
  const q = quote.data;
  const phoneOk = session.data?.state === "signed-in" && session.data.account.phoneVerified;
  const cartProblem = q.groups.some((g) => g.lines.some((l) => l.problem));

  function submit() {
    if (!addressId) return;
    place.mutate(
      { key: key.current, addressId, payMethod: method, quoteHash: q.quoteHash },
      {
        onSuccess: (o) => {
          if (o.status === "PENDING_PAYMENT" && o.payment?.checkoutUrl) browser.go(o.payment.checkoutUrl);
          else router.push(`/checkout/result?order=${o.id}`);
        },
        onError: (e) => {
          // The order was not placed: the next attempt is a new request.
          if (e instanceof ApiError && e.status < 500) key.current = newIdempotencyKey();
          if (e instanceof ApiError && (e.code === "QUOTE_CHANGED" || e.code === "STOCK_INSUFFICIENT")) {
            void quote.refetch();
          }
        },
      },
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold sm:text-3xl">{t("title")}</h1>
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-5">
          <Card>
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
              <Step n={1} /> {t("deliverTo")}
            </h2>
            {items.length > 0 && !adding && (
              <fieldset className="space-y-2">
                <legend className="sr-only">{t("deliverTo")}</legend>
                {items.map((a) => (
                  <label
                    key={a.id}
                    className={`flex cursor-pointer gap-3 rounded-xl border p-3 transition ${
                      a.id === addressId ? "border-brand bg-brand-soft/50" : "border-line hover:border-brand/40"
                    }`}
                  >
                    <input
                      type="radio"
                      name="address"
                      className="mt-1 accent-[var(--color-brand)]"
                      checked={a.id === addressId}
                      onChange={() => setChosen(a.id)}
                    />
                    <span className="text-sm">
                      <span className="font-semibold">{a.name}</span>
                      <span className="block text-muted">{oneLine(a)}</span>
                      <span className="block text-muted">+91 {a.phone}</span>
                    </span>
                  </label>
                ))}
              </fieldset>
            )}
            {adding || items.length === 0 ? (
              <AddressForm
                onSaved={(a) => {
                  setChosen(a.id);
                  setAdding(false);
                }}
                onCancel={items.length > 0 ? () => setAdding(false) : undefined}
              />
            ) : (
              items.length < (addresses.data?.max ?? 10) && (
                <Button variant="ghost" className="mt-2 px-3" onClick={() => setAdding(true)}>
                  {t("addAddress")}
                </Button>
              )
            )}
          </Card>

          <Card>
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
              <Step n={2} /> {t("payWith")}
            </h2>
            <fieldset className="grid gap-2 sm:grid-cols-2">
              <legend className="sr-only">{t("payWith")}</legend>
              {(["ONLINE", "COD"] as const).map((m) => {
                const off = m === "COD" && !q.codEligible;
                return (
                  <label
                    key={m}
                    className={`flex gap-3 rounded-xl border p-3 transition ${
                      off ? "cursor-not-allowed opacity-55" : "cursor-pointer"
                    } ${m === method ? "border-brand bg-brand-soft/50" : "border-line hover:border-brand/40"}`}
                  >
                    <input
                      type="radio"
                      name="pay"
                      className="mt-1 accent-[var(--color-brand)]"
                      checked={m === method}
                      disabled={off}
                      onChange={() => setMethod(m)}
                    />
                    <span className="text-sm">
                      <span className="font-semibold">{t(`method.${m}`)}</span>
                      <span className="block text-muted">
                        {off
                          ? q.codReason === "PIN_NO_COD"
                            ? t("codPin")
                            : t("codLimit", { amount: rupees(q.codLimitPaise) })
                          : t(`methodHint.${m}`)}
                      </span>
                    </span>
                  </label>
                );
              })}
            </fieldset>
          </Card>

          <Card>
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
              <Step n={3} /> {t("review")}
            </h2>
            <div className="space-y-4">
              {q.groups.map((g) => (
                <section key={g.storeName}>
                  <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
                    <Icon name="store" size={16} className="text-brand" />
                    {t("soldBy", { store: g.storeName })}
                  </p>
                  <ul className="divide-y divide-line rounded-xl border border-line">
                    {g.lines.map((l) => (
                      <li key={l.variantId} className="flex items-center gap-3 p-3">
                        <span className="block size-14 shrink-0 overflow-hidden rounded-lg bg-bg">
                          {l.coverUrl && (
                            // eslint-disable-next-line @next/next/no-img-element -- sized by the API
                            <img src={l.coverUrl} alt="" className="size-full object-cover" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1 text-sm">
                          <span className="line-clamp-1 font-medium">{l.name}</span>
                          <span className="block text-muted">
                            {Object.values(l.attrs).join(" · ")} {t("qty", { n: l.qty })}
                          </span>
                          {l.problem && (
                            <span className="block font-semibold text-danger">{t(`problem.${l.problem}`)}</span>
                          )}
                        </span>
                        <span className="text-sm font-semibold">{rupees(l.lineTotalPaise)}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </Card>
        </div>

        <aside className="card rise space-y-4 p-5 lg:sticky lg:top-24" aria-label={t("summary")}>
          <h2 className="text-lg font-semibold">{t("summary")}</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">{t("items", { n: q.itemCount })}</dt>
              <dd>{rupees(q.mrpTotalPaise)}</dd>
            </div>
            {q.savingsPaise > 0 && (
              <div className="flex justify-between text-success">
                <dt>{t("savings")}</dt>
                <dd>−{rupees(q.savingsPaise)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted">{t("delivery")}</dt>
              <dd className="font-medium text-success">{q.shippingPaise > 0 ? rupees(q.shippingPaise) : t("free")}</dd>
            </div>
            {q.delivery?.deliverable && q.delivery.etaDays && (
              <div className="flex justify-between">
                <dt className="text-muted">{t("arrives")}</dt>
                <dd className="font-medium">{deliveryDate(q.delivery.etaDays)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-line pt-2 text-base font-bold">
              <dt>{t("payable")}</dt>
              <dd>{rupees(q.payablePaise)}</dd>
            </div>
          </dl>
          {q.electronsNonMember > 0 && (
            <p className="flex items-start gap-2 rounded-xl bg-gold-soft/70 p-3 text-sm">
              <Icon name="coin" size={18} className="mt-0.5 shrink-0 text-gold" />
              {t("electrons", { n: q.electronsNonMember })}
            </p>
          )}
          {q.delivery && !q.delivery.deliverable && <Alert>{t("notServed")}</Alert>}
          {!phoneOk && (
            <Alert tone="info">
              {t("phoneRequired")}{" "}
              <Link href="/auth/verify-phone?next=/checkout" className="font-semibold text-brand underline">
                {t("verifyPhone")}
              </Link>
            </Alert>
          )}
          {place.isError && <Alert>{place.error instanceof ApiError ? place.error.message : t("placeError")}</Alert>}
          <Button
            className="w-full"
            disabled={!q.canPlace || !phoneOk || place.isPending || place.isSuccess}
            onClick={submit}
          >
            <Icon name={method === "COD" ? "check" : "shield"} size={18} />
            {place.isPending || place.isSuccess
              ? t("placing")
              : method === "COD"
                ? t("placeCod", { amount: rupees(q.payablePaise) })
                : t("pay", { amount: rupees(q.payablePaise) })}
          </Button>
          {cartProblem && (
            <p className="text-center text-xs text-danger">
              {t("fixCart")}{" "}
              <Link href="/cart" className="font-semibold underline">
                {t("backToCart")}
              </Link>
            </p>
          )}
          <p className="text-center text-xs text-muted">{t("terms")}</p>
        </aside>
      </div>
    </div>
  );
}

function Step({ n }: { n: number }) {
  return (
    <span className="inline-flex size-7 items-center justify-center rounded-full bg-brand-gradient text-sm font-bold text-white">
      {n}
    </span>
  );
}
