import { useTranslations } from "next-intl";
import type { ProductPage } from "@/lib/pdp";
import { specText } from "@/lib/pdp";

/** "Main specifications" highlights (up to 3). */
export function MainSpecs({ specs }: { specs: ProductPage["specs"] }) {
  const t = useTranslations("pdp.specs");
  const main = specs.filter((s) => s.main).slice(0, 3);
  if (main.length === 0) return null;
  return (
    <ul className="grid grid-cols-3 gap-2">
      {main.map((s) => (
        <li key={s.key} className="rounded-2xl border border-line bg-surface p-3 text-center">
          <p className="text-lg font-bold">{specText(s.value, s.unit, t("yes"), t("no"))}</p>
          <p className="text-xs text-muted">{s.label}</p>
        </li>
      ))}
    </ul>
  );
}

/** The full specification table, in the category's order. */
export function SpecTable({ product }: { product: ProductPage }) {
  const t = useTranslations("pdp.specs");
  const rows: [string, string][] = [
    [t("brand"), product.brand],
    ...(product.model ? ([[t("model"), product.model]] as [string, string][]) : []),
    ...product.specs.map((s) => [s.label, specText(s.value, s.unit, t("yes"), t("no"))] as [string, string]),
    [t("warranty"), product.warranty],
    [t("origin"), product.originCountry === "IN" ? t("india") : product.originCountry],
  ];
  return (
    <table className="w-full text-sm">
      <tbody>
        {rows.map(([k, v]) => (
          <tr key={k} className="border-b border-line last:border-0">
            <th scope="row" className="w-2/5 py-2.5 pr-4 text-left font-medium text-muted">
              {k}
            </th>
            <td className="py-2.5">{v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
