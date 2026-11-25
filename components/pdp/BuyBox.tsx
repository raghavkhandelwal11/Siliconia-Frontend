"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState, type CSSProperties } from "react";
import { api, unwrap } from "@/lib/api/client";
import { optionGroups, pickVariant, type ProductPage } from "@/lib/pdp";
import { buttonClass } from "@/components/ui/Form";
import { Icon, type IconName } from "@/components/ui/Icon";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const rupees = (p: number) => inr.format(Math.round(p / 100));

const ACTION_ICON: Record<string, IconName> = {
  buy_now: "bolt",
  add_to_cart: "cart",
  wishlist: "heart",
  edit: "store",
  promote: "rocket",
  request_demo: "play",
  add_review: "star",
  hide: "x",
};

// UI-PUB-04/05: variant choice, price, stock, Electrons and the action area.
// Price, stock and actions come from the live block (never cached).
export function BuyBox({ product }: { product: ProductPage }) {
  const t = useTranslations("pdp.buy");
  const groups = optionGroups(product.variants);
  const [chosen, setChosen] = useState<Record<string, string>>(product.variants[0]?.attrs ?? {});
  const variant = pickVariant(product.variants, chosen);
  const live = useQuery({
    queryKey: ["product-live", product.id],
    queryFn: async () => unwrap(await api.GET("/products/{id}/live", { params: { path: { id: product.id } } })),
    staleTime: 15_000,
  });
  const lv = live.data?.variants.find((v) => v.id === variant?.id);
  const price = lv?.pricePaise ?? variant?.pricePaise ?? 0;
  const mrp = lv?.mrpPaise ?? variant?.mrpPaise ?? 0;
  const off = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

  return (
    <div className="space-y-5">
      <div>
        <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-3xl font-extrabold tracking-tight">{rupees(price)}</span>
          {off > 0 && (
            <>
              <span className="text-muted line-through">{rupees(mrp)}</span>
              <span className="rounded-full bg-success/15 px-2 py-0.5 text-sm font-bold text-success">
                {t("off", { pct: off })}
              </span>
            </>
          )}
        </p>
        <p className="mt-1 text-sm text-muted">{t("inclusive")}</p>
      </div>

      {Object.entries(groups).map(([name, values]) => (
        <fieldset key={name}>
          <legend className="text-sm font-semibold">
            {name}: <span className="font-normal text-muted">{chosen[name]}</span>
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {values.map((v) => {
              const on = chosen[name] === v;
              return (
                <label
                  key={v}
                  className={`cursor-pointer rounded-xl border px-3.5 py-2 text-sm transition ${on ? "border-brand bg-brand-soft font-semibold text-brand shadow-card" : "border-line hover:border-brand/40"}`}
                >
                  <input
                    type="radio"
                    name={name}
                    value={v}
                    checked={on}
                    onChange={() => setChosen({ ...chosen, [name]: v })}
                    className="sr-only"
                  />
                  {v}
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}

      <StockLine available={lv?.available} loading={live.isPending} />

      {lv && (lv.electronsNonMember > 0 || lv.electronsMember > 0) && (
        <div className="flex items-start gap-3 rounded-2xl border border-line bg-gold-soft/60 p-3.5">
          <span className="icon-tile size-10" style={{ "--hue": 40 } as CSSProperties}>
            <Icon name="coin" size={20} />
          </span>
          <div className="text-sm">
            <p className="font-semibold">
              {live.data?.isMember
                ? t("electronsMember", { n: lv.electronsMember })
                : lv.electronsNonMember > 0
                  ? t("electrons", { n: lv.electronsNonMember })
                  : t("electronsNone")}
            </p>
            {!live.data?.isMember && lv.electronsMember > 0 && (
              <p className="text-muted">
                {t("electronsUpsell", { n: lv.electronsMember })}{" "}
                <Link href="/membership" className="font-semibold text-brand">
                  {t("electra")}
                </Link>
              </p>
            )}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {live.isPending && <div className="skeleton h-12" />}
        {live.data?.actions.map((a, i) =>
          a.enabled && a.href ? (
            <Link key={a.key} href={a.href} className={buttonClass(i === 0 ? "primary" : "secondary", "w-full")}>
              <Icon name={ACTION_ICON[a.key] ?? "arrow"} size={18} />
              {t(`action.${a.key}`)}
            </Link>
          ) : (
            <div key={a.key}>
              <button
                type="button"
                disabled={!a.enabled}
                className={buttonClass(i === 0 ? "primary" : "secondary", "w-full")}
              >
                <Icon name={ACTION_ICON[a.key] ?? "arrow"} size={18} />
                {t(`action.${a.key}`)}
              </button>
              {a.reason && i === 0 && (
                <p className="mt-1.5 text-center text-xs text-muted">
                  {a.reason === "SIGN_IN" ? (
                    <Link href={`/auth/sign-in?next=/p/${product.slug}`} className="font-semibold text-brand">
                      {t("reason.SIGN_IN")}
                    </Link>
                  ) : (
                    t(`reason.${a.reason}`)
                  )}
                </p>
              )}
            </div>
          ),
        )}
      </div>

      <ul className="grid gap-2 text-sm sm:grid-cols-2">
        {(["returns", "delivery"] as const).map((k) => (
          <li key={k} className="flex items-center gap-2 rounded-xl border border-line p-2.5">
            <Icon name={k === "returns" ? "returns" : "truck"} size={18} className="text-brand" />
            {t(`perk.${k}`)}
          </li>
        ))}
      </ul>
    </div>
  );
}

function StockLine({ available, loading }: { available?: number; loading: boolean }) {
  const t = useTranslations("pdp.buy");
  if (loading || available === undefined) return <div className="skeleton h-5 w-40" />;
  if (available <= 0) return <p className="font-semibold text-danger">{t("outOfStock")}</p>;
  if (available < 10) return <p className="font-semibold text-warning">{t("onlyLeft", { n: available })}</p>;
  return (
    <p className="inline-flex items-center gap-2 font-medium text-success">
      <span className="live-dot" />
      {t("inStock", { n: available })}
    </p>
  );
}
