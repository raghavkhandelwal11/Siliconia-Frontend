import { expect, test } from "@playwright/test";
import { expectAccessible, inStockSlug } from "./helpers";

// A visitor browses, searches, opens a product and fills a cart without signing in.
test("guest browses, searches and fills a cart", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Journey" })).toBeVisible();
  await expectAccessible(page, "home");

  await page.goto("/search?q=power%20bank");
  await expect(page.getByRole("heading", { name: /power bank/i })).toBeVisible();
  await expectAccessible(page, "search");

  await page.goto(`/p/${await inStockSlug(page.request)}`);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expectAccessible(page, "product page");
  await page.getByRole("button", { name: "Add to cart" }).click();

  await page.goto("/cart");
  await expect(page.getByRole("link", { name: "Proceed to checkout" })).toBeVisible();
  await expectAccessible(page, "cart");

  await page.goto("/journey");
  await expect(page.getByRole("heading", { name: "Our journey" })).toBeVisible();
  await expectAccessible(page, "journey");

  await page.goto("/no-such-page");
  await expect(page.getByRole("heading", { name: "We couldn't find that page" })).toBeVisible();
});
