import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { stubApi } from "@/test/fetch";
import { nav } from "@/test/navigation";
import { browser, type Address, type Order, type Quote } from "@/lib/checkout";
import { AddressBook } from "./AddressBook";
import { CheckoutPage } from "./CheckoutPage";
import { ResultPage } from "./ResultPage";

const me = (phoneVerified = true) => ({
  method: "GET",
  path: "/me",
  body: {
    id: "a1",
    role: "BUYER",
    name: "Asha",
    phoneVerified,
    approval: "APPROVED",
    mfaVerified: false,
    createdAt: "2026-11-01T00:00:00Z",
  },
});

const home: Address = {
  id: "ad1",
  name: "Asha Rao",
  phone: "9876500000",
  line1: "12 MG Road",
  line2: "",
  city: "Bengaluru",
  state: "Karnataka",
  pincode: "560001",
  isDefault: true,
};

const quote = (extra: Partial<Quote> = {}): Quote => ({
  groups: [
    {
      storeName: "Volt Store",
      subtotalPaise: 559800,
      lines: [
        {
          variantId: "v1",
          name: "Volt Cell",
          slug: "volt-cell",
          attrs: { Colour: "Black" },
          qty: 2,
          unitPricePaise: 279900,
          unitMrpPaise: 449900,
          lineTotalPaise: 559800,
        },
      ],
    },
  ],
  itemCount: 2,
  itemTotalPaise: 559800,
  mrpTotalPaise: 899800,
  savingsPaise: 340000,
  shippingPaise: 0,
  payablePaise: 559800,
  codEligible: true,
  codLimitPaise: 800000,
  electronsNonMember: 28,
  electronsMember: 112,
  quoteHash: "h1",
  canPlace: true,
  address: home,
  ...extra,
});

const order = (extra: Partial<Order> = {}): Order => ({
  id: "o1",
  number: "SX-261125-K7Q2M",
  status: "PENDING_PAYMENT",
  payMethod: "ONLINE",
  placedAt: "2026-11-25T10:00:00Z",
  expiresAt: new Date(Date.now() + 9 * 60_000).toISOString(),
  address: home,
  itemTotalPaise: 559800,
  mrpTotalPaise: 899800,
  shippingPaise: 0,
  payablePaise: 559800,
  subOrders: [
    {
      id: "s1",
      storeName: "Volt Store",
      status: "PENDING_PAYMENT",
      subtotalPaise: 559800,
      items: [
        {
          name: "Volt Cell",
          slug: "volt-cell",
          attrs: {},
          qty: 2,
          unitPricePaise: 279900,
          unitMrpPaise: 449900,
          lineTotalPaise: 559800,
        },
      ],
    },
  ],
  payment: { status: "CREATED", checkoutUrl: "http://localhost:8080/pay/checkout/pay_1" },
  ...extra,
});

afterEach(() => vi.restoreAllMocks());

describe("CheckoutPage", () => {
  it("places an online order with an idempotency key and goes to the payment page", async () => {
    const go = vi.spyOn(browser, "go").mockImplementation(() => {});
    const calls = stubApi([
      me(),
      { method: "GET", path: "/me/addresses", body: { items: [home], max: 10 } },
      { method: "POST", path: "/checkout/quote", body: quote() },
      { method: "POST", path: "/orders", status: 201, body: order() },
    ]);
    renderWithProviders(<CheckoutPage />);
    const user = userEvent.setup();
    expect(await screen.findByText("Sold by Volt Store")).toBeInTheDocument();
    expect(screen.getByText(/12 MG Road/)).toBeInTheDocument();
    expect(screen.getByText("Free")).toBeInTheDocument();
    await user.click(await screen.findByRole("button", { name: /Pay ₹5,598/ }));
    await waitFor(() => expect(go).toHaveBeenCalledWith("http://localhost:8080/pay/checkout/pay_1"));
    const placed = calls.find((c) => c.method === "POST" && c.url.endsWith("/orders"))!;
    expect(placed.headers.get("Idempotency-Key")).toBeTruthy();
    expect(await placed.clone().json()).toEqual({ addressId: "ad1", payMethod: "ONLINE", quoteHash: "h1" });
  });

  it("confirms cash on delivery orders without the payment page", async () => {
    stubApi([
      me(),
      { method: "GET", path: "/me/addresses", body: { items: [home], max: 10 } },
      { method: "POST", path: "/checkout/quote", body: quote() },
      {
        method: "POST",
        path: "/orders",
        status: 201,
        body: order({ status: "CONFIRMED", payMethod: "COD", payment: undefined }),
      },
    ]);
    renderWithProviders(<CheckoutPage />);
    const user = userEvent.setup();
    await user.click(await screen.findByLabelText(/Cash on delivery/));
    await user.click(await screen.findByRole("button", { name: /Place order · ₹5,598/ }));
    await waitFor(() => expect(nav.push).toHaveBeenCalledWith("/checkout/result?order=o1"));
  });

  it("asks for a verified phone and explains COD limits", async () => {
    stubApi([
      me(false),
      { method: "GET", path: "/me/addresses", body: { items: [home], max: 10 } },
      { method: "POST", path: "/checkout/quote", body: quote({ codEligible: false }) },
    ]);
    renderWithProviders(<CheckoutPage />);
    expect(await screen.findByText(/Verify your mobile number/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Pay ₹5,598/ })).toBeDisabled();
    expect(screen.getByLabelText(/Cash on delivery/)).toBeDisabled();
    expect(screen.getByText("Available for orders up to ₹8,000.")).toBeInTheDocument();
  });

  it("shows the address form when there is no saved address", async () => {
    stubApi([
      me(),
      { method: "GET", path: "/me/addresses", body: { items: [], max: 10 } },
      { method: "POST", path: "/checkout/quote", body: quote({ canPlace: false, address: undefined }) },
    ]);
    renderWithProviders(<CheckoutPage />);
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Save address" }));
    expect(screen.getByText("Enter a 6-digit PIN code.")).toBeInTheDocument();
    expect(screen.getByText("Enter a 10-digit Indian mobile number.")).toBeInTheDocument();
  });
});

