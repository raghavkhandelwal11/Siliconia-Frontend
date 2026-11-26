import { expect, test } from "@playwright/test";
import { acceptTerms, expectAccessible, newPhone, signIn } from "./helpers";

test("new creator applies for review", async ({ page }) => {
  await signIn(page, newPhone(), "CREATOR");
  await acceptTerms(page);
  await page.goto("/creator");
  await expect(page.getByRole("heading", { name: "Creator studio" })).toBeVisible();
  await page.getByLabel("Your niche (e.g. phones, audio)").fill("Phones and audio");
  await page.getByLabel("Short bio").fill("I review phones and earbuds every week.");
  await page.getByLabel("Channel link (https)").fill("https://youtube.com/@e2e-creator");
  await page.getByLabel("Followers").fill("6000");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page.getByRole("button", { name: "Submit for review" }).click();
  await expect(page.getByText("Under review").first()).toBeVisible();
  await expectAccessible(page, "creator studio");
});

test("new promoter applies for review", async ({ page }) => {
  await signIn(page, newPhone(), "PROMOTER");
  await acceptTerms(page);
  await page.goto("/promoter");
  await page.getByLabel("Display name").fill("E2E Angel Investor");
  await page.getByRole("button", { name: "Submit for review" }).click();
  await expect(page.getByText("Under review").first()).toBeVisible();
  await expectAccessible(page, "promoter dashboard");
});
