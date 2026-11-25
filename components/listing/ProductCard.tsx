import Link from "next/link";
import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";
import type { ProductCardData } from "@/lib/search";
import { Icon } from "@/components/ui/Icon";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const rupees = (paise: number) => inr.format(Math.round(paise / 100));

// A product in a grid (UI-PUB-03): photo, badges, name, price against MRP, rating.
export function ProductCard({ p, index = 0 }: { p: ProductCardData; index?: number }) {
  const t = useTranslations("listing.card");
  return (
    <Link
      href={`/p/${p.slug}`}
      className="card card-hover rise group flex h-full flex-col overflow-hidden"
      style={{ "--d": `${Math.min(index, 12) * 35}ms` } as CSSProperties}
    >
      <div className="relative aspect-square overflow-hidden bg-bg">
        {p.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- the API already serves sized JPEGs
          <img
            src={p.coverUrl}
            alt=""
            loading="lazy"
            className={`size-full object-cover transition-transform duration-500 group-hover:scale-105 ${p.inStock ? "" : "opacity-60 grayscale"}`}
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted">
            <Icon name="camera" size={36} />
          </div>
        )}
        <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
          {p.discountPct >= 5 && (
            <span className="rounded-full bg-success px-2 py-0.5 text-xs font-bold text-white shadow-card">
              −{p.discountPct}%
            </span>
          )}
          {p.isLocal && (
            <span className="rounded-full bg-surface/90 px-2 py-0.5 text-xs font-semibold text-gold backdrop-blur">
              {t("local")}
            </span>
          )}
        </div>
        {!p.inStock && (
          <span className="absolute inset-x-2 bottom-2 rounded-full bg-ink/80 py-1 text-center text-xs font-semibold text-bg">
            {t("outOfStock")}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3.5">
        <p className="flex items-center gap-1 text-xs font-medium text-muted">
          {p.brand}
          {p.verifiedSeller && <Icon name="shield" size={13} label={t("verified")} className="text-brand" />}
        </p>
        <h3 className="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug group-hover:text-brand">{p.name}</h3>
        {p.ratingCount > 0 && (
          <p className="mt-1 inline-flex items-center gap-1 text-xs">
            <Icon name="star" size={13} filled className="text-gold" />
            <span className="font-semibold">{p.ratingAvg.toFixed(1)}</span>
            <span className="text-muted">({p.ratingCount})</span>
          </p>
        )}
        <p className="mt-auto flex flex-wrap items-baseline gap-x-2 pt-2">
          <span className="text-lg font-extrabold">{rupees(p.pricePaise)}</span>
          {p.mrpPaise > p.pricePaise && <span className="text-xs text-muted line-through">{rupees(p.mrpPaise)}</span>}
        </p>
      </div>
    </Link>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton aspect-square rounded-none" />
      <div className="space-y-2 p-3.5">
        <div className="skeleton h-3 w-1/3" />
        <div className="skeleton h-4 w-5/6" />
        <div className="skeleton h-5 w-1/2" />
      </div>
    </div>
  );
}
