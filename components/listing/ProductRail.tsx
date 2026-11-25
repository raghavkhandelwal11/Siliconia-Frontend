import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ProductCardData } from "@/lib/search";
import { Icon } from "@/components/ui/Icon";
import { ProductCard } from "./ProductCard";

// A horizontal, swipeable row of products with an optional "See all" link.
export function ProductRail({
  title,
  items,
  href,
  eyebrow,
}: {
  title: string;
  items: ProductCardData[];
  href?: string;
  eyebrow?: string;
}) {
  const t = useTranslations("listing");
  if (items.length === 0) return null;
  return (
    <section aria-label={title}>
      <div className="flex items-end justify-between gap-3">
        <div>
          {eyebrow && <p className="text-sm font-semibold uppercase tracking-wider text-brand">{eyebrow}</p>}
          <h2 className="text-2xl font-bold">{title}</h2>
        </div>
        {href && (
          <Link href={href} className="group inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand">
            {t("seeAll")}
            <Icon name="arrow" size={16} className="transition-transform group-hover:translate-x-1" />
          </Link>
        )}
      </div>
      <ul className="-mx-4 mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 sm:gap-4">
        {items.map((p, i) => (
          <li key={p.id} className="w-[46%] shrink-0 snap-start sm:w-[30%] lg:w-[23%] xl:w-[19%]">
            <ProductCard p={p} index={i} />
          </li>
        ))}
      </ul>
    </section>
  );
}
