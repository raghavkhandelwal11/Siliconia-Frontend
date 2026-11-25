"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ApiError } from "@/lib/api/client";
import { useSession } from "@/lib/auth/session";
import { rupees } from "@/lib/checkout";
import { hms, joinQueue, useCountdown, useLaunch, useLiveLaunch, useQueue, useReserve } from "@/lib/m3";
import { Alert, Button, buttonClass } from "@/components/ui/Form";

// /launches/[id]: countdown, live units left, waiting room, reserve and hold (UI-LAU-01..04).
export function LaunchPage({ id }: { id: string }) {
  const t = useTranslations("launch");
  const router = useRouter();
  const session = useSession();
  const launch = useLaunch(id);
  const live = useLiveLaunch(id);
  const reserve = useReserve(id);
  const [joined, setJoined] = useState(false);
  const [joinError, setJoinError] = useState<string>();
  const queue = useQueue(id, joined);
  const l = launch.data;
  const startsIn = useCountdown(l?.startsAt ?? new Date().toISOString(), l?.serverTime);
  const claim = l?.myClaims?.find((c) => c.status === "HELD");
  const holdLeft = useCountdown(claim?.heldUntil ?? new Date().toISOString(), l?.serverTime);

  if (launch.isPending) return <div className="skeleton h-96" />;
  if (launch.isError || !l) return <Alert>{t("loadError")}</Alert>;
  const status = live?.status ?? l.status;
  const left = live?.dealRemaining ?? l.dealRemaining;
  const held = live?.held ?? l.held;
  const normalLeft = live?.normalAvailable ?? l.normalAvailable;
  const signedIn = session.data?.state === "signed-in";
  const pct = Math.round((left / l.dealUnits) * 100);

  function doReserve(token?: string) {
    reserve.mutate({ qty: 1, admissionToken: token }, { onSuccess: (c) => router.push(`/checkout?claim=${c.id}`) });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
      <section className="card rise overflow-hidden">
        {l.coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- sized by the API
          <img src={l.coverUrl} alt="" className="aspect-[4/3] w-full bg-bg object-contain" />
        )}
        <div className="p-6">
          <p className="text-sm font-semibold text-brand">{t("badge")}</p>
          <h1 className="text-2xl font-bold sm:text-3xl">{l.productName}</h1>
          <p className="text-muted">{Object.values(l.attrs).join(" · ")}</p>
          <Link href={`/p/${l.productSlug}`} className="mt-2 inline-block text-sm font-medium text-brand">
            {t("details")}
          </Link>
        </div>
      </section>

      <aside className="card rise space-y-4 p-6 lg:sticky lg:top-24 lg:self-start" aria-live="polite">
        <p>
          <span className="text-3xl font-extrabold">{rupees(l.dealPricePaise)}</span>{" "}
          <span className="text-muted line-through">{rupees(l.normalPricePaise)}</span>{" "}
          <span className="rounded-full bg-success/15 px-2 py-0.5 text-sm font-bold text-success">
            {t("off", { pct: l.dealDiscountBps / 100 })}
          </span>
        </p>
        <div>
          <div
            className="h-2 overflow-hidden rounded-full bg-line"
            role="progressbar"
            aria-valuenow={left}
            aria-valuemin={0}
            aria-valuemax={l.dealUnits}
            aria-label={t("unitsLeftLabel")}
          >
            <div className="h-full bg-brand-gradient transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1 text-sm font-semibold">{t("unitsLeft", { left, total: l.dealUnits })}</p>
        </div>

        {status === "SCHEDULED" && (
          <p className="text-center text-lg font-semibold">
            {t("startsIn")} <span className="font-mono">{hms(startsIn)}</span>
          </p>
        )}

        {reserve.isError && <Alert>{reserve.error instanceof ApiError ? reserve.error.message : t("error")}</Alert>}
        {joinError && <Alert>{joinError}</Alert>}

        {claim ? (
          <div className="space-y-2 rounded-xl bg-brand-soft p-3 text-sm">
            <p className="font-semibold">{t("held", { time: hms(holdLeft) })}</p>
            <Link href={`/checkout?claim=${claim.id}`} className={buttonClass("primary", "w-full")}>
              {t("checkout")}
            </Link>
          </div>
        ) : status === "LIVE" && left > 0 ? (
          !signedIn ? (
            <Link href={`/auth/sign-in?next=/launches/${id}`} className={buttonClass("primary", "w-full")}>
              {t("signIn")}
            </Link>
          ) : !l.isMember ? (
            <Link href="/membership" className={buttonClass("primary", "w-full")}>
              {t("membersOnly")}
            </Link>
          ) : l.waitingRoom && !queue.data?.admitted ? (
            joined ? (
              <p className="text-center text-sm">{t("inQueue", { position: queue.data?.position ?? "…" })}</p>
            ) : (
              <Button
                className="w-full"
                onClick={() =>
                  joinQueue(id)
                    .then(() => setJoined(true))
                    .catch((e) => setJoinError(e instanceof ApiError ? e.message : t("error")))
                }
              >
                {t("joinQueue")}
              </Button>
            )
          ) : (
            <Button
              className="w-full"
              disabled={reserve.isPending}
              onClick={() => doReserve(queue.data?.admissionToken)}
            >
              {t("reserve")}
            </Button>
          )
        ) : status === "LIVE" || status === "DEAL_SOLD_OUT" ? (
          <p className="text-center font-semibold">{held > 0 ? t("allReserved") : t("allSold")}</p>
        ) : status === "NORMAL_ON_SALE" && normalLeft > 0 ? (
          <Link href={`/checkout?launch=${id}&qty=1`} className={buttonClass("primary", "w-full")}>
            {t("buyNormal", { amount: rupees(l.normalPricePaise) })}
          </Link>
        ) : status === "COMPLETED" || status === "NORMAL_ON_SALE" ? (
          <Link href={`/p/${l.productSlug}`} className={buttonClass("secondary", "w-full")}>
            {t("ended")}
          </Link>
        ) : null}
        <p className="text-xs text-muted">{t("rules", { limit: l.perMemberLimit })}</p>
      </aside>
    </div>
  );
}
