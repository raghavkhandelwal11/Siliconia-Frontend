import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { stubApi } from "@/test/fetch";
import { AdminAudit, AdminPayouts, AdminUsers } from "./Admin";
import { SellerPayouts } from "./Seller";

describe("AdminPayouts", () => {
  it("approves a draft batch", async () => {
    const calls = stubApi([
      {
        method: "GET",
        path: "/admin/payout-batches",
        body: {
          items: [
            { id: "b1", weekEnding: "2026-11-30", status: "DRAFT", payouts: 2, netPaise: 150000, paid: 0, failed: 0 },
          ],
        },
      },
      { method: "POST", path: "/admin/payout-batches/b1/approve", status: 204 },
    ]);
    renderWithProviders(<AdminPayouts />);
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Approve" }));
    await waitFor(() => expect(calls.some((c) => c.url.endsWith("/payout-batches/b1/approve"))).toBe(true));
    expect(screen.queryByRole("button", { name: "Release to bank" })).not.toBeInTheDocument();
  });
});

describe("AdminAudit", () => {
  it("requests an Electrons adjustment", async () => {
    const calls = stubApi([
      { method: "GET", path: "/admin/audit", body: { items: [] } },
      { method: "GET", path: "/admin/ledger-adjustments", body: { items: [] } },
      { method: "POST", path: "/admin/ledger-adjustments", status: 201, body: { id: "r1" } },
    ]);
    renderWithProviders(<AdminAudit />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Account ID"), "a1");
    await user.type(screen.getByLabelText("Electrons"), "-20");
    await user.type(screen.getByLabelText("Reason"), "Duplicate credit");
    await user.click(screen.getByRole("button", { name: "Request" }));
    await waitFor(() => expect(calls.some((c) => c.method === "POST")).toBe(true));
    expect(
      await calls
        .find((c) => c.method === "POST")!
        .clone()
        .json(),
    ).toEqual({ accountId: "a1", amount: -20, reason: "Duplicate credit" });
  });
});

describe("SellerPayouts", () => {
  it("shows net, breakdown and a failed transfer", async () => {
    stubApi([
      {
        method: "GET",
        path: "/seller/payouts",
        body: {
          items: [
            {
              id: "p1",
              batchId: "b1",
              grossPaise: 100000,
              commissionPaise: 8000,
              tdsPaise: 100,
              netPaise: 91900,
              status: "FAILED",
              failureReason: "Invalid account",
              createdAt: "2026-11-30T00:00:00Z",
            },
          ],
        },
      },
    ]);
    renderWithProviders(<SellerPayouts />);
    expect(await screen.findByText("₹919")).toBeInTheDocument();
    expect(screen.getByText(/Invalid account/)).toBeInTheDocument();
    expect(screen.getByText("Sales ₹1,000 − commission ₹80 − TDS ₹1")).toBeInTheDocument();
  });
});

describe("AdminUsers", () => {
  it("shows phone and account ID from the API fields", async () => {
    stubApi([
      {
        method: "GET",
        path: "/admin/accounts",
        body: { items: [{ id: "acc-1", role: "BUYER", name: "Ravi", phoneE164: "+919876500001", status: "ACTIVE" }] },
      },
    ]);
    renderWithProviders(<AdminUsers />);
    expect(await screen.findByText("+919876500001")).toBeInTheDocument();
    expect(screen.getByText("acc-1")).toBeInTheDocument();
  });
});
