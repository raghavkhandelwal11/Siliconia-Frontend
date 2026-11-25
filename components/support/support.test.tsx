import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { stubApi } from "@/test/fetch";
import { nav } from "@/test/navigation";
import type { Issue, Return } from "@/lib/support";
import { IssueThread } from "./IssueThread";
import { RaiseIssue } from "./RaiseIssue";
import { ReturnForm } from "./ReturnForm";
import { ReturnsPage } from "./ReturnsPage";
import { SellerReturns } from "./SellerReturns";

const ret = (extra: Partial<Return> = {}): Return => ({
  id: "r1",
  number: "RT-261126-ABCDE",
  orderId: "o1",
  orderNumber: "SX-261125-K7Q2M",
  itemId: "i1",
  productName: "Volt Cell",
  attrs: {},
  qty: 1,
  type: "RETURN",
  reason: "DAMAGED",
  status: "REQUESTED",
  refundAmountPaise: 0,
  createdAt: "2026-11-26T10:00:00Z",
  updatedAt: "2026-11-26T10:00:00Z",
  ...extra,
});

const issue = (extra: Partial<Issue> = {}): Issue => ({
  id: "is1",
  number: "IS-261126-QWERT",
  orderId: "o1",
  orderNumber: "SX-261125-K7Q2M",
  type: "DAMAGED",
  status: "WAITING_CUSTOMER",
  createdAt: "2026-11-26T10:00:00Z",
  updatedAt: "2026-11-26T11:00:00Z",
  messages: [
    { id: "m1", authorRole: "BUYER", body: "Box was crushed", at: "2026-11-26T10:00:00Z" },
    { id: "m2", authorRole: "SUPPORT", body: "Can you share a photo?", at: "2026-11-26T11:00:00Z" },
  ],
  ...extra,
});

