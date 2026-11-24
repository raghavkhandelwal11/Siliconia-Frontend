import { describe, expect, it } from "vitest";
import { effectiveRole, formatPhone, homeFor, safeNext } from "./session";
import type { Account } from "@/lib/api/client";

const account = (over: Partial<Account>): Account => ({
  id: "a",
  role: "BUYER",
  name: "",
  phoneVerified: true,
  approval: "APPROVED",
  mfaVerified: false,
  createdAt: "2026-11-24T00:00:00Z",
  ...over,
});

describe("session helpers", () => {
  it("only allows same-site relative next paths", () => {
    expect(safeNext("/cart")).toBe("/cart");
    expect(safeNext("https://evil.example")).toBe("/");
    expect(safeNext("//evil.example")).toBe("/");
    expect(safeNext("/\\evil.example")).toBe("/");
    expect(safeNext(null, "/admin")).toBe("/admin");
  });

  it("uses the acting role only for admins", () => {
    expect(effectiveRole(account({ role: "ADMIN", actingRole: "SELLER" }))).toBe("SELLER");
    expect(effectiveRole(account({ role: "ADMIN" }))).toBe("ADMIN");
    expect(effectiveRole(account({ role: "BUYER", actingRole: "SELLER" }))).toBe("BUYER");
  });

  it("formats Indian numbers for display", () => {
    expect(formatPhone("+919876543210")).toBe("+91 98765 43210");
    expect(formatPhone(undefined)).toBe("");
  });

  it("sends each role to its home", () => {
    expect(homeFor("BUYER")).toBe("/");
    expect(homeFor("SELLER")).toBe("/seller");
    expect(homeFor("ADMIN")).toBe("/admin");
  });
});
