import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { Timeline } from "./Timeline";

const events = [
  { status: "PENDING_PAYMENT", actor: "BUYER", at: "2026-11-26T03:15:00Z" },
  { status: "PACKED", actor: "SELLER", at: "2026-11-26T03:17:00Z" },
] as Parameters<typeof Timeline>[0]["events"];

describe("Timeline", () => {
  it("names the actor from the viewer's side", () => {
    const { unmount } = renderWithProviders(<Timeline events={events} />);
    expect(screen.getByText(/· You/).previousSibling?.textContent).toMatch(/payment/i);
    unmount();
    renderWithProviders(<Timeline events={events} viewer="seller" />);
    expect(screen.getByText(/· Buyer/)).toBeInTheDocument();
    expect(screen.getByText(/· You/).previousSibling?.textContent).toMatch(/Packed/);
  });
});
