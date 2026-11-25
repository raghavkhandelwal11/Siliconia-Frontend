import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { stubApi } from "@/test/fetch";
import { deliveryDate } from "@/lib/shipping";
import { PinCheck } from "./PinCheck";
import { Tracking } from "./Tracking";

describe("PinCheck", () => {
  it("shows the delivery date and COD for a served PIN", async () => {
    stubApi([
      {
        method: "GET",
        path: "/serviceability/560001",
        body: { pincode: "560001", deliverable: true, cod: true, etaDays: 2 },
      },
      {
        method: "GET",
        path: "/serviceability/791111",
        body: { pincode: "791111", deliverable: true, cod: false, etaDays: 6 },
      },
      {
        method: "GET",
        path: "/serviceability/999997",
        body: { pincode: "999997", deliverable: false, cod: false, etaDays: 0 },
      },
    ]);
    renderWithProviders(<PinCheck />);
    const user = userEvent.setup();
    const input = screen.getByLabelText("PIN code for delivery");
    await user.type(input, "5600");
    await user.click(screen.getByRole("button", { name: "Check" }));
    expect(screen.getByText("Enter a 6-digit PIN code.")).toBeInTheDocument();

    await user.type(input, "01");
    await user.click(screen.getByRole("button", { name: "Check" }));
    expect(await screen.findByText(`Delivery by ${deliveryDate(2)}`)).toBeInTheDocument();
    expect(screen.getByText("Cash on delivery available")).toBeInTheDocument();

    await user.clear(input);
    await user.type(input, "791111{Enter}");
    expect(await screen.findByText("Prepaid only for this PIN code")).toBeInTheDocument();

    await user.clear(input);
    await user.type(input, "999997{Enter}");
    expect(await screen.findByText("We don't deliver to this PIN code yet")).toBeInTheDocument();
  });
});

describe("Tracking", () => {
  it("shows progress, the AWB and courier scans newest first", async () => {
    renderWithProviders(
      <Tracking
        status="OUT_FOR_DELIVERY"
        shipment={{
          awb: "SX123456789012",
          courier: "sim-ship",
          status: "OUT_FOR_DELIVERY",
          eta: "2026-11-28T10:00:00Z",
          events: [
            { status: "MANIFESTED", location: "Noida", at: "2026-11-25T10:00:00Z" },
            { status: "PICKED_UP", location: "Noida", at: "2026-11-25T11:00:00Z" },
            { status: "OUT_FOR_DELIVERY", location: "Bengaluru", at: "2026-11-27T08:00:00Z" },
          ],
        }}
      />,
    );
    const user = userEvent.setup();
    expect(screen.getByText(/AWB SX123456789012/)).toBeInTheDocument();
    expect(screen.getByText("(current step)", { exact: false })).toBeInTheDocument();
    await user.click(screen.getByText("3 tracking updates"));
    const scans = screen.getAllByRole("listitem").filter((li) => li.closest("details"));
    expect(scans[0]).toHaveTextContent("Out for delivery · Bengaluru");
    expect(scans[2]).toHaveTextContent("Shipment booked · Noida");
  });

  it("explains a parcel returned to the seller", () => {
    renderWithProviders(<Tracking status="RTO" />);
    expect(screen.getByText(/returned it to the seller/)).toBeInTheDocument();
  });
});
