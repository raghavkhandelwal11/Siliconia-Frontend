"use client";

import { useSearchParams } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { ApiError } from "@/lib/api/client";
import { useBalance } from "@/lib/m3";
import { m4, useAct, useGet, type Row, type Social } from "@/lib/m4";
import { Alert, Button, Card, Field } from "@/components/ui/Form";
import { StatusChip } from "@/components/ui/StatusChip";

const str = (v: unknown) => (v == null ? "" : String(v));
const errText = (e: unknown, fallback: string) => (e instanceof ApiError ? e.message : fallback);

// ---- Creator portal (/creator) ---------------------------------------------------------

export function CreatorPortal() {
  const t = useTranslations("m4");
  const format = useFormatter();
  const demoFor = useSearchParams().get("demo");
  const app = useGet(["creator"], m4.creator);
  const [form, setForm] = useState<{ niche: string; bio: string; socials: Social[] } | null>(null);
  const [kyc, setKyc] = useState({ pan: "", account: "", ifsc: "" });
  const [note, setNote] = useState("");
  const [cash, setCash] = useState("250");
  const [rev, setRev] = useState<Record<string, { rating: number; body: string; video: string }>>({});
  const approvedQ = app.data?.approval === "APPROVED";
  const demos = useGet(["creator-demos"], m4.demos, approvedQ);
  const earnings = useGet(["creator-earnings"], m4.earnings, approvedQ);
  const cashouts = useGet(["creator-cashouts"], m4.cashouts, approvedQ);
  const bal = useBalance(approvedQ);
  const save = useAct(m4.saveCreator, [["creator"]]);
  const submit = useAct(() => m4.submitCreator(), [["creator"]]);
  const verify = useAct(m4.kyc, [["creator"]]);
  const ask = useAct((v: { id: string; note: string }) => m4.requestDemo(v.id, v.note), [["creator-demos"]]);
  const post = useAct(m4.postReview, [["creator-demos"]]);
  const out = useAct((n: number) => m4.cashout(n), [["creator-cashouts"], ["electrons"]]);
  const cancel = useAct((id: string) => m4.cancelCashout(id), [["creator-cashouts"], ["electrons"]]);
  const err = [save, submit, verify, ask, post, out, cancel].find((m) => m.isError)?.error;

  if (app.isPending) return <div className="skeleton h-96" />;
  if (app.isError || !app.data) return <Alert>{t("loadError")}</Alert>;
  const a = app.data;
  const f = form ?? {
    niche: a.niche,
    bio: a.bio,
    socials: a.socials.length ? a.socials : [{ platform: "YOUTUBE", url: "", followers: 0 }],
  };
  const editable = a.approval === "DRAFT" || a.approval === "REJECTED";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">{t("creatorTitle")}</h1>
        <StatusChip tone={a.approval === "APPROVED" ? "success" : a.approval === "REJECTED" ? "danger" : "info"}>
          {t(`approval.${a.approval}`)}
        </StatusChip>
      </div>
      {a.reason && <Alert>{a.reason}</Alert>}
      {err && <Alert>{errText(err, t("loadError"))}</Alert>}

      {editable && (
        <Card className="space-y-3">
          <h2 className="font-semibold">{t("apply")}</h2>
          <p className="text-sm text-muted">{t("criteria", { n: a.minFollowers })}</p>
          <Field label={t("niche")} value={f.niche} onChange={(e) => setForm({ ...f, niche: e.target.value })} />
          <Field label={t("bio")} value={f.bio} onChange={(e) => setForm({ ...f, bio: e.target.value })} />
          {f.socials.map((so, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-[8rem_1fr_8rem]">
              <select
                aria-label={t("platform")}
                value={so.platform}
                onChange={(e) =>
                  setForm({
                    ...f,
                    socials: f.socials.map((x, j) =>
                      j === i ? { ...x, platform: e.target.value as Social["platform"] } : x,
                    ),
                  })
                }
                className="min-h-11 rounded-xl border border-line bg-surface px-2"
              >
                {(["YOUTUBE", "INSTAGRAM", "X", "OTHER"] as const).map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
              <Field
                label={t("channelUrl")}
                value={so.url}
                onChange={(e) =>
                  setForm({ ...f, socials: f.socials.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)) })
                }
              />
              <Field
                label={t("followers")}
                inputMode="numeric"
                value={String(so.followers)}
                onChange={(e) =>
                  setForm({
                    ...f,
                    socials: f.socials.map((x, j) =>
                      j === i ? { ...x, followers: Number(e.target.value.replace(/\D/g, "")) || 0 } : x,
                    ),
                  })
                }
              />
            </div>
          ))}
          {f.socials.length < 4 && (
            <Button
              variant="ghost"
              className="px-3"
              onClick={() =>
                setForm({ ...f, socials: [...f.socials, { platform: "INSTAGRAM", url: "", followers: 0 }] })
              }
            >
              {t("addChannel")}
            </Button>
          )}
          <div className="flex gap-2">
            <Button variant="secondary" disabled={save.isPending} onClick={() => save.mutate(f)}>
              {t("save")}
            </Button>
            <Button disabled={submit.isPending || !a.niche} onClick={() => submit.mutate(undefined)}>
              {t("submitApp")}
            </Button>
          </div>
          <p className="text-xs text-muted">{t("termsNote")}</p>
        </Card>
      )}

      {approvedQ && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="space-y-2">
              <h2 className="font-semibold">{t("balance")}</h2>
              <p className="text-3xl font-extrabold">{bal.data?.available ?? 0}</p>
              <p className="text-xs text-muted">{t("pendingN", { n: bal.data?.pending ?? 0 })}</p>
              {a.kycVerified ? (
                <div className="flex items-end gap-2">
                  <Field
                    label={t("cashoutAmount")}
                    inputMode="numeric"
                    value={cash}
                    onChange={(e) => setCash(e.target.value.replace(/\D/g, ""))}
                  />
                  <Button disabled={out.isPending || Number(cash) < 250} onClick={() => out.mutate(Number(cash))}>
                    {t("cashout")}
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted">{t("kycFirst")}</p>
              )}
            </Card>
            <Card className="space-y-2">
              <h2 className="font-semibold">{t("kyc")}</h2>
              {a.kycVerified && (
                <p className="text-sm text-success">{t("kycDone", { pan: str(a.panLast4), bank: str(a.bankLast4) })}</p>
              )}
              <Field
                label={t("pan")}
                value={kyc.pan}
                onChange={(e) => setKyc({ ...kyc, pan: e.target.value.toUpperCase() })}
              />
              <Field
                label={t("bankAccount")}
                inputMode="numeric"
                value={kyc.account}
                onChange={(e) => setKyc({ ...kyc, account: e.target.value })}
              />
              <Field
                label={t("ifsc")}
                value={kyc.ifsc}
                onChange={(e) => setKyc({ ...kyc, ifsc: e.target.value.toUpperCase() })}
              />
              <Button variant="secondary" disabled={verify.isPending} onClick={() => verify.mutate(kyc)}>
                {t("verify")}
              </Button>
            </Card>
          </div>

          {demoFor && (
            <Card className="space-y-2">
              <h2 className="font-semibold">{t("requestDemo")}</h2>
              <Field label={t("demoNote")} value={note} onChange={(e) => setNote(e.target.value)} />
              <Button disabled={ask.isPending || ask.isSuccess} onClick={() => ask.mutate({ id: demoFor, note })}>
                {ask.isSuccess ? t("requested") : t("send")}
              </Button>
            </Card>
          )}

          <Card className="space-y-3">
            <h2 className="font-semibold">{t("demos")}</h2>
            {demos.data?.length === 0 && <p className="text-sm text-muted">{t("noDemos")}</p>}
            <ul className="divide-y divide-line">
              {demos.data?.map((d: Row) => {
                const id = str(d.id);
                const r = rev[id] ?? { rating: 5, body: "", video: "" };
                const canReview = d.status === "DELIVERED" || d.status === "OVERDUE";
                return (
                  <li key={id} className="space-y-2 py-3 text-sm">
                    <p className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">{str(d.productName)}</span>
                      <StatusChip tone={canReview ? "warning" : "info"}>{t(`demo.${str(d.status)}`)}</StatusChip>
                    </p>
                    {d.awb ? <p className="text-xs text-muted">AWB {str(d.awb)}</p> : null}
                    {canReview && (
                      <div className="space-y-2 rounded-xl border border-line p-3">
                        <label className="block text-xs font-medium">
                          {t("rating")}
                          <select
                            value={r.rating}
                            onChange={(e) => setRev({ ...rev, [id]: { ...r, rating: Number(e.target.value) } })}
                            className="ml-2 rounded-lg border border-line bg-surface px-2 py-1"
                          >
                            {[5, 4, 3, 2, 1].map((n) => (
                              <option key={n}>{n}</option>
                            ))}
                          </select>
                        </label>
                        <textarea
                          aria-label={t("yourReview")}
                          placeholder={t("yourReview")}
                          rows={3}
                          value={r.body}
                          onChange={(e) => setRev({ ...rev, [id]: { ...r, body: e.target.value } })}
                          className="w-full rounded-xl border border-line bg-surface p-2"
                        />
                        <input
                          aria-label={t("videoUrl")}
                          placeholder={t("videoUrl")}
                          value={r.video}
                          onChange={(e) => setRev({ ...rev, [id]: { ...r, video: e.target.value } })}
                          className="min-h-10 w-full rounded-xl border border-line bg-surface px-2"
                        />
                        <Button
                          className="min-h-9 px-4"
                          disabled={post.isPending}
                          onClick={() =>
                            post.mutate({
                              productId: str(d.productId),
                              rating: r.rating,
                              body: r.body,
                              videos: r.video ? [r.video] : [],
                            })
                          }
                        >
                          {t("publish")}
                        </Button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card className="space-y-2">
            <h2 className="font-semibold">{t("earnings")}</h2>
            {earnings.data?.length === 0 && <p className="text-sm text-muted">{t("noEarnings")}</p>}
            <ul className="text-sm">
              {earnings.data?.map((e: Row, i) => (
                <li key={i} className="flex justify-between py-1">
                  <span>
                    {str(e.period)} · {str(e.productName)} · {t("agreesN", { n: Number(e.verifiedAgrees) })}
                  </span>
                  <span className="font-semibold">+{str(e.share)}</span>
                </li>
              ))}
            </ul>
            <h3 className="pt-2 font-semibold">{t("cashouts")}</h3>
            <ul className="text-sm">
              {cashouts.data?.map((c: Row) => (
                <li key={str(c.id)} className="flex items-center justify-between gap-2 py-1">
                  <span>
                    {str(c.electrons)} · {t(`cash.${str(c.status)}`)} ·{" "}
                    {format.dateTime(new Date(str(c.createdAt)), { dateStyle: "medium" })}
                  </span>
                  {c.status === "REQUESTED" && (
                    <Button variant="ghost" className="min-h-8 px-2" onClick={() => cancel.mutate(str(c.id))}>
                      {t("cancel")}
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}
    </div>
  );
}

// ---- Promoter portal (/promoter) --------------------------------------------------------

export function PromoterPortal() {
  const t = useTranslations("m4");
  const dash = useGet(["promoter"], m4.promoter);
  const [name, setName] = useState("");
  const [type, setType] = useState<"INDIVIDUAL" | "COMPANY">("INDIVIDUAL");
  const [seller, setSeller] = useState("");
  const [proof, setProof] = useState("");
  const save = useAct(() => m4.savePromoter({ type, displayName: name }), [["promoter"]]);
  const invest = useAct(() => m4.invest(seller.trim(), proof), [["promoter"]]);
  const promote = useAct((v: { id: string; on: boolean }) => m4.promote(v.id, v.on), [["promoter"]]);
  const err = [save, invest, promote].find((m) => m.isError)?.error;
  if (dash.isPending) return <div className="skeleton h-96" />;
  if (dash.isError || !dash.data) return <Alert>{t("loadError")}</Alert>;
  const d = dash.data;
  const approval = str(d.approval);
  const products = (d.products as Row[]) ?? [];
  const investments = (d.investments as Row[]) ?? [];
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">{t("promoterTitle")}</h1>
        <StatusChip tone={approval === "APPROVED" ? "success" : "info"}>{t(`approval.${approval}`)}</StatusChip>
      </div>
      {err && <Alert>{errText(err, t("loadError"))}</Alert>}
      {(approval === "DRAFT" || approval === "REJECTED") && (
        <Card className="space-y-3">
          <h2 className="font-semibold">{t("apply")}</h2>
          <select
            aria-label={t("promoterType")}
            value={type}
            onChange={(e) => setType(e.target.value as "INDIVIDUAL" | "COMPANY")}
            className="min-h-11 rounded-xl border border-line bg-surface px-2"
          >
            <option value="INDIVIDUAL">{t("individual")}</option>
            <option value="COMPANY">{t("company")}</option>
          </select>
          <Field label={t("displayName")} value={name} onChange={(e) => setName(e.target.value)} />
          <Button disabled={save.isPending} onClick={() => save.mutate(undefined)}>
            {t("submitApp")}
          </Button>
        </Card>
      )}
      {approval === "APPROVED" && (
        <>
          <Card className="space-y-3">
            <h2 className="font-semibold">{t("investments")}</h2>
            <ul className="text-sm">
              {investments.map((i) => (
                <li key={str(i.id)} className="flex justify-between py-1">
                  <span>{str(i.storeName)}</span>
                  <span className="text-muted">
                    {i.sellerConfirmedAt ? t("confirmed") : i.declinedAt ? t("declined") : t("awaiting")}
                  </span>
                </li>
              ))}
            </ul>
            <Field
              label={t("sellerId")}
              hint={t("sellerIdHint")}
              value={seller}
              onChange={(e) => setSeller(e.target.value)}
            />
            <Field label={t("proof")} value={proof} onChange={(e) => setProof(e.target.value)} />
            <Button variant="secondary" disabled={invest.isPending} onClick={() => invest.mutate(undefined)}>
              {t("addInvestment")}
            </Button>
          </Card>
          <Card className="space-y-2">
            <h2 className="font-semibold">{t("promotable")}</h2>
            {products.length === 0 && <p className="text-sm text-muted">{t("noPromotable")}</p>}
            <ul className="divide-y divide-line text-sm">
              {products.map((p) => (
                <li key={str(p.id)} className="flex items-center justify-between gap-2 py-2">
                  <span>
                    {str(p.name)}{" "}
                    <span className="text-muted">
                      · {str(p.storeName)} · {t("perUnit", { n: Number(p.rewardPerUnit) })}
                    </span>
                  </span>
                  <Button
                    variant={p.promoted ? "secondary" : "primary"}
                    className="min-h-9 px-4"
                    onClick={() => promote.mutate({ id: str(p.id), on: !p.promoted })}
                  >
                    {p.promoted ? t("unpromote") : t("promote")}
                  </Button>
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}
    </div>
  );
}

// ---- Seller programmes (/seller/programmes) -------------------------------------------------

export function SellerProgrammes() {
  const t = useTranslations("m4");
  const demos = useGet(["seller-demos"], m4.sellerDemos);
  const promoters = useGet(["seller-promoters"], m4.sellerPromoters);
  const feedback = useGet(["seller-feedback"], m4.sellerFeedback);
  const [replies, setReplies] = useState<Record<string, string>>({});
  const [reward, setReward] = useState({ product: "", n: "10" });
  const decide = useAct(
    (v: { id: string; ok: boolean }) => m4.decideDemo(v.id, v.ok, v.ok ? "" : "Not available for demos right now"),
    [["seller-demos"]],
  );
  const confirm = useAct((v: { id: string; ok: boolean }) => m4.confirmPromoter(v.id, v.ok), [["seller-promoters"]]);
  const reply = useAct((v: { id: string; text: string }) => m4.replyFeedback(v.id, v.text), [["seller-feedback"]]);
  const setRule = useAct(() => m4.reward(reward.product.trim(), Number(reward.n)), []);
  const err = [decide, confirm, reply, setRule].find((m) => m.isError)?.error;
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("sellerTitle")}</h1>
      {err && <Alert>{errText(err, t("loadError"))}</Alert>}
      <Card className="space-y-2">
        <h2 className="font-semibold">{t("demoRequests")}</h2>
        {demos.data?.length === 0 && <p className="text-sm text-muted">{t("noDemos")}</p>}
        <ul className="divide-y divide-line text-sm">
          {demos.data?.map((d) => (
            <li key={str(d.id)} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span>
                {str(d.productName)} · {str(d.creatorName) || t("creator")}{" "}
                <span className="text-muted">· {t(`demo.${str(d.status)}`)}</span>
              </span>
              {d.status === "REQUESTED" && (
                <span className="flex gap-2">
                  <Button className="min-h-9 px-4" onClick={() => decide.mutate({ id: str(d.id), ok: true })}>
                    {t("approveShip")}
                  </Button>
                  <Button
                    variant="secondary"
                    className="min-h-9 px-4"
                    onClick={() => decide.mutate({ id: str(d.id), ok: false })}
                  >
                    {t("decline")}
                  </Button>
                </span>
              )}
            </li>
          ))}
        </ul>
      </Card>
      <Card className="space-y-2">
        <h2 className="font-semibold">{t("promoters")}</h2>
        <ul className="divide-y divide-line text-sm">
          {promoters.data?.map((p) => (
            <li key={str(p.id)} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span>
                {str(p.promoterName)} <span className="text-muted">· {str(p.proofNote)}</span>
              </span>
              {!p.sellerConfirmedAt && (
                <span className="flex gap-2">
                  <Button className="min-h-9 px-4" onClick={() => confirm.mutate({ id: str(p.id), ok: true })}>
                    {t("confirm")}
                  </Button>
                  <Button
                    variant="secondary"
                    className="min-h-9 px-4"
                    onClick={() => confirm.mutate({ id: str(p.id), ok: false })}
                  >
                    {t("decline")}
                  </Button>
                </span>
              )}
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap items-end gap-2">
          <Field
            label={t("productId")}
            value={reward.product}
            onChange={(e) => setReward({ ...reward, product: e.target.value })}
          />
          <Field
            label={t("electronsPerUnit")}
            inputMode="numeric"
            value={reward.n}
            onChange={(e) => setReward({ ...reward, n: e.target.value.replace(/\D/g, "") })}
          />
          <Button variant="secondary" disabled={setRule.isPending} onClick={() => setRule.mutate(undefined)}>
            {setRule.isSuccess ? t("saved") : t("setReward")}
          </Button>
        </div>
      </Card>
      <Card className="space-y-2">
        <h2 className="font-semibold">{t("feedback")}</h2>
        {feedback.data?.length === 0 && <p className="text-sm text-muted">{t("noFeedback")}</p>}
        <ul className="divide-y divide-line text-sm">
          {feedback.data?.map((f) => (
            <li key={str(f.id)} className="space-y-1 py-2">
              <p>
                <span className="font-medium">{str(f.productName)}</span>{" "}
                <span className="text-muted">· {str(f.category)}</span>
              </p>
              <p>{str(f.body)}</p>
              {f.sellerReply ? (
                <p className="text-muted">↳ {str(f.sellerReply)}</p>
              ) : (
                <span className="flex gap-2">
                  <input
                    aria-label={t("reply")}
                    value={replies[str(f.id)] ?? ""}
                    onChange={(e) => setReplies({ ...replies, [str(f.id)]: e.target.value })}
                    className="min-h-9 flex-1 rounded-xl border border-line bg-surface px-2"
                  />
                  <Button
                    className="min-h-9 px-4"
                    onClick={() => reply.mutate({ id: str(f.id), text: replies[str(f.id)] ?? "" })}
                  >
                    {t("reply")}
                  </Button>
                </span>
              )}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

// ---- Admin programmes (/admin/programmes) ---------------------------------------------------

export function AdminProgrammes() {
  const t = useTranslations("m4");
  const creators = useGet(["queue", "creators"], () => m4.queue("creators"));
  const promoters = useGet(["queue", "promoters"], () => m4.queue("promoters"));
  const reported = useGet(["reported"], m4.reported);
  const pools = useGet(["pools"], m4.pools);
  const [pool, setPool] = useState({ product: "", period: new Date().toISOString().slice(0, 7), size: "1000" });
  const decide = useAct(
    (v: { role: "creators" | "promoters"; id: string; ok: boolean }) =>
      m4.decide(v.role, v.id, v.ok, v.ok ? "" : "Does not meet the programme criteria"),
    [
      ["queue", "creators"],
      ["queue", "promoters"],
    ],
  );
  const moderate = useAct((v: { id: string; publish: boolean }) => m4.moderate(v.id, v.publish), [["reported"]]);
  const save = useAct(() => m4.setPool(pool.product.trim(), pool.period, Number(pool.size)), [["pools"]]);
  const err = [decide, moderate, save].find((m) => m.isError)?.error;
  const queue = (role: "creators" | "promoters", rows?: Row[]) => (
    <Card className="space-y-2">
      <h2 className="font-semibold">{t(`queue.${role}`)}</h2>
      {rows?.length === 0 && <p className="text-sm text-muted">{t("queueEmpty")}</p>}
      <ul className="divide-y divide-line text-sm">
        {rows?.map((r) => (
          <li key={str(r.id)} className="flex flex-wrap items-center justify-between gap-2 py-2">
            <span>{str(r.name) || str(r.id).slice(0, 8)}</span>
            <span className="flex gap-2">
              <Button className="min-h-9 px-4" onClick={() => decide.mutate({ role, id: str(r.id), ok: true })}>
                {t("approve")}
              </Button>
              <Button
                variant="secondary"
                className="min-h-9 px-4"
                onClick={() => decide.mutate({ role, id: str(r.id), ok: false })}
              >
                {t("reject")}
              </Button>
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("adminTitle")}</h1>
      {err && <Alert>{errText(err, t("loadError"))}</Alert>}
      {queue("creators", creators.data)}
      {queue("promoters", promoters.data)}
      <Card className="space-y-2">
        <h2 className="font-semibold">{t("reportedReviews")}</h2>
        {reported.data?.length === 0 && <p className="text-sm text-muted">{t("queueEmpty")}</p>}
        <ul className="divide-y divide-line text-sm">
          {reported.data?.map((r) => (
            <li key={str(r.id)} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span>
                {str(r.productName)} · {str(r.rating)}★ · {str(r.body).slice(0, 80)}{" "}
                <span className="text-muted">
                  ({str(r.status)}, {str(r.reportCount)})
                </span>
              </span>
              <span className="flex gap-2">
                <Button className="min-h-9 px-4" onClick={() => moderate.mutate({ id: str(r.id), publish: true })}>
                  {t("publishReview")}
                </Button>
                <Button
                  variant="secondary"
                  className="min-h-9 px-4"
                  onClick={() => moderate.mutate({ id: str(r.id), publish: false })}
                >
                  {t("hide")}
                </Button>
              </span>
            </li>
          ))}
        </ul>
      </Card>
      <Card className="space-y-2">
        <h2 className="font-semibold">{t("pools")}</h2>
        <div className="grid gap-2 sm:grid-cols-4">
          <Field
            label={t("productId")}
            value={pool.product}
            onChange={(e) => setPool({ ...pool, product: e.target.value })}
          />
          <Field
            label={t("period")}
            value={pool.period}
            onChange={(e) => setPool({ ...pool, period: e.target.value })}
          />
          <Field
            label={t("poolSize")}
            inputMode="numeric"
            value={pool.size}
            onChange={(e) => setPool({ ...pool, size: e.target.value.replace(/\D/g, "") })}
          />
          <Button className="self-end" disabled={save.isPending} onClick={() => save.mutate(undefined)}>
            {t("setPool")}
          </Button>
        </div>
        <ul className="text-sm">
          {pools.data?.map((p) => (
            <li key={str(p.id)} className="flex justify-between py-1">
              <span>
                {str(p.period)} · {str(p.productName)}
              </span>
              <span>
                {str(p.size)} {p.settledAt ? `· ${t("settled")}` : ""}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