describe("Returns", () => {
  it("requests a replacement with a reason", async () => {
    const calls = stubApi([
      { method: "POST", path: "/order-items/i1/returns", status: 201, body: ret({ type: "REPLACE" }) },
    ]);
    renderWithProviders(<ReturnForm orderId="o1" itemId="i1" />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Return or replace" }));
    expect(screen.getByRole("button", { name: "Request pickup" })).toBeDisabled();
    await user.click(screen.getByLabelText("Replacement"));
    await user.selectOptions(screen.getByLabelText("Reason"), "DEFECTIVE");
    await user.type(screen.getByLabelText(/Anything else/), "Won't charge");
    await user.click(screen.getByRole("button", { name: "Request pickup" }));
    await waitFor(() => expect(calls).toHaveLength(1));
    expect(await calls[0].clone().json()).toEqual({ type: "REPLACE", reason: "DEFECTIVE", note: "Won't charge" });
  });

  it("lists returns with their outcome", async () => {
    stubApi([
      {
        method: "GET",
        path: "/returns",
        body: {
          items: [
            ret({
              status: "REFUNDED",
              refundAmountPaise: 279900,
              outcomeNote: "Refunded to the original payment method",
            }),
          ],
        },
      },
    ]);
    renderWithProviders(<ReturnsPage />);
    expect(await screen.findByText("Refunded")).toBeInTheDocument();
    expect(screen.getByText("Refund ₹2,799")).toBeInTheDocument();
  });

  it("lets the seller approve or reject with a reason", async () => {
    const calls = stubApi([
      { method: "GET", path: "/seller/returns", body: { items: [ret({ note: "Screen cracked" })] } },
      { method: "POST", path: "/seller/returns/r1/decision", status: 204 },
    ]);
    renderWithProviders(<SellerReturns />);
    const user = userEvent.setup();
    expect(await screen.findByText(/Screen cracked/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reject" }));
    await user.type(screen.getByLabelText(/Why are you rejecting/), "Damage caused after delivery");
    await user.click(screen.getAllByRole("button", { name: "Reject" }).at(-1)!);
    await waitFor(() => expect(calls.some((c) => c.method === "POST")).toBe(true));
    expect(
      await calls
        .find((c) => c.method === "POST")!
        .clone()
        .json(),
    ).toEqual({ approve: false, reason: "Damage caused after delivery" });
  });
});

describe("Issues", () => {
  it("raises an issue in three steps", async () => {
    const calls = stubApi([
      {
        method: "GET",
        path: "/orders",
        body: {
          items: [
            {
              id: "o1",
              number: "SX-261125-K7Q2M",
              status: "CONFIRMED",
              payablePaise: 1,
              placedAt: "2026-11-25T10:00:00Z",
              itemCount: 1,
            },
          ],
        },
      },
      { method: "GET", path: "/orders/o1", status: 404 },
      { method: "POST", path: "/issues", status: 201, body: issue({ status: "OPEN" }) },
    ]);
    renderWithProviders(<RaiseIssue />);
    const user = userEvent.setup();
    await user.click(await screen.findByLabelText(/SX-261125-K7Q2M/));
    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.click(screen.getByLabelText("Arrived damaged"));
    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.type(screen.getByLabelText("Tell us what happened"), "Box was crushed");
    await user.click(screen.getByRole("button", { name: "Send to support" }));
    await waitFor(() => expect(nav.push).toHaveBeenCalledWith("/account/issues/is1"));
    expect(
      await calls
        .find((c) => c.method === "POST")!
        .clone()
        .json(),
    ).toEqual({ orderId: "o1", type: "DAMAGED", body: "Box was crushed" });
  });

  it("shows the conversation and sends a reply", async () => {
    const calls = stubApi([
      { method: "GET", path: "/issues/is1", body: issue() },
      { method: "POST", path: "/issues/is1/messages", body: issue({ status: "IN_PROGRESS" }) },
    ]);
    renderWithProviders(<IssueThread id="is1" />);
    const user = userEvent.setup();
    expect(await screen.findByText("Can you share a photo?")).toBeInTheDocument();
    expect(screen.getByText("Waiting for you")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Your message"), "Here it is");
    await user.click(screen.getByRole("button", { name: "Send" }));
    await waitFor(() => expect(screen.getByText("In progress")).toBeInTheDocument());
    expect(
      await calls
        .find((c) => c.method === "POST")!
        .clone()
        .json(),
    ).toEqual({ body: "Here it is" });
  });

  it("lets support reply and resolve", async () => {
    const calls = stubApi([
      { method: "GET", path: "/admin/issues/is1", body: issue({ status: "IN_PROGRESS" }) },
      { method: "POST", path: "/admin/issues/is1/messages", body: issue({ status: "RESOLVED" }) },
    ]);
    renderWithProviders(<IssueThread id="is1" support />);
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText("Your message"), "Replacement arranged");
    await user.selectOptions(screen.getByLabelText("Then mark the issue as"), "RESOLVED");
    await user.click(screen.getByRole("button", { name: "Send" }));
    await waitFor(() => expect(calls.some((c) => c.method === "POST")).toBe(true));
    expect(
      await calls
        .find((c) => c.method === "POST")!
        .clone()
        .json(),
    ).toEqual({ body: "Replacement arranged", status: "RESOLVED" });
  });

  it("offers reopen on a resolved issue", async () => {
    stubApi([
      { method: "GET", path: "/issues/is1", body: issue({ status: "RESOLVED" }) },
      { method: "POST", path: "/issues/is1/reopen", body: issue({ status: "IN_PROGRESS" }) },
    ]);
    renderWithProviders(<IssueThread id="is1" />);
    const user = userEvent.setup();
    expect(screen.queryByLabelText("Your message")).not.toBeInTheDocument();
    await user.click(await screen.findByRole("button", { name: "Reopen" }));
    expect(await screen.findByText("In progress")).toBeInTheDocument();
  });
});