describe("ResultPage", () => {
  it("polls until the payment confirms the order", async () => {
    nav.search = new URLSearchParams("order=o1");
    stubApi([
      { method: "GET", path: "/orders/o1", body: order() },
      { method: "GET", path: "/orders/o1", body: order({ status: "CONFIRMED", payment: { status: "CAPTURED" } }) },
    ]);
    renderWithProviders(<ResultPage />);
    expect(await screen.findByText("Confirming your payment")).toBeInTheDocument();
    expect(await screen.findByText("Order confirmed", {}, { timeout: 4000 })).toBeInTheDocument();
    expect(screen.getByText("SX-261125-K7Q2M")).toBeInTheDocument();
  });

  it("offers a retry after a failed payment", async () => {
    nav.search = new URLSearchParams("order=o1");
    const go = vi.spyOn(browser, "go").mockImplementation(() => {});
    stubApi([
      { method: "GET", path: "/orders/o1", body: order({ payment: { status: "FAILED", failureCode: "DECLINED" } }) },
      { method: "POST", path: "/orders/o1/pay", body: { checkoutUrl: "/pay/checkout/pay_1" } },
    ]);
    renderWithProviders(<ResultPage />);
    const user = userEvent.setup();
    expect(await screen.findByText("Payment didn't go through")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Try payment again" }));
    await waitFor(() => expect(go).toHaveBeenCalledWith("/pay/checkout/pay_1"));
  });

  it("explains an expired order", async () => {
    nav.search = new URLSearchParams("order=o1");
    stubApi([{ method: "GET", path: "/orders/o1", body: order({ status: "EXPIRED" }) }]);
    renderWithProviders(<ResultPage />);
    expect(await screen.findByText("Order expired")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Buy it again" })).toHaveAttribute("href", "/p/volt-cell");
  });
});

describe("AddressBook", () => {
  it("lists addresses and saves a new one", async () => {
    const calls = stubApi([
      { method: "GET", path: "/me/addresses", body: { items: [home], max: 10 } },
      { method: "POST", path: "/me/addresses", status: 201, body: { ...home, id: "ad2", isDefault: false } },
    ]);
    renderWithProviders(<AddressBook />);
    const user = userEvent.setup();
    expect(await screen.findByText("Default")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Add an address" }));
    await user.type(screen.getByLabelText("Full name"), "Ravi Kumar");
    await user.type(screen.getByLabelText("Mobile number"), "9876511111");
    await user.type(screen.getByLabelText("House, building, street"), "4 Park Street");
    await user.type(screen.getByLabelText("PIN code"), "700016");
    await user.type(screen.getByLabelText("City"), "Kolkata");
    await user.selectOptions(screen.getByLabelText("State"), "West Bengal");
    await user.click(screen.getByRole("button", { name: "Save address" }));
    await waitFor(() => expect(calls.some((c) => c.method === "POST" && c.url.endsWith("/me/addresses"))).toBe(true));
    const sent = await calls
      .find((c) => c.method === "POST")!
      .clone()
      .json();
    expect(sent).toMatchObject({ name: "Ravi Kumar", pincode: "700016", state: "West Bengal" });
  });
});
