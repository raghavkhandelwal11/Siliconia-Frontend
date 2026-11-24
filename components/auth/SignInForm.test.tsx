import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { stubApi } from "@/test/fetch";
import { nav, resetNav } from "@/test/navigation";
import { SignInForm } from "./SignInForm";

const account = (role: string) => ({
  id: "a1",
  role,
  name: "",
  phone: "+919876543210",
  phoneVerified: true,
  approval: "APPROVED",
  mfaVerified: false,
  createdAt: "2026-11-24T00:00:00Z",
});

async function enterPhoneAndCode(code = "123456") {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Mobile number"), "9876543210");
  await user.click(screen.getByRole("button", { name: "Send code" }));
  await user.type(await screen.findByLabelText("6-digit code"), code);
  await user.click(screen.getByRole("button", { name: "Verify and continue" }));
  return user;
}

describe("SignInForm", () => {
  it("signs a buyer in with phone and code, then returns to next", async () => {
    resetNav("/auth/sign-in", "next=/cart");
    const calls = stubApi([
      { method: "GET", path: "/auth/google/status", body: { enabled: false } },
      { method: "POST", path: "/auth/otp/send", body: { challengeId: "c1", resendAfterSec: 30, expiresInSec: 300 } },
      { method: "POST", path: "/auth/otp/verify", body: { account: account("BUYER"), isNew: true } },
    ]);
    renderWithProviders(<SignInForm />);
    await enterPhoneAndCode();
    await waitFor(() => expect(nav.push).toHaveBeenCalledWith("/cart"));
    const send = calls.find((c) => c.url.endsWith("/auth/otp/send"))!;
    expect(await send.clone().json()).toEqual({ phone: "9876543210", role: "BUYER" });
    expect(screen.getByText(/You can ask for a new code in/)).toBeInTheDocument();
  });

  it("sends the chosen account type", async () => {
    const calls = stubApi([
      { method: "GET", path: "/auth/google/status", body: { enabled: true } },
      { method: "POST", path: "/auth/otp/send", body: { challengeId: "c1", resendAfterSec: 30, expiresInSec: 300 } },
      { method: "POST", path: "/auth/otp/verify", body: { account: account("SELLER"), isNew: true } },
    ]);
    renderWithProviders(<SignInForm />);
    const user = userEvent.setup();
    await user.click(screen.getByLabelText("Sell products"));
    expect(await screen.findByRole("link", { name: "Continue with Google" })).toHaveAttribute(
      "href",
      "/api/v1/auth/google/start?role=SELLER&next=%2Fseller",
    );
    await enterPhoneAndCode();
    await waitFor(() => expect(nav.push).toHaveBeenCalledWith("/seller"));
    const send = calls.find((c) => c.url.endsWith("/auth/otp/send"))!;
    expect((await send.clone().json()).role).toBe("SELLER");
  });

  it("sends admins to the authenticator step", async () => {
    resetNav("/auth/sign-in", "role=ADMIN");
    stubApi([
      { method: "GET", path: "/auth/google/status", body: { enabled: true } },
      { method: "POST", path: "/auth/otp/send", body: { challengeId: "c1", resendAfterSec: 30, expiresInSec: 300 } },
      { method: "POST", path: "/auth/otp/verify", body: { account: account("ADMIN"), isNew: false } },
    ]);
    renderWithProviders(<SignInForm />);
    expect(screen.getByRole("heading", { name: "Admin sign-in" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Continue with Google" })).toBeNull();
    await enterPhoneAndCode();
    await waitFor(() => expect(nav.push).toHaveBeenCalledWith("/auth/mfa?next=%2Fadmin"));
  });

  it("shows the API's message for a wrong code and stays on the code step", async () => {
    stubApi([
      { method: "GET", path: "/auth/google/status", body: { enabled: false } },
      { method: "POST", path: "/auth/otp/send", body: { challengeId: "c1", resendAfterSec: 30, expiresInSec: 300 } },
      {
        method: "POST",
        path: "/auth/otp/verify",
        status: 401,
        body: { code: "AUTH_OTP_INVALID", title: "That code is not right", status: 401, type: "about:blank" },
      },
    ]);
    renderWithProviders(<SignInForm />);
    await enterPhoneAndCode("000000");
    expect(await screen.findByRole("alert")).toHaveTextContent("That code is not right");
    expect(nav.push).not.toHaveBeenCalled();
    expect(screen.getByLabelText("6-digit code")).toBeInTheDocument();
  });
});
