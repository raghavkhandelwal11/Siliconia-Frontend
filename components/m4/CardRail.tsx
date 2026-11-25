"use client";

import Link from "next/link";
import { useSession } from "@/lib/auth/session";
import { rupees } from "@/lib/checkout";
import { useCards, type Card } from "@/lib/m4";
import { Stars } from "./Stars";

/** A horizontal row of product cards (recommendations, products of the week). */
export function CardRail({ title, items, ranked = false }: { title: string; items?: Card[]; ranked?: boolean }) {
  if (!items || items.length === 0) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold">{title}</h2>
      <ul className="flex snap-x gap-4 overflow-x-auto pb-2">
        {items.map((c, i) => (
          <li key={c.id} className="w-44 shrink-0 snap-start">
            <Link href={`/p/${c.slug}`} className="card block overflow-hidden transition hover:border-brand/40">
              <span className="relative block aspect-square bg-bg">
                {c.coverUrl && (
                  // eslint-disable-next-line @next/next/no-img-element -- sized by the API
                  <img src={c.coverUrl} alt="" className="size-full object-contain" />
                )}
                {ranked && (
                  <span className="absolute left-2 top-2 rounded-full bg-brand-gradient px-2 text-xs font-bold text-white">
                    #{i + 1}
                  </span>
                )}
              </span>
              <span className="block space-y-1 p-3 text-sm">
                <span className="line-clamp-2 font-medium">{c.name}</span>
                {c.ratingCount > 0 && <Stars value={c.ratingAvg} size={12} />}
                <span className="block font-bold">{rupees(c.pricePaise)}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Products of the week for everyone, plus "for you" for signed-in buyers. */
export function HomeRails({ week, forYou }: { week: string; forYou: string }) {
  const session = useSession();
  const buyer = session.data?.state === "signed-in" && session.data.account.role === "BUYER";
  const w = useCards("week");
  const f = useCards("forYou", "", buyer);
  return (
    <>
      <CardRail title={week} items={w.data} ranked />
      {buyer && <CardRail title={forYou} items={f.data} />}
    </>
  );
}
