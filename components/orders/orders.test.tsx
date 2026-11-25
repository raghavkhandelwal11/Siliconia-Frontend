import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { stubApi } from "@/test/fetch";
import type { Order } from "@/lib/checkout";
import type { SellerOrderDetail as Detail } from "@/lib/orders";
import { SellerOrderDetail } from "@/components/seller/orders/SellerOrderDetail";
import { SellerOrders } from "@/components/seller/orders/SellerOrders";
import { OrderDetail } from "./OrderDetail";

const address = {
  id: "a1",
  name: "Asha Rao",
  phone: "9876500000",
  line1: "12 MG Road",
  line2: "",
  city: "Bengaluru",
  state: "Karnataka",
  pincode: "560001",
  isDefault: true,
};

const order = (sub: Partial<Order["subOrders"][number]> = {}): Order => ({
  id: "o1",
  number: "SX-261125-K7Q2M",
  status: "CONFIRMED",
  payMethod: "ONLINE",
  placedAt: "2026-11-25T10:00:00Z",
  expiresAt: "2026-11-25T10:10:00Z",
  address,
  itemTotalPaise: 279900,
  mrpTotalPaise: 449900,
  shippingPaise: 0,
  payablePaise: 279900,
  subOrders: [
    {
      id: "s1",
      storeName: "Volt Store",
      status: "CONFIRMED",
      subtotalPaise: 279900,
      items: [
        {
          id: "i1",
          status: "ACTIVE",
          canReturn: false,
          name: "Volt Cell",
          slug: "volt-cell",
          attrs: { Colour: "Black" },
          qty: 1,
          unitPricePaise: 279900,
          unitMrpPaise: 449900,
          lineTotalPaise: 279900,
        },
      ],
      events: [{ status: "CONFIRMED", actor: "SYSTEM", note: "Payment received", at: "2026-11-25T10:01:00Z" }],
      canCancel: true,
      hasInvoice: false,
      isReplacement: false,
      ...sub,
    },
  ],
});

