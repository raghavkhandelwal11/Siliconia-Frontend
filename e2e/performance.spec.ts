import { expect, test } from "@playwright/test";
import { inStockSlug } from "./helpers";

// Performance budgets (T6.4) from the LLD: JS ≤ 200 KB gzip per buyer route
// and LCP < 2.5 s. Checked against a production build (E2E_PERF=1; dev bundles
// are far larger). Today: ~185 KB and a largest paint under 0.4 s locally.
const BUDGET = { jsKB: 200, lcpMs: 2500, totalKB: 1500 };

test.skip(process.env.E2E_PERF !== "1", "set E2E_PERF=1 and run against `npm run build && npm start`");

for (const name of ["home", "search", "product", "journey"] as const) {
  test(`${name} page stays within budget`, async ({ page, request }) => {
    const path = {
      home: "/",
      search: "/search?q=phone",
      product: `/p/${await inStockSlug(request)}`,
      journey: "/journey",
    }[name];
    await page.goto(path, { waitUntil: "load" });
    const m = await page.evaluate(async () => {
      const res = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
      const size = (r: PerformanceResourceTiming) => r.transferSize || r.encodedBodySize;
      const lcp = await new Promise<number>((done) => {
        new PerformanceObserver((list) => done(list.getEntries().at(-1)?.startTime ?? 0)).observe({
          type: "largest-contentful-paint",
          buffered: true,
        });
        setTimeout(() => done(0), 3000);
      });
      return {
        jsKB:
          res.filter((r) => r.initiatorType === "script" || r.name.endsWith(".js")).reduce((a, r) => a + size(r), 0) /
          1024,
        totalKB: res.reduce((a, r) => a + size(r), 0) / 1024,
        lcpMs: lcp,
      };
    });
    test.info().annotations.push({ type: "perf", description: JSON.stringify(m) });
    expect(m.jsKB, "compressed JavaScript (KB)").toBeLessThan(BUDGET.jsKB);
    expect(m.totalKB, "total transfer (KB)").toBeLessThan(BUDGET.totalKB);
    expect(m.lcpMs, "largest contentful paint (ms)").toBeLessThan(BUDGET.lcpMs);
  });
}
