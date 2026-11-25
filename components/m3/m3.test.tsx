import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { stubApi } from "@/test/fetch";
import { nav } from "@/test/navigation";
import { browser } from "@/lib/checkout";
import type { Launch } from "@/lib/m3";
import { ElectronsPage } from "./ElectronsPage";
import { LaunchPage } from "./LaunchPage";
import { MembershipPage } from "./MembershipPage";

afterEach(() => vi.restoreAllMocks());

const me = {
  method: "GET",
  path: "/me",
  body: {
    id: "a1",
    role: "BUYER",
    name: "Asha",
    phoneVerified: true,
    approval: "APPROVED",
    mfaVerified: false,
    createdAt: "2026-11-01T00:00:00Z",
  },
};

const launch = (extra: Partial<Launch> = {}): Launch => ({
  id: "l1",
  productName: "Nova 5G",
  productSlug: "nova-5g",
  attrs: { Colour: "Black" },
  status: "LIVE",
  startsAt: "2026-11-25T10:00:00Z",
  mrpPaise: 2499900,
  normalPricePaise: 2000000,
  dealPricePaise: 400000,
  dealDiscountBps: 8000,
  dealUnits: 6,
  dealRemaining: 4,
  held: 1,
  normalAvailable: 14,
  perMemberLimit: 1,
  waitingRoom: false,
  serverTime: new Date().toISOString(),
  isMember: true,
  ...extra,
});

describe("LaunchPage", () => {
  it("reserves a deal unit and goes to checkout with the claim", async () => {
    const calls = stubApi([
      me,
      { method: "GET", path: "/launches/l1", body: launch() },
      {
        method: "POST",
        path: "/launches/l1/reserve",
        status: 201,
        body: { id: "c1", launchId: "l1", qty: 1, status: "HELD", heldUntil: new Date(Date.now() + 6e5).toISOString() },
      },
    ]);
    renderWithProviders(<LaunchPage id="l1" />);
    const user = userEvent.setup();
    expect(await screen.findByText("4 of 6 deal units left")).toBeInTheDocument();
    await user.click(await screen.findByRole("button", { name: "Reserve at the deal price" }));
    await waitFor(() => expect(nav.push).toHaveBeenCalledWith("/checkout?claim=c1"));
    expect(
      await calls
        .find((c) => c.method === "POST")!
        .clone()
        .json(),
    ).toEqual({ qty: 1 });
  });

  it("sends non-members to membership and explains a sell-out", async () => {
    stubApi([me, { method: "GET", path: "/launches/l1", body: launch({ isMember: false }) }]);
    const { unmount } = renderWithProviders(<LaunchPage id="l1" />);
    expect(await screen.findByRole("link", { name: "Join Electra to buy this deal" })).toHaveAttribute(
      "href",
      "/membership",
    );
    unmount();
    stubApi([
      me,
      { method: "GET", path: "/launches/l1", body: launch({ status: "DEAL_SOLD_OUT", dealRemaining: 0, held: 0 }) },
    ]);
    renderWithProviders(<LaunchPage id="l1" />);
    expect(await screen.findByText("All items on discount were purchased")).toBeInTheDocument();
  });
});

describe("Membership and Electrons", () => {
  it("buys membership partly with Electrons and goes to the payment page", async () => {
    const go = vi.spyOn(browser, "go").mockImplementation(() => {});
    const calls = stubApi([
      {
        method: "GET",
        path: "/membership",
        body: { status: "NONE", isMember: false, autoRenew: false, hasMandate: false, feePaise: 65000 },
      },
      { method: "GET", path: "/electrons", body: { available: 100, pending: 0 } },
      {
        method: "POST",
        path: "/membership/purchase",
        body: { purchaseId: "p1", status: "PENDING_PAYMENT", checkoutUrl: "/pay/checkout/x" },
      },
    ]);
    renderWithProviders(<MembershipPage />);
    const user = userEvent.setup();
    expect(await screen.findByRole("button", { name: "Pay ₹650" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Pay ₹650" }));
    await waitFor(() => expect(go).toHaveBeenCalledWith("/pay/checkout/x"));
    expect(
      await calls
        .find((c) => c.method === "POST")!
        .clone()
        .json(),
    ).toEqual({ electrons: 0, autoRenew: true });
  });

  it("shows balances and history", async () => {
    stubApi([
      {
        method: "GET",
        path: "/electrons",
        body: { available: 56, pending: 12, nextExpiry: { amount: 56, at: "2027-12-02T00:00:00Z" } },
      },
      {
        method: "GET",
        path: "/electrons/ledger",
        body: {
          items: [
            { id: "e1", type: "MATURE", amount: 56, refType: "ORDER_ITEM", refId: "i1", at: "2026-12-02T00:00:00Z" },
          ],
        },
      },
    ]);
    renderWithProviders(<ElectronsPage />);
    expect(await screen.findByText("Worth ₹56 off your orders")).toBeInTheDocument();
    expect(await screen.findByText("Now available")).toBeInTheDocument();
    expect(screen.getByText("+56")).toBeInTheDocument();
  });
});
