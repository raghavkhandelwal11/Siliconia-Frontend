import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { stubApi } from "@/test/fetch";
import type { SellerApplication } from "@/lib/seller";
import { SellerOnboarding } from "./SellerOnboarding";
import { SellerHome } from "./SellerHome";

const base: SellerApplication = {
  accountId: "a1",
  approval: "DRAFT",
  editable: true,
  phoneVerified: true,
  legalName: "",
  storeName: "",
  gstinRequired: false,
  panVerified: false,
  bankVerified: false,
  termsVersion: "seller-terms-2026-11",
  missing: ["business", "pan", "bank", "pickup"],
};
const pickup = { line1: "12 MG Road", city: "Pune", state: "Maharashtra", pincode: "411001", phone: "9876543210" };

describe("SellerOnboarding", () => {
  it("saves business details, then shows a failed and a passed PAN check", async () => {
    const named = {
      ...base,
      businessType: "INDIVIDUAL" as const,
      legalName: "Asha Verma",
      storeName: "Asha",
      missing: ["pan", "bank", "pickup"],
    };
    const calls = stubApi([
      { method: "GET", path: "/seller/application", body: base },
      { method: "PUT", path: "/seller/application", body: named },
      {
        method: "POST",
        path: "/seller/application/pan",
        body: {
          ...named,
          panCheck: {
            status: "FAILED",
            reason: "No record found for this PAN",
            nameMatch: 0,
            checkedAt: "2026-11-25T00:00:00Z",
          },
        },
      },
      {
        method: "POST",
        path: "/seller/application/pan",
        body: {
          ...named,
          panVerified: true,
          panLast4: "234F",
          panCheck: { status: "VERIFIED", nameMatch: 1, checkedAt: "2026-11-25T00:00:00Z" },
        },
      },
    ]);
    renderWithProviders(<SellerOnboarding testMode />);
    const user = userEvent.setup();
    await user.selectOptions(await screen.findByLabelText("Business type"), "INDIVIDUAL");
    await user.type(screen.getByLabelText("Legal name"), "Asha Verma");
    await user.type(screen.getByLabelText("Store name"), "Asha");
    await user.click(screen.getByRole("button", { name: "Save and continue" }));

    const panField = await screen.findByLabelText("PAN");
    const put = calls.find((c) => c.method === "PUT")!;
    expect(await put.clone().json()).toMatchObject({
      businessType: "INDIVIDUAL",
      legalName: "Asha Verma",
      storeName: "Asha",
    });
    expect(screen.getByText(/AAAAA0000A is not found/)).toBeInTheDocument();

    await user.type(panField, "aaaaa0000a");
    await user.click(screen.getByRole("button", { name: "Verify PAN" }));
    expect(await screen.findByText("No record found for this PAN")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();

    await user.clear(panField);
    await user.type(panField, "ABCDE1234F");
    await user.click(screen.getByRole("button", { name: "Verify PAN" }));
    expect(await screen.findByText("Verified (ending 234F)")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled();
  });

  it("submits a complete application with the terms accepted", async () => {
    const ready = {
      ...base,
      businessType: "INDIVIDUAL" as const,
      legalName: "Asha Verma",
      storeName: "Asha",
      panVerified: true,
      panLast4: "234F",
      bankVerified: true,
      bankLast4: "1234",
      ifsc: "HDFC0001234",
      pickupAddress: pickup,
      missing: [],
    };
    const calls = stubApi([
      { method: "GET", path: "/seller/application", body: ready },
      {
        method: "POST",
        path: "/seller/application/submit",
        body: { ...ready, approval: "SUBMITTED", editable: false, submittedAt: "2026-11-25T10:00:00Z" },
      },
    ]);
    renderWithProviders(<SellerOnboarding />);
    const user = userEvent.setup();
    expect(await screen.findByText("Everything is ready to submit.")).toBeInTheDocument();
    const submit = screen.getByRole("button", { name: "Submit for approval" });
    expect(submit).toBeDisabled();
    await user.click(screen.getByLabelText(/seller terms/));
    await user.click(submit);
    expect(
      await screen.findByText("Our team is checking your details. We will send you an SMS with the result."),
    ).toBeInTheDocument();
    expect(
      await calls
        .find((c) => c.url.endsWith("/submit"))!
        .clone()
        .json(),
    ).toEqual({ acceptTerms: true });
  });

  it("shows the admin's reason after a rejection", async () => {
    stubApi([
      {
        method: "GET",
        path: "/seller/application",
        body: { ...base, approval: "REJECTED", reason: "Use a business address" },
      },
    ]);
    renderWithProviders(<SellerHome />);
    expect(await screen.findByText("Use a business address")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Continue your application" })).toHaveAttribute(
      "href",
      "/seller/onboarding",
    );
  });
});
