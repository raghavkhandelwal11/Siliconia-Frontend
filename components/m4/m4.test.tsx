import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { stubApi } from "@/test/fetch";
import { ProductCommunity } from "./ProductCommunity";
import { ReviewForm } from "./ReviewForm";
import { SellerProgrammes } from "./Portals";

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

describe("ProductCommunity", () => {
  it("shows buyer reviews, marks helpful and votes on creator reviews", async () => {
    const calls = stubApi([
      me,
      {
        method: "GET",
        path: "/products/p1/reviews",
        body: {
          items: [
            {
              id: "r1",
              rating: 4,
              title: "Solid",
              body: "Charges fast",
              author: "Ravi",
              helpful: 2,
              photos: [],
              verifiedPurchase: true,
              at: "2026-11-20T00:00:00Z",
            },
          ],
          summary: { count: 1, average: 4, stars: [0, 1, 0, 0, 0] },
        },
      },
      { method: "POST", path: "/reviews/r1/helpful", status: 204 },
      {
        method: "GET",
        path: "/products/p1/promoters",
        body: { items: [{ accountId: "pr1", displayName: "Angel Ravi", type: "INDIVIDUAL" }] },
      },
      { method: "GET", path: "/products/p1/bought-together", body: { items: [] } },
      {
        method: "GET",
        path: "/products/p1/creator-reviews",
        body: {
          items: [
            {
              id: "c1",
              creatorName: "Kiran",
              rating: 5,
              body: "Great battery",
              videos: ["https://youtu.be/x"],
              rank: 1,
              agrees: 3,
              disagrees: 0,
              myVote: 0,
              at: "2026-11-20T00:00:00Z",
            },
          ],
        },
      },
      { method: "POST", path: "/creator-reviews/c1/vote", status: 204 },
    ]);
    renderWithProviders(<ProductCommunity productId="p1" />);
    const user = userEvent.setup();
    expect(await screen.findByText("Charges fast")).toBeInTheDocument();
    await user.click(await screen.findByRole("button", { name: "Helpful (2)" }));
    await waitFor(() => expect(calls.some((c) => c.url.endsWith("/reviews/r1/helpful"))).toBe(true));
    await user.click(screen.getByRole("tab", { name: "Creator reviews" }));
    await user.click(await screen.findByRole("button", { name: "Agree (3)" }));
    await waitFor(() => expect(calls.some((c) => c.url.endsWith("/vote"))).toBe(true));
    expect(
      await calls
        .find((c) => c.url.endsWith("/vote"))!
        .clone()
        .json(),
    ).toEqual({ value: 1 });
    await user.click(screen.getByRole("tab", { name: /Promoted by/ }));
    expect(screen.getByText("Angel Ravi")).toBeInTheDocument();
  });
});

describe("ReviewForm", () => {
  it("posts a star rating and text", async () => {
    const calls = stubApi([{ method: "POST", path: "/order-items/i1/review", status: 201, body: { id: "r1" } }]);
    renderWithProviders(<ReviewForm itemId="i1" />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Write a review" }));
    await user.click(screen.getByRole("button", { name: "4 stars" }));
    await user.type(screen.getByLabelText("What did you like or dislike?"), "Good");
    await user.click(screen.getByRole("button", { name: "Post review" }));
    expect(await screen.findByText("Thanks! Your review is live.")).toBeInTheDocument();
    expect(await calls[0].clone().json()).toEqual({ rating: 4, title: "", body: "Good", photoIds: [] });
  });
});

describe("SellerProgrammes", () => {
  it("approves a demo request", async () => {
    const calls = stubApi([
      {
        method: "GET",
        path: "/seller/demo-requests",
        body: { items: [{ id: "d1", productName: "Volt Cell", creatorName: "Kiran", status: "REQUESTED" }] },
      },
      { method: "GET", path: "/seller/promoters", body: { items: [] } },
      { method: "GET", path: "/seller/feedback", body: { items: [] } },
      { method: "POST", path: "/seller/demo-requests/d1/decision", status: 204 },
    ]);
    renderWithProviders(<SellerProgrammes />);
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Approve and ship" }));
    await waitFor(() => expect(calls.some((c) => c.method === "POST")).toBe(true));
    expect(
      await calls
        .find((c) => c.method === "POST")!
        .clone()
        .json(),
    ).toEqual({ approve: true, reason: "" });
  });
});
