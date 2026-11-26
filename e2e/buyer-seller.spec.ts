import { expect, test } from "@playwright/test";
import { acceptTerms, addToCart, api, expectAccessible, inStockSlug, newPhone, signIn } from "./helpers";

// One order from checkout to shipment: a new buyer pays online and the demo
// seller packs and ships it.
test.describe.serial("buyer and seller", () => {
  let orderNumber = "";

  test("new buyer checks out and pays online", async ({ page }) => {
    await signIn(page, newPhone(), "BUYER");
    await acceptTerms(page);
    await api(page, "POST", "/me/addresses", {
      name: "E2E Buyer",
      phone: "+91 98765 00000",
      line1: "12 MG Road",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560001",
    });

    await page.goto(`/p/${await inStockSlug(page.request)}`);
    await addToCart(page);
    await page.goto("/cart");
    await page.getByRole("link", { name: "Proceed to checkout" }).click();
    await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible();
    await expectAccessible(page, "checkout");
    await page.getByRole("button", { name: /^Pay ₹/ }).click();

    // Simulated payment page (TEST MODE).
    await page.getByPlaceholder("success@sim").fill("success@sim");
    await page.getByRole("button", { name: /^Pay ₹/ }).click();
    await expect(page.getByText("Order confirmed")).toBeVisible({ timeout: 30_000 });
    orderNumber = (await page
      .getByText(/SX-\d{6}-[A-Z0-9]+/)
      .first()
      .textContent())!.match(/SX-\d{6}-[A-Z0-9]+/)![0];

    await page.getByRole("link", { name: "View order details" }).click();
    await expect(page.getByText(`Order ${orderNumber}`)).toBeVisible();
    await expectAccessible(page, "order details");

    await page.goto("/account/electrons");
    await expect(page.getByText("Pending")).toBeVisible();
  });

  test("demo seller packs and ships it", async ({ browser }) => {
    const page = await (await browser.newContext()).newPage();
    await signIn(page, "9999900099", "SELLER");
    await acceptTerms(page);
    await page.goto("/seller/orders");
    await expectAccessible(page, "seller orders");
    await page.getByText(orderNumber).click();
    await page.getByRole("button", { name: "Mark as packed" }).click();
    await page.getByRole("button", { name: "Book courier and ship" }).click();
    await expect(page.getByText(/AWB SX/).first()).toBeVisible();
    await expectAccessible(page, "seller order");
    for (const path of ["/seller/products", "/seller/returns", "/seller/payouts", "/seller/programmes"]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expectAccessible(page, path);
    }
  });
});
