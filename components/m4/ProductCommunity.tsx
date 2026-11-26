"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { ApiError } from "@/lib/api/client";
import { useSession } from "@/lib/auth/session";
import { m4, useAct, useCards, useCreatorReviews, usePromoters, useReviews } from "@/lib/m4";
import { Alert, Button } from "@/components/ui/Form";
import { CardRail } from "./CardRail";
import { Stars } from "./Stars";

// PDP reviews in three tabs (LLD 14.2): Promoted by · Creator reviews · Buyer reviews; plus bought together.
export function ProductCommunity({ productId }: { productId: string }) {
  const t = useTranslations("m4");
  const [tab, setTab] = useState<"buyers" | "creators" | "promoters">("buyers");
  const together = useCards("together", productId);
  const promoters = usePromoters(productId);
  return (
    <div className="space-y-8">
      <section className="card space-y-4 p-5" aria-labelledby="reviews">
        <h2 id="reviews" className="text-lg font-semibold">
          {t("reviewsHeading")}
        </h2>
        <div role="tablist" aria-label={t("reviewsTabs")} className="flex gap-2 overflow-x-auto">
          {(["buyers", "creators", "promoters"] as const).map((k) => (
            <button
              key={k}
              role="tab"
              aria-selected={tab === k}
              onClick={() => setTab(k)}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium ${tab === k ? "border-brand bg-brand-soft text-brand" : "border-line"}`}
            >
              {t(`tab.${k}`)}
              {k === "promoters" && promoters.data?.length ? ` (${promoters.data.length})` : ""}
            </button>
          ))}
        </div>
        {tab === "buyers" && <BuyerReviews productId={productId} />}
        {tab === "creators" && <CreatorReviewList productId={productId} />}
        {tab === "promoters" &&
          (promoters.data?.length ? (
            <ul className="flex flex-wrap gap-2">
              {promoters.data.map((p) => (
                <li key={String(p.accountId)} className="rounded-full bg-brand-soft px-3 py-1 text-sm font-medium">
                  {String(p.displayName)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">{t("noPromoters")}</p>
          ))}
      </section>
      <CardRail title={t("boughtTogether")} items={together.data} />
    </div>
  );
}

function BuyerReviews({ productId }: { productId: string }) {
  const t = useTranslations("m4");
  const format = useFormatter();
  const session = useSession();
  const [sort, setSort] = useState<"recent" | "helpful">("recent");
  const [page, setPage] = useState(0);
  const list = useReviews(productId, sort, page);
  const helpful = useAct((id: string) => m4.helpful(id), [["reviews", productId]]);
  const report = useAct((id: string) => m4.report(id, "Inappropriate or off topic"), [["reviews", productId]]);
  const [reported, setReported] = useState<string[]>([]);
  const buyer = session.data?.state === "signed-in" && session.data.account.role === "BUYER";
  if (list.isPending) return <div className="skeleton h-32" />;
  if (list.isError || !list.data) return <Alert>{t("loadError")}</Alert>;
  const { items, summary } = list.data;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2">
          <span className="text-3xl font-extrabold">{summary.count ? summary.average.toFixed(1) : "–"}</span>
          <Stars value={summary.average} />
          <span className="text-sm text-muted">{t("ratings", { n: summary.count })}</span>
        </p>
        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value as "recent" | "helpful");
            setPage(0);
          }}
          aria-label={t("sort")}
          className="rounded-xl border border-line bg-surface px-3 py-2 text-sm"
        >
          <option value="recent">{t("recent")}</option>
          <option value="helpful">{t("mostHelpful")}</option>
        </select>
      </div>
      {items.length === 0 && <p className="text-sm text-muted">{t("noReviews")}</p>}
      <ul className="divide-y divide-line">
        {items.map((r) => (
          <li key={r.id} className="space-y-1.5 py-4">
            <p className="flex items-center gap-2">
              <Stars value={r.rating} />
              {r.title && <span className="font-semibold">{r.title}</span>}
            </p>
            <p className="text-xs text-muted">
              {r.author} · {t("verified")} · {format.dateTime(new Date(r.at), { dateStyle: "medium" })}
            </p>
            {r.body && <p className="text-sm">{r.body}</p>}
            {r.photos.length > 0 && (
              <div className="flex gap-2">
                {r.photos.map((src) => (
                  // eslint-disable-next-line @next/next/no-img-element -- review photo
                  <img key={src} src={src} alt={t("photoAlt")} className="size-16 rounded-lg object-cover" />
                ))}
              </div>
            )}
            {buyer && (
              <p className="flex gap-3 text-xs">
                <button className="font-medium text-brand" onClick={() => helpful.mutate(r.id)}>
                  {t("helpful", { n: r.helpful })}
                </button>
                <button
                  className="text-muted hover:text-danger disabled:opacity-50"
                  disabled={reported.includes(r.id)}
                  onClick={() => report.mutate(r.id, { onSuccess: () => setReported([...reported, r.id]) })}
                >
                  {reported.includes(r.id) ? t("reported") : t("report")}
                </button>
              </p>
            )}
          </li>
        ))}
      </ul>
      {(page > 0 || items.length === 10) && (
        <div className="flex gap-2">
          <Button variant="secondary" className="min-h-9 px-4" disabled={page === 0} onClick={() => setPage(page - 1)}>
            {t("prev")}
          </Button>
          <Button
            variant="secondary"
            className="min-h-9 px-4"
            disabled={items.length < 10}
            onClick={() => setPage(page + 1)}
          >
            {t("next")}
          </Button>
        </div>
      )}
    </div>
  );
}

function CreatorReviewList({ productId }: { productId: string }) {
  const t = useTranslations("m4");
  const session = useSession();
  const list = useCreatorReviews(productId);
  const vote = useAct(
    (v: { id: string; value: -1 | 0 | 1 }) => m4.vote(v.id, v.value),
    [["creator-reviews", productId]],
  );
  const buyer = session.data?.state === "signed-in" && session.data.account.role === "BUYER";
  if (list.isPending) return <div className="skeleton h-32" />;
  if (!list.data?.length) return <p className="text-sm text-muted">{t("noCreatorReviews")}</p>;
  return (
    <ul className="space-y-4">
      {vote.isError && <Alert>{vote.error instanceof ApiError ? vote.error.message : t("loadError")}</Alert>}
      {list.data.map((r) => (
        <li key={r.id} className="space-y-2 rounded-xl border border-line p-4">
          <p className="flex items-center gap-2 text-sm">
            <span className="rounded-full bg-brand-gradient px-2 text-xs font-bold text-white">#{r.rank}</span>
            <span className="font-semibold">{r.creatorName || t("creator")}</span>
            <Stars value={r.rating} />
          </p>
          <p className="text-sm">{r.body}</p>
          {r.videos.map((v) => (
            <a
              key={v}
              href={v}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="block text-sm text-brand underline"
            >
              {t("watch")}
            </a>
          ))}
          <p className="flex items-center gap-3 text-sm">
            <button
              disabled={!buyer}
              aria-pressed={r.myVote === 1}
              onClick={() => vote.mutate({ id: r.id, value: r.myVote === 1 ? 0 : 1 })}
              className={`rounded-full border px-3 py-1 ${r.myVote === 1 ? "border-success bg-success/10" : "border-line"}`}
            >
              {t("agree", { n: r.agrees })}
            </button>
            <button
              disabled={!buyer}
              aria-pressed={r.myVote === -1}
              onClick={() => vote.mutate({ id: r.id, value: r.myVote === -1 ? 0 : -1 })}
              className={`rounded-full border px-3 py-1 ${r.myVote === -1 ? "border-danger bg-danger/10" : "border-line"}`}
            >
              {t("disagree", { n: r.disagrees })}
            </button>
          </p>
        </li>
      ))}
    </ul>
  );
}
