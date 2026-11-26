"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { CSSProperties } from "react";
import { ApiError } from "@/lib/api/client";
import { useCart, useSetQty, type CartLine } from "@/lib/cart";
import { Alert, Button, buttonClass } from "@/components/ui/Form";
import { Icon } from "@/components/ui/Icon";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const rupees = (p: number) => inr.format(Math.round(p / 100));

// UI-BUY-01: cart grouped by seller with steppers, warnings and a summary.
export function CartPage() {
  const t = useTranslations("cart");
  const cart = useCart();
  const setQty = useSetQty();

  if (cart.isPending) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="skeleton h-72" />
        <div className="skeleton h-64" />
      </div>
    );
  }
  if (cart.isError) return <Alert>{t("loadError")}</Alert>;
  if (cart.data === null) {
    return (
      <div className="card rise mx-auto max-w-lg p-10 text-center">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="mt-2 text-muted">{t("otherRole")}</p>
      </div>
    );
  }
  const c = cart.data;
  if (c.groups.length === 0) {
    return (
      <div className="card rise mx-auto flex max-w-lg flex-col items-center gap-3 p-10 text-center">
        <span className="icon-tile size-16" style={{ "--hue": 248 } as CSSProperties}>
          <Icon name="cart" size={30} />
        </span>
        <h1 className="text-2xl font-bold">{t("emptyTitle")}</h1>
        <p className="text-muted">{t("emptyBody")}</p>
        <Link href="/categories" className={buttonClass("primary")}>
          {t("browse")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold sm:text-3xl">{t("title")}</h1>
      {c.merged && (
        <Alert tone="info">{c.merged.adjusted ? t("mergedAdjusted") : t("merged", { n: c.merged.lines })}</Alert>
      )}
      {setQty.isError && <Alert>{setQty.error instanceof ApiError ? setQty.error.message : t("updateError")}</Alert>}
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-4">
          {c.groups.map((g, gi) => (
            <section
              key={g.storeName}
              className="card rise overflow-hidden"
              style={{ "--d": `${gi * 60}ms` } as CSSProperties}
            >
              <header className="flex items-center justify-between border-b border-line bg-bg/60 px-5 py-3">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <Icon name="store" size={16} className="text-brand" />
                  {t("soldBy", { store: g.storeName })}
                </p>
                <p className="text-sm text-muted">{rupees(g.subtotalPaise)}</p>
              </header>
              <ul className="divide-y divide-line">
                {g.lines.map((l) => (
                  <Line
                    key={l.variantId}
                    line={l}
                    busy={setQty.isPending}
                    onQty={(qty) => setQty.mutate({ variantId: l.variantId, qty })}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>

        <aside className="card rise space-y-4 p-5 lg:sticky lg:top-24" aria-label={t("summary")}>
          <h2 className="text-lg font-semibold">{t("summary")}</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">{t("items", { n: c.itemCount })}</dt>
              <dd>{rupees(c.mrpTotalPaise)}</dd>
            </div>
            {c.savingsPaise > 0 && (
              <div className="flex justify-between text-success">
                <dt>{t("savings")}</dt>
                <dd>−{rupees(c.savingsPaise)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-line pt-2 text-base font-bold">
              <dt>{t("subtotal")}</dt>
              <dd>{rupees(c.subtotalPaise)}</dd>
            </div>
          </dl>
          <p className="text-xs text-muted">{t("deliveryNote")}</p>
          {(c.electronsNonMember > 0 || c.electronsMember > 0) && (
            <p className="flex items-start gap-2 rounded-xl bg-gold-soft/70 p-3 text-sm">
              <Icon name="coin" size={18} className="mt-0.5 shrink-0 text-gold" />
              <span>
                {c.electronsNonMember > 0 ? t("electrons", { n: c.electronsNonMember }) : t("electronsMin")}{" "}
                <span className="text-muted">{t("electronsMember", { n: c.electronsMember })}</span>
              </span>
            </p>
          )}
          {c.canCheckout ? (
            <Link href="/checkout" className={buttonClass("primary", "w-full")}>
              {t("checkout")}
              <Icon name="arrow" size={18} />
            </Link>
          ) : (
            <>
              <Button className="w-full" disabled>
                {t("checkout")}
              </Button>
              <p className="text-center text-xs text-muted">{t("fixProblems")}</p>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

function Line({ line: l, busy, onQty }: { line: CartLine; busy: boolean; onQty: (qty: number) => void }) {
  const t = useTranslations("cart");
  const attrs = Object.entries(l.attrs)
    .map(([k, v]) => `${k}: ${v}`)
    .join(" · ");
  const max = Math.min(10, Math.max(l.available, 0));
  const diff = l.pricePaise - l.priceAtAddPaise;
  return (
    <li className="flex gap-4 p-4 sm:p-5">
      {/* The product name beside it is the accessible link; this picture is a mouse shortcut only. */}
      <Link
        href={`/p/${l.slug}`}
        tabIndex={-1}
        aria-hidden
        className="block size-20 shrink-0 overflow-hidden rounded-xl bg-bg sm:size-24"
      >
        {l.coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- sized by the API
          <img
            src={l.coverUrl}
            alt=""
            className={`size-full object-cover ${l.problem === "UNAVAILABLE" ? "opacity-50 grayscale" : ""}`}
          />
        )}
      </Link>
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-muted">{l.brand}</p>
            <Link href={`/p/${l.slug}`} className="line-clamp-2 font-semibold hover:text-brand">
              {l.name}
            </Link>
            {attrs && <p className="text-xs text-muted">{attrs}</p>}
          </div>
          <p className="text-right">
            <span className="font-bold">{rupees(l.pricePaise * l.qty)}</span>
            {l.mrpPaise > l.pricePaise && (
              <span className="block text-xs text-muted line-through">{rupees(l.mrpPaise * l.qty)}</span>
            )}
          </p>
        </div>
        {diff !== 0 && l.problem !== "UNAVAILABLE" && (
          <p className={`text-xs font-medium ${diff < 0 ? "text-success" : "text-warning"}`}>
            {diff < 0 ? t("priceDown", { amount: rupees(-diff) }) : t("priceUp", { amount: rupees(diff) })}
          </p>
        )}
        {l.problem && (
          <p className="text-xs font-semibold text-danger">{t(`problem.${l.problem}`, { n: l.available })}</p>
        )}
        <div className="flex items-center gap-3 pt-1">
          {l.problem !== "UNAVAILABLE" && (
            <div
              className="inline-flex items-center rounded-full border border-line"
              role="group"
              aria-label={t("quantityFor", { name: l.name })}
            >
              <button
                type="button"
                className="inline-flex size-9 items-center justify-center rounded-full hover:bg-bg disabled:opacity-40"
                aria-label={t("decrease")}
                disabled={busy || l.qty <= 1}
                onClick={() => onQty(l.qty - 1)}
              >
                −
              </button>
              <span className="w-8 text-center text-sm font-semibold" aria-live="polite">
                {l.qty}
              </span>
              <button
                type="button"
                className="inline-flex size-9 items-center justify-center rounded-full hover:bg-bg disabled:opacity-40"
                aria-label={t("increase")}
                disabled={busy || l.qty >= max}
                onClick={() => onQty(l.qty + 1)}
              >
                +
              </button>
            </div>
          )}
          {l.problem === "LOW_STOCK" && max > 0 && (
            <Button variant="ghost" className="min-h-9 px-3" disabled={busy} onClick={() => onQty(max)}>
              {t("useAvailable", { n: max })}
            </Button>
          )}
          <button
            type="button"
            className="text-sm font-medium text-muted hover:text-danger"
            disabled={busy}
            onClick={() => onQty(0)}
          >
            {t("remove")}
          </button>
        </div>
      </div>
    </li>
  );
}