describe("OrderDetail", () => {
  it("cancels before shipping with a reason", async () => {
    const calls = stubApi([
      { method: "GET", path: "/orders/o1", body: order() },
      { method: "POST", path: "/sub-orders/s1/cancel", status: 204 },
    ]);
    renderWithProviders(<OrderDetail id="o1" />);
    const user = userEvent.setup();
    expect(await screen.findByText("Sold by Volt Store")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancel order" }));
    await user.click(screen.getByRole("button", { name: "Found it cheaper" }));
    const form = screen.getByLabelText("Why are you cancelling?").closest("form")!;
    await user.click(within(form).getByRole("button", { name: "Cancel order" }));
    await waitFor(() => expect(screen.getByText(/Your refund is on its way/)).toBeInTheDocument());
    const sent = calls.find((c) => c.method === "POST")!;
    expect(await sent.clone().json()).toEqual({ reason: "Found it cheaper" });
  });

  it("shows the invoice and history once shipped", async () => {
    stubApi([
      {
        method: "GET",
        path: "/orders/o1",
        body: order({
          status: "SHIPPED",
          canCancel: false,
          hasInvoice: true,
          isReplacement: false,
          events: [
            { status: "CONFIRMED", actor: "SYSTEM", at: "2026-11-25T10:01:00Z" },
            { status: "SHIPPED", actor: "SELLER", note: "AWB SX1", at: "2026-11-25T12:00:00Z" },
          ],
        }),
      },
    ]);
    renderWithProviders(<OrderDetail id="o1" />);
    expect(await screen.findByRole("link", { name: "Invoice (PDF)" })).toHaveAttribute("href", "/api/v1/invoices/s1");
    expect(screen.queryByRole("button", { name: "Cancel order" })).not.toBeInTheDocument();
    expect(screen.getByText("AWB SX1")).toBeInTheDocument();
  });
});

const detail = (extra: Partial<Detail> = {}): Detail => ({
  id: "s1",
  orderNumber: "SX-261125-K7Q2M",
  status: "CONFIRMED",
  placedAt: "2026-11-25T10:00:00Z",
  payMethod: "COD",
  subtotalPaise: 279900,
  itemCount: 1,
  buyerName: "Asha Rao",
  city: "Bengaluru",
  pincode: "560001",
  address,
  items: [
    {
      id: "i1",
      name: "Volt Cell",
      attrs: {},
      qty: 1,
      unitPricePaise: 279900,
      lineTotalPaise: 279900,
      status: "ACTIVE",
    },
  ],
  events: [],
  canPack: true,
  canShip: true,
  canCancel: true,
  ...extra,
});

describe("Seller orders", () => {
  it("filters the queue by status with counts", async () => {
    const calls = stubApi([
      {
        method: "GET",
        path: "/seller/orders",
        body: {
          items: [
            {
              id: "s1",
              orderNumber: "SX-261125-K7Q2M",
              status: "CONFIRMED",
              placedAt: "2026-11-25T10:00:00Z",
              payMethod: "COD",
              subtotalPaise: 279900,
              itemCount: 1,
              buyerName: "Asha Rao",
              city: "Bengaluru",
              pincode: "560001",
            },
          ],
          counts: { CONFIRMED: 1, DELIVERED: 4 },
        },
      },
    ]);
    renderWithProviders(<SellerOrders />);
    const user = userEvent.setup();
    expect(await screen.findByRole("link", { name: /SX-261125-K7Q2M/ })).toHaveAttribute("href", "/seller/orders/s1");
    expect(new URL(calls[0].url).searchParams.get("status")).toBe("CONFIRMED");
    await user.click(screen.getByRole("tab", { name: /Delivered/ }));
    await waitFor(() => expect(new URL(calls.at(-1)!.url).searchParams.get("status")).toBe("DELIVERED"));
  });

  it("packs and books the courier", async () => {
    const calls = stubApi([
      { method: "GET", path: "/seller/orders/s1", body: detail() },
      { method: "POST", path: "/seller/sub-orders/s1/pack", status: 204 },
      {
        method: "POST",
        path: "/seller/sub-orders/s1/ship",
        body: { awb: "SX1", status: "MANIFESTED", codAmountPaise: 279900, courier: "sim-ship" },
      },
    ]);
    renderWithProviders(<SellerOrderDetail id="s1" />);
    const user = userEvent.setup();
    expect(await screen.findByText(/Courier collects ₹2,799/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Mark as packed" }));
    await user.clear(screen.getByLabelText("Parcel weight (grams)"));
    await user.type(screen.getByLabelText("Parcel weight (grams)"), "350");
    await user.click(screen.getByRole("button", { name: "Book courier and ship" }));
    await waitFor(() => expect(calls.some((c) => c.url.endsWith("/ship"))).toBe(true));
    const ship = calls.find((c) => c.url.endsWith("/ship"))!;
    expect(await ship.clone().json()).toEqual({ weightGrams: 350 });
    expect(calls.some((c) => c.url.endsWith("/pack"))).toBe(true);
  });

  it("links the label and invoice after shipping", async () => {
    stubApi([
      {
        method: "GET",
        path: "/seller/orders/s1",
        body: detail({
          status: "SHIPPED",
          canPack: false,
          canShip: false,
          canCancel: false,
          awb: "SX1",
          shipmentStatus: "PICKED_UP",
        }),
      },
    ]);
    renderWithProviders(<SellerOrderDetail id="s1" />);
    expect(await screen.findByRole("link", { name: "Shipping label" })).toHaveAttribute(
      "href",
      "/api/v1/seller/sub-orders/s1/label",
    );
    expect(screen.getByRole("link", { name: "Invoice (PDF)" })).toHaveAttribute("href", "/api/v1/invoices/s1");
    expect(screen.getByText("Picked up")).toBeInTheDocument();
  });
});
