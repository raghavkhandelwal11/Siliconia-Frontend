"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { api, ApiError, unwrap } from "@/lib/api/client";
import { Alert, Button, Card, Field } from "@/components/ui/Form";
import { Icon } from "@/components/ui/Icon";
import { CategoryTile } from "@/components/catalogue/CategoryIcon";

type Node = { id: string; slug: string; name: string; icon?: string; examples?: string; children?: Node[] };

// Step 1 of a new product: pick the category, then the sub-category, then name it.
export function NewProduct() {
  const t = useTranslations("products.new");
  const router = useRouter();
  const tree = useQuery({
    queryKey: ["categories"],
    queryFn: async () => unwrap(await api.GET("/categories")).categories,
  });
  const [parent, setParent] = useState<Node | null>(null);
  const [sub, setSub] = useState<Node | null>(null);
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!sub) return;
    setBusy(true);
    setError(null);
    try {
      const p = unwrap(await api.POST("/seller/products", { body: { categoryId: sub.id, name, brand } }));
      router.push(`/seller/products/${p.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("error"));
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">{t("title")}</h1>
        <p className="text-muted">{t("intro")}</p>
      </div>

      {!parent && (
        <section aria-labelledby="pick-category">
          <h2 id="pick-category" className="text-lg font-semibold">
            {t("pickCategory")}
          </h2>
          {tree.isPending && <div className="skeleton mt-4 h-40" />}
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {(tree.data as Node[] | undefined)?.map((c, i) => (
              <li key={c.id} className="rise" style={{ "--d": `${i * 30}ms` } as CSSProperties}>
                <button
                  type="button"
                  onClick={() => setParent(c)}
                  className="card card-hover group flex w-full items-center gap-3 p-4 text-left"
                >
                  <CategoryTile icon={c.icon} size={42} className="group-hover:scale-110" />
                  <span className="text-sm font-semibold">{c.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {parent && !sub && (
        <section aria-labelledby="pick-sub" className="space-y-4">
          <button
            type="button"
            onClick={() => setParent(null)}
            className="inline-flex items-center gap-1 text-sm font-semibold text-brand"
          >
            <Icon name="arrow" size={16} className="rotate-180" />
            {t("back")}
          </button>
          <h2 id="pick-sub" className="flex items-center gap-3 text-lg font-semibold">
            <CategoryTile icon={parent.icon} size={36} />
            {t("pickSub", { category: parent.name })}
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {parent.children?.map((s, i) => (
              <li key={s.id} className="rise" style={{ "--d": `${i * 30}ms` } as CSSProperties}>
                <button type="button" onClick={() => setSub(s)} className="card card-hover w-full p-4 text-left">
                  <span className="block font-semibold">{s.name}</span>
                  <span className="text-sm text-muted">{s.examples}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {parent && sub && (
        <Card className="max-w-xl">
          <p className="flex items-center gap-2 text-sm text-muted">
            <CategoryTile icon={parent.icon} size={28} />
            {parent.name} / <span className="font-semibold text-ink">{sub.name}</span>
            <button type="button" onClick={() => setSub(null)} className="ml-auto font-semibold text-brand">
              {t("change")}
            </button>
          </p>
          <form onSubmit={create} className="mt-5 space-y-4">
            {error && <Alert>{error}</Alert>}
            <Field
              label={t("name")}
              hint={t("nameHint")}
              value={name}
              maxLength={150}
              required
              onChange={(e) => setName(e.target.value)}
            />
            <Field label={t("brand")} value={brand} maxLength={60} onChange={(e) => setBrand(e.target.value)} />
            <Button type="submit" disabled={busy || name.trim().length < 3}>
              {t("create")}
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
