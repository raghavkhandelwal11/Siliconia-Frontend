import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { stubApi } from "@/test/fetch";
import { nav } from "@/test/navigation";
import { AccountMenu } from "./AccountMenu";

const admin = {
  id: "a1",
  role: "ADMIN",
  name: "Root",
  phoneVerified: true,
  approval: "APPROVED",
  mfaVerified: true,
  createdAt: "2026-11-24T00:00:00Z",
};

describe("AccountMenu", () => {
  it("offers sign-in when nobody is signed in", async () => {
    stubApi([
      { method: "GET", path: "/me", status: 401, body: { code: "AUTH_REQUIRED" } },
      { method: "POST", path: "/auth/refresh", status: 401, body: { code: "AUTH_REQUIRED" } },
    ]);
    renderWithProviders(<AccountMenu />);
    expect(await screen.findByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/auth/sign-in");
  });

  it("asks an admin to finish the authenticator step", async () => {
    stubApi([{ method: "GET", path: "/me", status: 403, body: { code: "MFA_REQUIRED", title: "x" } }]);
    renderWithProviders(<AccountMenu />);
    expect(await screen.findByRole("link", { name: "Finish signing in" })).toHaveAttribute("href", "/auth/mfa");
  });

  it("lets an admin view the site as another role", async () => {
    const calls = stubApi([
      { method: "GET", path: "/me", body: admin },
      { method: "POST", path: "/admin/role-switch", body: { actingRole: "SELLER" } },
    ]);
    renderWithProviders(<AccountMenu />);
    const user = userEvent.setup();
    await user.click(await screen.findByText("Root"));
    await user.selectOptions(screen.getByLabelText("View as"), "SELLER");
    await waitFor(() => expect(nav.push).toHaveBeenCalledWith("/seller"));
    const sw = calls.find((c) => c.url.endsWith("/admin/role-switch"))!;
    expect(await sw.clone().json()).toEqual({ role: "SELLER" });
  });
});
