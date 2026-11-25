"use client";

import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRef, useState, type CSSProperties } from "react";
import { api, ApiError, unwrap } from "@/lib/api/client";
import {
  discountPct,
  formatPaise,
  productKey,
  productsKey,
  toPaise,
  toRupees,
  uploadImage,
  useProduct,
  type FieldError,
  type ProductEditor as Product,
} from "@/lib/products";
import { Alert, Button, Card, Field } from "@/components/ui/Form";
import { Icon } from "@/components/ui/Icon";
import { CategoryTile } from "@/components/catalogue/CategoryIcon";
import { ProductStatus } from "./ProductStatus";
import { SpecInput } from "./SpecInput";

const message = (e: unknown, fallback: string) => (e instanceof ApiError ? e.message : fallback);

// UI-SEL-03: the product editor (FR-SEL-02). Each section saves on its own;
// the side panel shows what publishing still needs.
export function ProductEditor({ id }: { id: string }) {
  const t = useTranslations("products.editor");
  const product = useProduct(id);
  if (product.isPending) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-4">
          <div className="skeleton h-10 w-2/3" />
          <div className="skeleton h-72" />
        </div>
        <div className="skeleton h-64" />
      </div>
    );
  }
  if (product.isError || !product.data) return <Alert>{t("loadError")}</Alert>;
  const p = product.data;
  return (
    <div className="space-y-6">
      <Link href="/seller/products" className="inline-flex items-center gap-1 text-sm font-semibold text-brand">
        <Icon name="arrow" size={16} className="rotate-180" />
        {t("back")}
      </Link>
      <header className="flex flex-wrap items-center gap-4">
        <CategoryTile icon={p.category.parentIcon} size={52} />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted">
            {p.category.parentName} / {p.category.name}
          </p>
          <h1 className="truncate text-2xl font-bold sm:text-3xl">{p.name}</h1>
        </div>
        <ProductStatus status={p.status} />
      </header>
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <Details key={`${p.id}-${p.category.id}`} product={p} />
          <Variants key={`v-${p.id}`} product={p} />
          <Images product={p} />
        </div>
        <Publish product={p} />
      </div>
    </div>
  );
}

function useSave(id: string) {
  const qc = useQueryClient();
  return (p: Product) => {
    qc.setQueryData(productKey(id), p);
    void qc.invalidateQueries({ queryKey: productsKey });
  };
}

/* ---------------- Details and specifications ---------------- */

