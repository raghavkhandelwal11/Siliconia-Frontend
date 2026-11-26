import { expect, test } from "@playwright/test";
import { acceptTerms, expectAccessible, signIn, totp } from "./helpers";

// Needs an admin created with `make admin`: E2E_ADMIN_PHONE, plus
// E2E_ADMIN_TOTP_SECRET once its authenticator is set up. On a first sign-in
// the test sets the authenticator up itself.
const phone = process.env.E2E_ADMIN_PHONE;

test("admin signs in with the authenticator and runs the console", async ({ page }) => {
  test.skip(!phone, "set E2E_ADMIN_PHONE to run the admin journey");
  await signIn(page, phone!, "ADMIN");
  let secret = process.env.E2E_ADMIN_TOTP_SECRET ?? "";
  // Wait for the verification page: a new admin is offered setup, others go straight to the code.
  const setup = page.getByRole("button", { name: "Set up the authenticator" });
  const code = page.getByLabel("Authenticator code");
  await page.waitForURL("**/auth/mfa**");
  await expect(setup.or(code)).toBeVisible();
  if (await setup.isVisible()) {
    await setup.click();
    const href = await page.locator('a[href^="otpauth://"]').getAttribute("href");
    secret = new URL(href!.replace("otpauth://", "https://")).searchParams.get("secret")!;
  }
  expect(secret, "set E2E_ADMIN_TOTP_SECRET for an admin whose authenticator is already set up").not.toBe("");
  await code.fill(totp(secret));
  await page.getByRole("button", { name: "Verify" }).click();
  await page.waitForURL("**/admin");
  await acceptTerms(page);
  await expect(page.getByText("Orders today")).toBeVisible();
  await expectAccessible(page, "admin overview");

  for (const [path, heading] of [
    ["/admin/users", "Users"],
    ["/admin/orders", "Orders and returns"],
    ["/admin/payouts", "Seller payouts"],
    ["/admin/settings", "Settings"],
    ["/admin/audit", "Audit and reports"],
    ["/admin/health", "Health"],
  ] as const) {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
    await expectAccessible(page, path);
  }
});
