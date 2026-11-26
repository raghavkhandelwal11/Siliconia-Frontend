import { createHmac } from "node:crypto";
import AxeBuilder from "@axe-core/playwright";
import { expect, type APIRequestContext, type Page } from "@playwright/test";

type Role = "BUYER" | "SELLER" | "CREATOR" | "PROMOTER" | "ADMIN";

const inboxAuth = () =>
  "Basic " + Buffer.from(`tester:${process.env.TEST_INBOX_PASSWORD ?? "change-me-tester"}`).toString("base64");

/** A fresh, valid Indian mobile number so every run starts with new accounts. */
export function newPhone(): string {
  return "9" + String(Math.floor(Math.random() * 1e9)).padStart(9, "0");
}

type Message = { id: string; to: string; body: string };

// E2E_INBOX_URL reads codes straight from the backend when the site under test
// only forwards the inbox page (Netlify, or the lite server's web app).
async function inbox(request: APIRequestContext): Promise<Message[]> {
  const base = process.env.E2E_INBOX_URL ?? "";
  const res = await request.get(`${base}/test-inbox/api/messages`, { headers: { Authorization: inboxAuth() } });
  return ((await res.json()) as { messages: Message[] }).messages;
}

/** IDs of the messages already in the test inbox, taken before asking for a code. */
export async function seenMessages(request: APIRequestContext): Promise<Set<string>> {
  return new Set((await inbox(request)).map((m) => m.id));
}

/** The 6-digit code from the first new inbox message for a phone (compared by ID, not clock). */
export async function codeFor(request: APIRequestContext, phone: string, seen: Set<string>): Promise<string> {
  for (let i = 0; i < 40; i++) {
    const m = (await inbox(request)).find((x) => !seen.has(x.id) && x.to.endsWith(phone) && /\b\d{6}\b/.test(x.body));
    if (m) return m.body.match(/\b(\d{6})\b/)![1];
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`no sign-in code for ${phone} (rate-limited? at most 3 codes per number per 15 minutes)`);
}

/** Signs in through the real form, reading the code from the test inbox. */
export async function signIn(page: Page, phone: string, role: Role) {
  await page.goto(role === "ADMIN" ? "/auth/sign-in?role=ADMIN" : "/auth/sign-in");
  if (role !== "ADMIN") await page.locator("label", { has: page.locator(`input[value="${role}"]`) }).click();
  const seen = await seenMessages(page.request);
  await page.getByLabel("Mobile number").fill(phone);
  await page.getByRole("button", { name: "Send code" }).click();
  await page.getByLabel("6-digit code").fill(await codeFor(page.request, phone, seen));
  await page.getByRole("button", { name: "Verify and continue" }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/auth/sign-in"));
}

/** Accepts updated terms when the prompt shows (new accounts). */
export async function acceptTerms(page: Page) {
  const accept = page.getByRole("button", { name: "I accept" });
  if (await accept.isVisible().catch(() => false)) {
    await accept.click();
    await expect(accept).toBeHidden();
  }
}

/** Calls the API as the signed-in browser (cookies plus CSRF header), for test setup only. */
export async function api(page: Page, method: string, path: string, data?: unknown) {
  const csrf = (await page.context().cookies()).find((c) => c.name === "sx_csrf")?.value ?? "";
  const res = await page.request.fetch(`/api/v1${path}`, { method, data, headers: { "X-CSRF-Token": csrf } });
  expect(res.ok(), `${method} ${path}: ${res.status()} ${await res.text()}`).toBeTruthy();
  return res.status() === 204 ? null : res.json();
}

/** RFC 6238 code for an authenticator secret (base32). */
export function totp(secret: string, at = Date.now()): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const c of secret.replace(/=+$/, "").toUpperCase()) bits += alphabet.indexOf(c).toString(2).padStart(5, "0");
  const key = Buffer.from(bits.match(/.{8}/g)!.map((b) => parseInt(b, 2)));
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(at / 30_000)));
  const h = createHmac("sha1", key).update(counter).digest();
  const o = h[19] & 15;
  return String((h.readUInt32BE(o) & 0x7fffffff) % 1_000_000).padStart(6, "0");
}

/** No serious or critical WCAG 2.2 AA problems on the current page (T6.4). */
export async function expectAccessible(page: Page, what: string) {
  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  const bad = violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map(
      (v) =>
        `${v.id}: ${v.nodes
          .map((n) => n.target.join(" "))
          .slice(0, 3)
          .join(" | ")}`,
    );
  expect(bad, `accessibility problems on ${what}`).toEqual([]);
}

/** Slug of a product that is in stock right now. */
export async function inStockSlug(request: APIRequestContext): Promise<string> {
  const res = await request.get("/api/v1/products?inStock=true&sort=price_asc");
  const { items } = (await res.json()) as { items: { slug: string }[] };
  expect(items.length, "no product in stock: run `make demo` in the backend").toBeGreaterThan(0);
  return items[0].slug;
}

/** Clicks "Add to cart" and waits until the cart has saved the item. */
export async function addToCart(page: Page) {
  const saved = page.waitForResponse(
    (r) => r.url().includes("/cart/items/") && r.request().method() === "PUT" && r.ok(),
  );
  await page.getByRole("button", { name: "Add to cart" }).click();
  await saved;
}