function Details({ product }: { product: Product }) {
  const t = useTranslations("products.editor");
  const save = useSave(product.id);
  const [form, setForm] = useState({
    name: product.name,
    brand: product.brand,
    model: product.model,
    description: product.description,
    warranty: product.warranty,
    originCountry: product.originCountry,
    isLocal: product.isLocal,
  });
  const [specs, setSpecs] = useState<Record<string, unknown>>(product.specs);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<{ busy: boolean; error?: string; saved?: boolean }>({ busy: false });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState({ busy: true });
    setFieldErrors({});
    const res = await api.PUT("/seller/products/{id}", {
      params: { path: { id: product.id } },
      body: { ...form, categoryId: product.category.id, specs, version: product.version },
    });
    if (res.response.ok && res.data) {
      save(res.data);
      setState({ busy: false, saved: true });
      return;
    }
    const err = (res.error ?? {}) as { code?: string; title?: string; detail?: string; fields?: FieldError[] };
    if (err.code === "SPECS_INVALID" && err.fields) {
      setFieldErrors(Object.fromEntries(err.fields.map((f) => [f.key, f.message])));
    }
    setState({ busy: false, error: err.detail ?? err.title ?? t("saveError") });
  }

  const problems = Object.fromEntries(product.specProblems.map((f) => [f.key, f.message]));
  const descLeft = 30 - form.description.trim().length;

  return (
    <Card>
      <form onSubmit={submit} className="space-y-6">
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">{t("details.title")}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={t("details.name")}
              value={form.name}
              maxLength={150}
              required
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="sm:col-span-2"
            />
            <Field
              label={t("details.brand")}
              value={form.brand}
              maxLength={60}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
            />
            <Field
              label={t("details.model")}
              value={form.model}
              maxLength={80}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium">
              {t("details.description")}
            </label>
            <textarea
              id="description"
              className="mt-1.5 min-h-32 w-full rounded-xl border border-line bg-surface p-3 text-base outline-none transition focus:border-brand"
              maxLength={5000}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              aria-describedby="description-hint"
            />
            <p id="description-hint" className="text-sm text-muted">
              {descLeft > 0 ? t("details.descriptionLeft", { n: descLeft }) : t("details.descriptionOk")}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={t("details.warranty")}
              hint={t("details.warrantyHint")}
              value={form.warranty}
              maxLength={200}
              onChange={(e) => setForm({ ...form, warranty: e.target.value })}
            />
            <Field
              label={t("details.origin")}
              hint={t("details.originHint")}
              value={form.originCountry}
              maxLength={2}
              autoCapitalize="characters"
              onChange={(e) => setForm({ ...form, originCountry: e.target.value.toUpperCase() })}
            />
          </div>
          <label className="flex items-center gap-3 rounded-xl border border-line p-3 text-sm">
            <input
              type="checkbox"
              className="size-4"
              checked={form.isLocal}
              onChange={(e) => setForm({ ...form, isLocal: e.target.checked })}
            />
            <span>
              <span className="font-semibold">{t("details.local")}</span>
              <span className="block text-muted">{t("details.localHint")}</span>
            </span>
          </label>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">{t("specs.title")}</h2>
            <p className="text-sm text-muted">{t("specs.intro", { category: product.category.name })}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {product.specSchema.fields.map((f) => (
              <SpecInput
                key={f.key}
                field={f}
                value={specs[f.key]}
                error={
                  fieldErrors[f.key] ??
                  (state.saved
                    ? undefined
                    : problems[f.key] && specs[f.key] !== undefined
                      ? problems[f.key]
                      : undefined)
                }
                onChange={(v) => {
                  const next = { ...specs };
                  if (v === undefined) delete next[f.key];
                  else next[f.key] = v;
                  setSpecs(next);
                }}
              />
            ))}
          </div>
        </section>

        {state.error && <Alert>{state.error}</Alert>}
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={state.busy}>
            {state.busy ? t("saving") : t("details.save")}
          </Button>
          {state.saved && (
            <span role="status" className="pop inline-flex items-center gap-1 text-sm text-success">
              <Icon name="check" size={16} />
              {t("saved")}
            </span>
          )}
        </div>
      </form>
    </Card>
  );
}

/* ---------------- Variants and stock ---------------- */

type Row = {
  key: string;
  id?: string;
  sku: string;
  values: Record<string, string>;
  mrp: string;
  price: string;
  stock: string;
  committed: number;
};

function rowsFrom(product: Product): { options: string[]; rows: Row[] } {
  const options = [...new Set(product.variants.flatMap((v) => Object.keys(v.attrs)))].slice(0, 3);
  const rows = product.variants.map((v) => ({
    key: v.id,
    id: v.id,
    sku: v.sku,
    values: v.attrs,
    mrp: toRupees(v.mrpPaise),
    price: toRupees(v.pricePaise),
    stock: String(v.stock),
    committed: v.reserved + v.sold,
  }));
  return { options, rows };
}

let rowSeq = 0;
const newRow = (): Row => ({
  key: `new-${++rowSeq}`,
  sku: "",
  values: {},
  mrp: "",
  price: "",
  stock: "0",
  committed: 0,
});

