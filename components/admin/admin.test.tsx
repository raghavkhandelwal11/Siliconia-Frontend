import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { stubApi } from "@/test/fetch";
import { SellerReviewPanel } from "./SellerReviewPanel";
import { SellerQueue } from "./SellerQueue";

const review = {
  accountId: "a1",
  approval: "SUBMITTED",
  editable: false,
  phoneVerified: true,
  businessType: "PROPRIETORSHIP",
  legalName: "Asha Verma",
  storeName: "Asha Electronics",
  gstin: "27ABCDE1234F1Z5",
  gstinRequired: true,
  gstinMatchesPan: true,
  panVerified: true,
  panLast4: "234F",
  bankVerified: true,
  bankLast4: "1234",
  ifsc: "HDFC0001234",
  phone: "+919876500011",
  termsVersion: "seller-terms-2026-11",
  missing: [],
  panCheck: { status: "VERIFIED", nameMatch: 1, checkedAt: "2026-11-25T00:00:00Z" },
};

describe("SellerQueue", () => {
  it("lists waiting applications with links to review", async () => {
    stubApi([
      {
        method: "GET",
        path: "/admin/approvals/sellers",
        body: {
          applications: [
            {
              accountId: "a1",
              approval: "SUBMITTED",
              legalName: "Asha Verma",
              storeName: "Asha Electronics",
              panVerified: true,
              bankVerified: true,
              hasGstin: true,
              submittedAt: "2026-11-25T10:00:00Z",
            },
          ],
        },
      },
    ]);
    renderWithProviders(<SellerQueue />);
    expect(await screen.findByRole("link", { name: "Asha Electronics" })).toHaveAttribute(
      "href",
      "/admin/approvals/sellers/a1",
    );
    expect(screen.getByText("PAN · Bank · GSTIN")).toBeInTheDocument();
  });
});

describe("SellerReviewPanel", () => {
  it("needs a reason to send back, and sends it", async () => {
    const calls = stubApi([
      { method: "GET", path: "/admin/approvals/sellers/a1", body: review },
      {
        method: "POST",
        path: "/admin/approvals/sellers/a1/decision",
        body: { ...review, approval: "REJECTED", reason: "Use a business address" },
      },
    ]);
    renderWithProviders(<SellerReviewPanel id="a1" />);
    const user = userEvent.setup();
    const reject = await screen.findByRole("button", { name: "Send back for changes" });
    expect(screen.getByText("Issued to this PAN")).toBeInTheDocument();
    expect(screen.getByText("+91 98765 00011")).toBeInTheDocument();
    expect(reject).toBeDisabled();
    await user.type(screen.getByLabelText("Note to the seller"), "Use a business address");
    await user.click(reject);
    await waitFor(() => expect(screen.queryByRole("button", { name: "Approve" })).toBeNull());
    const post = calls.find((c) => c.method === "POST")!;
    expect(await post.clone().json()).toEqual({ decision: "REJECT", reason: "Use a business address" });
    expect(screen.getByText("Decision saved. The seller has been told by SMS.")).toBeInTheDocument();
  });

  it("shows the API's refusal while the admin views as another role", async () => {
    stubApi([
      { method: "GET", path: "/admin/approvals/sellers/a1", body: review },
      {
        method: "POST",
        path: "/admin/approvals/sellers/a1/decision",
        status: 403,
        body: { code: "SWITCH_BACK_REQUIRED", title: "Switch back to Admin to do this", status: 403, type: "x" },
      },
    ]);
    renderWithProviders(<SellerReviewPanel id="a1" />);
    await userEvent.setup().click(await screen.findByRole("button", { name: "Approve" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Switch back to Admin to do this");
  });
});
