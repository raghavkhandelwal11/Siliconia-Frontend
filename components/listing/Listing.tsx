"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useId, useState, type CSSProperties } from "react";
import { apiBaseUrl } from "@/lib/api/client";
import { toggleListValue, type SearchResult, type SpecFacet } from "@/lib/search";
import { Button, buttonClass } from "@/components/ui/Form";
import { Icon } from "@/components/ui/Icon";
import { ProductCard, ProductCardSkeleton } from "./ProductCard";

const SORTS = ["relevance", "price_asc", "price_desc", "newest", "rating", "popular"] as const;
const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const rupees = (paise: number) => inr.format(Math.round(paise / 100));

/** Reads and writes listing filters in the URL (the single source of truth). */
function useFilters() {
  const params = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const set = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(changes)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    next.delete("page");
    const qs = next.toString();
    router.push(qs ? `${path}?${qs}` : path, { scroll: false });
  };
  return { params, set };
}

// UI-PUB-03: results with filters, sort, chips and "Load more" (FR-CAT-04).
export function Listing({
  result,
  title,
  subtitle,
  fixed = {},
  titleHidden = false,
}: {
  result: SearchResult;
  title: string;
  subtitle?: string;
  /** Parameters the page always applies, such as the category of /c/[slug]. */
  fixed?: Record<string, string>;
  /** The page already shows the title (category pages); keep it for screen readers. */
  titleHidden?: boolean;
}) {
  const t = useTranslations("listing");
  const { params, set } = useFilters();
  const [drawer, setDrawer] = useState(false);
  const active = activeFilters(params, result, t);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className={titleHidden ? "sr-only" : "text-2xl font-bold sm:text-3xl"}>{title}</h1>
          <p className={titleHidden ? "font-semibold" : "text-muted"}>{subtitle ?? t("count", { n: result.total })}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" className="lg:hidden" onClick={() => setDrawer(true)}>
            <Icon name="grid" size={16} />
            {t("filters")}
            {active.length > 0 && (
              <span className="rounded-full bg-brand px-1.5 text-xs text-white">{active.length}</span>
            )}
          </Button>
          <label className="flex items-center gap-2 text-sm">
            <span className="hidden text-muted sm:inline">{t("sortBy")}</span>
            <select
              className="min-h-11 rounded-full border border-line bg-surface px-4 text-sm font-medium outline-none transition focus:border-brand"
              value={params.get("sort") ?? "relevance"}
              onChange={(e) => set({ sort: e.target.value === "relevance" ? null : e.target.value })}
              aria-label={t("sortBy")}
            >
              {SORTS.map((s) => (
                <option key={s} value={s}>
                  {t(`sort.${s}`)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      {active.length > 0 && (
        <ul className="flex flex-wrap items-center gap-2" aria-label={t("activeFilters")}>
          {active.map((a) => (
            <li key={a.key}>
              <button
                type="button"
                onClick={() => set(a.clear)}
                className="pop inline-flex items-center gap-1.5 rounded-full border border-brand/40 bg-brand-soft px-3 py-1 text-sm font-medium text-brand transition hover:bg-brand hover:text-white"
                aria-label={t("removeFilter", { filter: a.label })}
              >
                {a.label}
                <Icon name="x" size={14} />
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              className="text-sm font-semibold text-muted underline-offset-2 hover:text-ink hover:underline"
              onClick={() => set(Object.fromEntries(active.flatMap((a) => Object.keys(a.clear)).map((k) => [k, null])))}
            >
              {t("clearAll")}
            </button>
          </li>
        </ul>
      )}

      <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
        <aside className="hidden lg:block" aria-label={t("filters")}>
          <div className="card sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto p-4">
            <FilterPanel result={result} />
          </div>
        </aside>
        <Results key={params.toString()} result={result} fixed={fixed} />
      </div>

      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={t("filters")}>
          <button
            type="button"
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            aria-label={t("close")}
            onClick={() => setDrawer(false)}
          />
          <div className="pop absolute inset-y-0 right-0 flex w-[min(22rem,92vw)] flex-col bg-surface shadow-lift">
            <div className="flex items-center justify-between border-b border-line p-4">
              <h2 className="text-lg font-semibold">{t("filters")}</h2>
              <button
                type="button"
                className="inline-flex size-10 items-center justify-center rounded-full hover:bg-bg"
                aria-label={t("close")}
                onClick={() => setDrawer(false)}
              >
                <Icon name="x" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <FilterPanel result={result} />
            </div>
            <div className="border-t border-line p-4">
              <Button className="w-full" onClick={() => setDrawer(false)}>
                {t("showResults", { n: result.total })}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- Results with "Load more" ---------------- */

function Results({ result, fixed }: { result: SearchResult; fixed: Record<string, string> }) {
  const t = useTranslations("listing");
  const params = useSearchParams();
  const [items, setItems] = useState(result.items);
  const [page, setPage] = useState(result.page);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function more() {
    setLoading(true);
    setError(false);
    try {
      const q = new URLSearchParams(params.toString());
      q.set("page", String(page + 1));
      for (const [k, v] of Object.entries(fixed)) q.set(k, v);
      const res = await fetch(new Request(`${apiBaseUrl()}/products?${q}`));
      if (!res.ok) throw new Error(String(res.status));
      const next = (await res.json()) as SearchResult;
      setItems((cur) => [...cur, ...next.items]);
      setPage(next.page);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  if (result.total === 0) {
    return (
      <div className="card rise flex flex-col items-center gap-3 p-10 text-center">
        <span className="icon-tile size-14" style={{ "--hue": 248 } as CSSProperties}>
          <Icon name="search" size={28} />
        </span>
        <h2 className="text-lg font-semibold">{t("emptyTitle")}</h2>
        <p className="max-w-sm text-muted">{t("emptyBody")}</p>
        <Link href="/categories" className={buttonClass("secondary")}>
          {t("browse")}
        </Link>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
        {items.map((p, i) => (
          <li key={p.id}>
            <ProductCard p={p} index={i % result.pageSize} />
          </li>
        ))}
        {loading &&
          Array.from({ length: 4 }, (_, i) => (
            <li key={`sk-${i}`}>
              <ProductCardSkeleton />
            </li>
          ))}
      </ul>
      <div className="flex flex-col items-center gap-2 text-sm text-muted">
        <p>{t("showing", { shown: items.length, total: result.total })}</p>
        <div className="h-1.5 w-48 overflow-hidden rounded-full bg-line">
          <div
            className="bg-brand-gradient h-full rounded-full transition-all duration-500"
            style={{ width: `${(items.length / result.total) * 100}%` }}
          />
        </div>
        {error && <p className="text-danger">{t("loadError")}</p>}
        {items.length < result.total && page < 100 && (
          <Button variant="secondary" disabled={loading} onClick={more}>
            {loading ? t("loading") : t("loadMore")}
          </Button>
        )}
      </div>
    </div>
  );
}

/* ---------------- Filters ---------------- */

function Section({ title, children, open = true }: { title: string; children: React.ReactNode; open?: boolean }) {
  return (
    <details open={open} className="group border-b border-line py-3 last:border-0">
      <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold">
        {title}
        <Icon name="chevron" size={16} className="rotate-90 text-muted transition-transform group-open:-rotate-90" />
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}

function Check({
  label,
  count,
  checked,
  onChange,
}: {
  label: string;
  count?: number;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1 py-1 text-sm transition hover:bg-bg">
      <input type="checkbox" className="size-4 accent-[var(--color-brand)]" checked={checked} onChange={onChange} />
      <span className="flex-1">{label}</span>
      {count !== undefined && <span className="text-xs text-muted">{count}</span>}
    </label>
  );
}

function FilterPanel({ result }: { result: SearchResult }) {
  const t = useTranslations("listing");
  const { params, set } = useFilters();
  const f = result.facets;
  const brands = (params.get("brand") ?? "").toLowerCase().split(",").filter(Boolean);

  return (
    <div>
      {f.categories.length > 1 && !result.category?.parentSlug && (
        <Section title={t("category")}>
          <ul className="space-y-0.5">
            {f.categories.map((c) => (
              <li key={c.value}>
                <Link
                  href={`/c/${c.value}${params.get("q") ? `?q=${encodeURIComponent(params.get("q")!)}` : ""}`}
                  className="flex justify-between rounded-lg px-1 py-1 text-sm transition hover:bg-bg hover:text-brand"
                >
                  {c.label}
                  <span className="text-xs text-muted">{c.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {f.price && f.price[1] > f.price[0] && (
        <PriceFilter key={`${params.get("priceMin")}-${params.get("priceMax")}`} bounds={[f.price[0], f.price[1]]} />
      )}

      {f.brands.length > 0 && (
        <Section title={t("brand")}>
          {f.brands.map((b) => (
            <Check
              key={b.value}
              label={b.value}
              count={b.count}
              checked={brands.includes(b.value.toLowerCase())}
              onChange={() => set({ brand: toggleListValue(params.get("brand"), b.value) })}
            />
          ))}
        </Section>
      )}

      <Section title={t("more")}>
        <Check
          label={t("inStock")}
          checked={params.get("inStock") === "true"}
          onChange={() => set({ inStock: params.get("inStock") === "true" ? null : "true" })}
        />
        <Check
          label={t("local")}
          checked={params.get("local") === "true"}
          onChange={() => set({ local: params.get("local") === "true" ? null : "true" })}
        />
        <Check
          label={t("verified")}
          checked={params.get("verified") === "true"}
          onChange={() => set({ verified: params.get("verified") === "true" ? null : "true" })}
        />
        <Check
          label={t("rating4")}
          checked={params.get("rating") === "4"}
          onChange={() => set({ rating: params.get("rating") === "4" ? null : "4" })}
        />
      </Section>

      {f.specs.map((s) => (
        <SpecFilter key={`${s.key}-${params.get(`spec.${s.key}`)}`} facet={s} />
      ))}
    </div>
  );
}

function PriceFilter({ bounds }: { bounds: [number, number] }) {
  const t = useTranslations("listing");
  const { params, set } = useFilters();
  const id = useId();
  const [min, setMin] = useState(params.get("priceMin") ? String(Number(params.get("priceMin")) / 100) : "");
  const [max, setMax] = useState(params.get("priceMax") ? String(Number(params.get("priceMax")) / 100) : "");
  const apply = () =>
    set({
      priceMin: min ? String(Math.round(Number(min) * 100)) : null,
      priceMax: max ? String(Math.round(Number(max) * 100)) : null,
    });
  const box = "min-h-10 w-full rounded-lg border border-line bg-surface px-2.5 text-sm outline-none focus:border-brand";
  return (
    <Section title={t("price")}>
      <form
        className="flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          apply();
        }}
      >
        <label className="flex-1 text-xs text-muted" htmlFor={`${id}-min`}>
          {t("min")}
          <input
            id={`${id}-min`}
            className={box}
            inputMode="numeric"
            placeholder={rupees(bounds[0])}
            value={min}
            onChange={(e) => setMin(e.target.value.replace(/[^\d]/g, ""))}
          />
        </label>
        <label className="flex-1 text-xs text-muted" htmlFor={`${id}-max`}>
          {t("max")}
          <input
            id={`${id}-max`}
            className={box}
            inputMode="numeric"
            placeholder={rupees(bounds[1])}
            value={max}
            onChange={(e) => setMax(e.target.value.replace(/[^\d]/g, ""))}
          />
        </label>
        <Button type="submit" variant="secondary" className="min-h-10 px-3" aria-label={t("apply")}>
          <Icon name="arrow" size={16} />
        </Button>
      </form>
    </Section>
  );
}

function SpecFilter({ facet }: { facet: SpecFacet }) {
  const t = useTranslations("listing");
  const { params, set } = useFilters();
  const key = `spec.${facet.key}`;
  const current = params.get(key);
  const id = useId();
  const [lo, hi] = (current ?? "").split("..");
  const [range, setRange] = useState({ lo: lo ?? "", hi: hi ?? "" });
  const title = facet.unit ? `${facet.label} (${facet.unit})` : facet.label;

  if (facet.type === "number") {
    const box =
      "min-h-10 w-full rounded-lg border border-line bg-surface px-2.5 text-sm outline-none focus:border-brand";
    return (
      <Section title={title} open={Boolean(current)}>
        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            set({ [key]: range.lo || range.hi ? `${range.lo}..${range.hi}` : null });
          }}
        >
          <label className="flex-1 text-xs text-muted" htmlFor={`${id}-lo`}>
            {t("min")}
            <input
              id={`${id}-lo`}
              className={box}
              inputMode="decimal"
              placeholder={String(facet.min ?? "")}
              value={range.lo}
              onChange={(e) => setRange({ ...range, lo: e.target.value.replace(/[^\d.]/g, "") })}
            />
          </label>
          <label className="flex-1 text-xs text-muted" htmlFor={`${id}-hi`}>
            {t("max")}
            <input
              id={`${id}-hi`}
              className={box}
              inputMode="decimal"
              placeholder={String(facet.max ?? "")}
              value={range.hi}
              onChange={(e) => setRange({ ...range, hi: e.target.value.replace(/[^\d.]/g, "") })}
            />
          </label>
          <Button
            type="submit"
            variant="secondary"
            className="min-h-10 px-3"
            aria-label={t("applyFilter", { filter: facet.label })}
          >
            <Icon name="arrow" size={16} />
          </Button>
        </form>
      </Section>
    );
  }
  if (facet.type === "boolean") {
    const on = current === "true";
    return (
      <Section title={facet.label} open={on}>
        <Check
          label={t("yesOnly")}
          count={facet.options?.[0]?.count}
          checked={on}
          onChange={() => set({ [key]: on ? null : "true" })}
        />
      </Section>
    );
  }
  const chosen = (current ?? "").split(",").filter(Boolean);
  return (
    <Section title={title} open={chosen.length > 0 || (facet.options?.length ?? 0) <= 6}>
      {facet.options?.map((o) => (
        <Check
          key={o.value}
          label={o.value}
          count={o.count}
          checked={chosen.includes(o.value)}
          onChange={() => set({ [key]: toggleListValue(current, o.value) })}
        />
      ))}
    </Section>
  );
}

/* ---------------- Active filter chips ---------------- */

type Active = { key: string; label: string; clear: Record<string, string | null> };

function activeFilters(params: URLSearchParams, result: SearchResult, t: ReturnType<typeof useTranslations>): Active[] {
  const out: Active[] = [];
  for (const b of (params.get("brand") ?? "").split(",").filter(Boolean)) {
    out.push({ key: `brand-${b}`, label: b, clear: { brand: toggleListValue(params.get("brand"), b) || null } });
  }
  const lo = params.get("priceMin");
  const hi = params.get("priceMax");
  if (lo || hi) {
    const label =
      lo && hi
        ? `${rupees(+lo)} – ${rupees(+hi)}`
        : lo
          ? t("from", { price: rupees(+lo) })
          : t("upTo", { price: rupees(+hi!) });
    out.push({ key: "price", label, clear: { priceMin: null, priceMax: null } });
  }
  for (const [k, label] of [
    ["inStock", t("inStock")],
    ["local", t("local")],
    ["verified", t("verified")],
  ] as const) {
    if (params.get(k) === "true") out.push({ key: k, label, clear: { [k]: null } });
  }
  if (params.get("rating")) out.push({ key: "rating", label: t("rating4"), clear: { rating: null } });
  for (const [k, v] of params.entries()) {
    if (!k.startsWith("spec.")) continue;
    const facet = result.facets.specs.find((s) => `spec.${s.key}` === k);
    const name = facet?.label ?? k.slice(5);
    if (v.includes("..")) {
      const [a, b] = v.split("..");
      out.push({
        key: k,
        label: `${name}: ${a || "…"}–${b || "…"}${facet?.unit ? ` ${facet.unit}` : ""}`,
        clear: { [k]: null },
      });
    } else if (v === "true" || v === "false") {
      out.push({ key: k, label: `${name}: ${v === "true" ? t("yes") : t("no")}`, clear: { [k]: null } });
    } else {
      for (const x of v.split(",").filter(Boolean)) {
        out.push({ key: `${k}-${x}`, label: x, clear: { [k]: toggleListValue(v, x) || null } });
      }
    }
  }
  return out;
}
