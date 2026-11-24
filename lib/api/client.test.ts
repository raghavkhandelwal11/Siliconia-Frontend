import { describe, expect, it } from "vitest";
import { stubApi } from "@/test/fetch";
import { api } from "./client";

describe("API client", () => {
  it("sends the CSRF cookie as a header on state-changing requests only", async () => {
    document.cookie = "sx_csrf=tok123; path=/";
    const calls = stubApi([
      { method: "GET", path: "/me", body: {} },
      { method: "POST", path: "/auth/logout", status: 204 },
    ]);
    await api.GET("/me");
    await api.POST("/auth/logout");
    expect(calls[0].headers.get("X-CSRF-Token")).toBeNull();
    expect(calls[1].headers.get("X-CSRF-Token")).toBe("tok123");
  });

  it("refreshes once on 401 and retries the request", async () => {
    const calls = stubApi([
      { method: "GET", path: "/me", status: 401, body: { code: "AUTH_REQUIRED" } },
      { method: "GET", path: "/me", body: { id: "a1" } },
      { method: "POST", path: "/auth/refresh", body: { account: {} } },
    ]);
    const res = await api.GET("/me");
    expect(res.response.status).toBe(200);
    expect(calls.map((c) => `${c.method} ${new URL(c.url).pathname}`)).toEqual([
      "GET /api/v1/me",
      "POST /api/v1/auth/refresh",
      "GET /api/v1/me",
    ]);
  });

  it("returns the 401 when the refresh also fails", async () => {
    const calls = stubApi([
      { method: "GET", path: "/me", status: 401, body: { code: "AUTH_REQUIRED" } },
      { method: "POST", path: "/auth/refresh", status: 401, body: { code: "AUTH_REQUIRED" } },
    ]);
    const res = await api.GET("/me");
    expect(res.response.status).toBe(401);
    expect(calls).toHaveLength(2);
  });

  it("never refreshes for the sign-in endpoints themselves", async () => {
    const calls = stubApi([
      { method: "POST", path: "/auth/otp/verify", status: 401, body: { code: "AUTH_OTP_INVALID" } },
    ]);
    await api.POST("/auth/otp/verify", { body: { challengeId: "c", code: "000000" } });
    expect(calls).toHaveLength(1);
  });
});