function Variants({ product }: { product: Product }) {
  const t = useTranslations("products.editor.variants");
  const te = useTranslations("products.editor");
  const save = useSave(product.id);
  const initial = rowsFrom(product);
  const [options, setOptions] = useState<string[]>(initial.options);
  const [rows, setRows] = useState<Row[]>(initial.rows.length ? initial.rows : [newRow()]);
  const [newOption, setNewOption] = useState("");
  const [state, setState] = useState<{ busy: boolean; error?: string; saved?: boolean }>({ busy: false });

  const update = (key: string, patch: Partial<Row>) =>
    setRows(rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  async function submit() {
    setState({ busy: true });
    try {
      const body = rows.map((r) => ({
        id: r.id,
        sku: r.sku.trim(),
        attrs: Object.fromEntries(options.map((o) => [o, (r.values[o] ?? "").trim()]).filter(([, v]) => v)),
        mrpPaise: toPaise(r.mrp),
        pricePaise: toPaise(r.price),
        stock: Number(r.stock) || 0,
      }));
      if (body.some((b) => Number.isNaN(b.mrpPaise) || Number.isNaN(b.pricePaise))) {
        setState({ busy: false, error: t("badAmount") });
        return;
      }
      const p = unwrap(
        await api.PUT("/seller/products/{id}/variants", {
          params: { path: { id: product.id } },
          body: { variants: body },
        }),
      );
      save(p);
      setRows(rowsFrom(p).rows);
      setState({ busy: false, saved: true });
    } catch (e) {
      setState({ busy: false, error: message(e, te("saveError")) });
    }
  }

  const cell =
    "min-h-10 w-full rounded-lg border border-line bg-surface px-2.5 text-sm outline-none transition focus:border-brand";
  return (
    <Card>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{t("title")}</h2>
          <p className="text-sm text-muted">{t("intro")}</p>
        </div>
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const o = newOption.trim();
            if (o && !options.includes(o) && options.length < 3) setOptions([...options, o]);
            setNewOption("");
          }}
        >
          <label htmlFor="new-option" className="sr-only">
            {t("addOption")}
          </label>
          <input
            id="new-option"
            className={`${cell} w-36`}
            placeholder={t("optionPlaceholder")}
            value={newOption}
            maxLength={20}
            onChange={(e) => setNewOption(e.target.value)}
          />
          <Button type="submit" variant="secondary" disabled={!newOption.trim() || options.length >= 3}>
            {t("addOption")}
          </Button>
        </form>
      </div>
      {options.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {options.map((o) => (
            <li
              key={o}
              className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-3 py-1 text-sm font-medium text-brand"
            >
              {o}
              <button
                type="button"
                aria-label={t("removeOption", { option: o })}
                onClick={() => setOptions(options.filter((x) => x !== o))}
              >
                <Icon name="x" size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <ul className="mt-4 space-y-3">
        {rows.map((r, i) => {
          const off = discountPct(toPaise(r.mrp), toPaise(r.price));
          return (
            <li
              key={r.key}
              className="rise rounded-2xl border border-line p-3"
              style={{ "--d": `${i * 30}ms` } as CSSProperties}
            >
              <div
                className="grid gap-2 sm:grid-cols-[minmax(8rem,1.2fr)_repeat(var(--opts),minmax(6rem,1fr))_7rem_7rem_5.5rem_auto]"
                style={{ "--opts": options.length } as CSSProperties}
              >
                <label className="text-xs text-muted">
                  {t("sku")}
                  <input
                    className={cell}
                    value={r.sku}
                    maxLength={40}
                    onChange={(e) => update(r.key, { sku: e.target.value })}
                  />
                </label>
                {options.map((o) => (
                  <label key={o} className="text-xs text-muted">
                    {o}
                    <input
                      className={cell}
                      value={r.values[o] ?? ""}
                      maxLength={40}
                      onChange={(e) => update(r.key, { values: { ...r.values, [o]: e.target.value } })}
                    />
                  </label>
                ))}
                <label className="text-xs text-muted">
                  {t("mrp")}
                  <input
                    className={cell}
                    inputMode="decimal"
                    value={r.mrp}
                    onChange={(e) => update(r.key, { mrp: e.target.value })}
                  />
                </label>
                <label className="text-xs text-muted">
                  {t("price")}
                  <input
                    className={cell}
                    inputMode="decimal"
                    value={r.price}
                    onChange={(e) => update(r.key, { price: e.target.value })}
                  />
                </label>
                <label className="text-xs text-muted">
                  {t("stock")}
                  <input
                    className={cell}
                    inputMode="numeric"
                    value={r.stock}
                    onChange={(e) => update(r.key, { stock: e.target.value.replace(/\D/g, "") })}
                  />
                </label>
                <div className="flex items-end">
                  <button
                    type="button"
                    className="inline-flex size-10 items-center justify-center rounded-full text-muted transition hover:bg-danger/10 hover:text-danger disabled:opacity-40"
                    aria-label={t("remove", { sku: r.sku || i + 1 })}
                    disabled={rows.length === 1 || r.committed > 0}
                    title={r.committed > 0 ? t("inUse") : undefined}
                    onClick={() => setRows(rows.filter((x) => x.key !== r.key))}
                  >
                    <Icon name="x" size={18} />
                  </button>
                </div>
              </div>
              {(off > 0 || r.committed > 0) && (
                <p className="mt-2 flex flex-wrap gap-3 text-xs">
                  {off > 0 && (
                    <span className="font-semibold text-success">
                      {t("off", { pct: off, price: formatPaise(toPaise(r.price)) })}
                    </span>
                  )}
                  {r.committed > 0 && <span className="text-muted">{t("committed", { n: r.committed })}</span>}
                </p>
              )}
            </li>
          );
        })}
      </ul>
      {state.error && (
        <div className="mt-3">
          <Alert>{state.error}</Alert>
        </div>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="secondary"
          disabled={rows.length >= 50}
          onClick={() => setRows([...rows, newRow()])}
        >
          {t("add")}
        </Button>
        <Button type="button" disabled={state.busy} onClick={submit}>
          {state.busy ? te("saving") : t("save")}
        </Button>
        {state.saved && (
          <span role="status" className="pop inline-flex items-center gap-1 text-sm text-success">
            <Icon name="check" size={16} />
            {te("saved")}
          </span>
        )}
      </div>
    </Card>
  );
}

/* ---------------- Images ---------------- */

function Images({ product }: { product: Product }) {
  const t = useTranslations("products.editor.images");
  const te = useTranslations("products.editor");
  const save = useSave(product.id);
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const images = product.images;

  async function persist(list: { uploadId: string; alt: string }[]) {
    try {
      save(
        unwrap(
          await api.PUT("/seller/products/{id}/images", {
            params: { path: { id: product.id } },
            body: { images: list },
          }),
        ),
      );
    } catch (e) {
      setError(message(e, te("saveError")));
    }
  }

  async function add(files: FileList | File[]) {
    setError(null);
    const room = 10 - images.length;
    const picked = Array.from(files).slice(0, Math.max(0, room));
    if (picked.length === 0) {
      setError(t("full"));
      return;
    }
    setUploading(picked.length);
    const done: { uploadId: string; alt: string }[] = [];
    for (const f of picked) {
      try {
        const up = await uploadImage(f);
        done.push({ uploadId: up.id, alt: "" });
      } catch (e) {
        setError(`${f.name}: ${message(e, t("uploadError"))}`);
      }
      setUploading((n) => n - 1);
    }
    if (done.length) await persist([...images.map((i) => ({ uploadId: i.uploadId, alt: i.alt })), ...done]);
  }

  const list = images.map((i) => ({ uploadId: i.uploadId, alt: i.alt }));
  const move = (from: number, to: number) => {
    const next = [...list];
    const [x] = next.splice(from, 1);
    next.splice(to, 0, x);
    void persist(next);
  };

  return (
    <Card>
      <h2 className="text-lg font-semibold">{t("title")}</h2>
      <p className="text-sm text-muted">{t("intro")}</p>
      <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((im, i) => (
          <li key={im.uploadId} className="pop group relative overflow-hidden rounded-2xl border border-line bg-bg">
            {/* eslint-disable-next-line @next/next/no-img-element -- stored images are already sized by the API */}
            <img src={im.url} alt={im.alt || t("imageN", { n: i + 1 })} className="aspect-square w-full object-cover" />
            {i === 0 && (
              <span className="bg-brand-gradient absolute left-2 top-2 rounded-full px-2 py-0.5 text-xs font-semibold text-white">
                {t("cover")}
              </span>
            )}
            <div className="absolute right-2 top-2 flex gap-1 opacity-100 transition sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
              {i > 0 && (
                <button
                  type="button"
                  className="glass inline-flex size-8 items-center justify-center rounded-full"
                  aria-label={t("moveLeft")}
                  onClick={() => move(i, i - 1)}
                >
                  <Icon name="arrow" size={14} className="rotate-180" />
                </button>
              )}
              {i < images.length - 1 && (
                <button
                  type="button"
                  className="glass inline-flex size-8 items-center justify-center rounded-full"
                  aria-label={t("moveRight")}
                  onClick={() => move(i, i + 1)}
                >
                  <Icon name="arrow" size={14} />
                </button>
              )}
              <button
                type="button"
                className="glass inline-flex size-8 items-center justify-center rounded-full text-danger"
                aria-label={t("remove")}
                onClick={() => void persist(list.filter((_, j) => j !== i))}
              >
                <Icon name="x" size={14} />
              </button>
            </div>
            <label className="block p-2">
              <span className="sr-only">{t("alt")}</span>
              <input
                className="w-full rounded-lg border border-transparent bg-transparent px-2 py-1 text-xs outline-none focus:border-brand focus:bg-surface"
                placeholder={t("altPlaceholder")}
                defaultValue={im.alt}
                maxLength={150}
                onBlur={(e) => {
                  if (e.target.value !== im.alt)
                    void persist(list.map((x, j) => (j === i ? { ...x, alt: e.target.value } : x)));
                }}
              />
            </label>
          </li>
        ))}
        {Array.from({ length: uploading }, (_, i) => (
          <li key={`up-${i}`} className="skeleton aspect-square rounded-2xl" aria-label={t("uploading")} />
        ))}
        {images.length + uploading < 10 && (
          <li>
            <button
              type="button"
              onClick={() => input.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDrag(true);
              }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDrag(false);
                void add(e.dataTransfer.files);
              }}
              className={`flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-3 text-center text-sm transition ${drag ? "border-brand bg-brand-soft text-brand" : "border-line text-muted hover:border-brand/50 hover:text-brand"}`}
            >
              <Icon name="camera" size={28} />
              <span className="font-semibold">{t("add")}</span>
              <span className="text-xs">{t("rules")}</span>
            </button>
            <input
              ref={input}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="sr-only"
              aria-label={t("add")}
              onChange={(e) => {
                if (e.target.files) void add(e.target.files);
                e.target.value = "";
              }}
            />
          </li>
        )}
      </ul>
      {error && (
        <div className="mt-3">
          <Alert>{error}</Alert>
        </div>
      )}
    </Card>
  );
}

/* ---------------- Publish ---------------- */

const CHECKS = ["brand", "description", "warranty", "specs", "variants", "images"] as const;

function Publish({ product }: { product: Product }) {
  const t = useTranslations("products.editor.publish");
  const save = useSave(product.id);
  const [state, setState] = useState<{ busy: boolean; error?: string }>({ busy: false });
  const ready = product.missing.length === 0;
  const done = CHECKS.length - product.missing.length;

  async function setStatus(status: "ACTIVE" | "PAUSED") {
    setState({ busy: true });
    try {
      save(
        unwrap(
          await api.POST("/seller/products/{id}/status", { params: { path: { id: product.id } }, body: { status } }),
        ),
      );
      setState({ busy: false });
    } catch (e) {
      setState({ busy: false, error: message(e, t("error")) });
    }
  }

  return (
    <aside className="card rise space-y-4 p-5 lg:sticky lg:top-24">
      <div>
        <h2 className="text-lg font-semibold">{t("title")}</h2>
        <p className="text-sm text-muted">{t(`help.${product.status}`)}</p>
      </div>
      <div>
        <div className="flex justify-between text-xs text-muted">
          <span>{t("progress")}</span>
          <span>
            {done}/{CHECKS.length}
          </span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-line">
          <div
            className="bg-brand-gradient h-full rounded-full transition-all duration-500"
            style={{ width: `${(done / CHECKS.length) * 100}%` }}
          />
        </div>
      </div>
      <ul className="space-y-2 text-sm">
        {CHECKS.map((c) => {
          const ok = !product.missing.includes(c);
          return (
            <li key={c} className="flex items-center gap-2">
              <span
                className={`inline-flex size-5 items-center justify-center rounded-full ${ok ? "bg-success/15 text-success" : "border border-line text-transparent"}`}
              >
                <Icon name="check" size={13} />
              </span>
              <span className={ok ? "" : "text-muted"}>{t(`checks.${c}`)}</span>
              <span className="sr-only">{ok ? t("done") : t("todo")}</span>
            </li>
          );
        })}
      </ul>
      {state.error && <Alert>{state.error}</Alert>}
      {product.status === "ACTIVE" ? (
        <Button variant="secondary" className="w-full" disabled={state.busy} onClick={() => setStatus("PAUSED")}>
          {t("pause")}
        </Button>
      ) : (
        <Button className="w-full" disabled={state.busy || !ready} onClick={() => setStatus("ACTIVE")}>
          <Icon name="rocket" size={18} />
          {product.status === "PAUSED" ? t("resume") : t("publish")}
        </Button>
      )}
    </aside>
  );
}
