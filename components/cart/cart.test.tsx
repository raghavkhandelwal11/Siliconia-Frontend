import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { stubApi } from "@/test/fetch";
import type { Cart } from "@/lib/cart";
import type { ProductPage } from "@/lib/pdp";
import { CartPage } from "./CartPage";
import { CartButton } from "./CartButton";
import { BuyBox } from "@/components/pdp/BuyBox";

const line = (id: string, name: string, extra = {}) => ({
  variantId: id,
  productId: `p-${id}`,
  slug: `${id}-slug`,
  name,
  brand: "Volt",
  attrs: { Colour: "Black" },
  coverUrl: `/api/v1/media/products/${id}.jpg`,
  qty: 2,
  pricePaise: 279900,
  mrpPaise: 449900,
  priceAtAddPaise: 279900,
  available: 5,
  ...extra,
});

const cart: Cart = {
  groups: [
    { storeName: "Volt Store", subtotalPaise: 559800, lines: [line("v1", "Volt Cell")] },
    {
      storeName: "Orbit Store",
      subtotalPaise: 0,
      lines: [
        line("v2", "Orbit Slim", {
          problem: "LOW_STOCK",
          qty: 4,
          available: 2,
          pricePaise: 99900,
          priceAtAddPaise: 109900,
        }),
      ],
    },
  ],
  itemCount: 2,
  subtotalPaise: 559800,
  mrpTotalPaise: 899800,
  savingsPaise: 340000,
  electronsNonMember: 28,
  electronsMember: 112,
  canCheckout: false,
  merged: { lines: 2, adjusted: true },
};

describe("CartPage", () => {
  it("groups by seller and shows warnings, savings and Electrons", async () => {
    stubApi([{ method: "GET", path: "/cart", body: cart }]);
    renderWithProviders(<CartPage />);
    expect(await screen.findByText("Sold by Volt Store")).toBeInTheDocument();
    expect(screen.getByText("Sold by Orbit Store")).toBeInTheDocument();
    expect(screen.getByText(/Some quantities changed/)).toBeInTheDocument();
    expect(screen.getByText("Only 2 left.")).toBeInTheDocument();
    expect(screen.getByText("Price dropped by ₹100 since you added it")).toBeInTheDocument();
    expect(screen.getByText("−₹3,400")).toBeInTheDocument();
    expect(screen.getByText(/Earn 28 Electrons/)).toBeInTheDocument();
    expect(screen.getByText("Fix the items marked above to check out.")).toBeInTheDocument();
  });

  it("changes quantities and fixes low stock in one tap", async () => {
    const calls = stubApi([
      { method: "GET", path: "/cart", body: cart },
      { method: "PUT", path: "/cart/items/v1", body: { ...cart, merged: undefined } },
      { method: "PUT", path: "/cart/items/v2", body: { ...cart, merged: undefined } },
    ]);
    renderWithProviders(<CartPage />);
    const user = userEvent.setup();
    await user.click((await screen.findAllByRole("button", { name: "One more" }))[0]);
    await user.click(screen.getByRole("button", { name: "Keep 2" }));
    await waitFor(() => expect(calls.filter((c) => c.method === "PUT")).toHaveLength(2));
    const puts = calls.filter((c) => c.method === "PUT");
    expect(await puts[0].clone().json()).toEqual({ qty: 3 });
    expect(await puts[1].clone().json()).toEqual({ qty: 2 });
  });

  it("explains carts to other account types", async () => {
    stubApi([
      { method: "GET", path: "/cart", status: 403, body: { code: "OTHER_ROLE", title: "x", status: 403, type: "x" } },
    ]);
    renderWithProviders(<CartPage />);
    expect(await screen.findByText(/Carts are for shoppers/)).toBeInTheDocument();
  });

  it("shows the item count in the header", async () => {
    stubApi([{ method: "GET", path: "/cart", body: cart }]);
    renderWithProviders(<CartButton />);
    expect(await screen.findByRole("link", { name: "Cart, 2 items" })).toHaveAttribute("href", "/cart");
  });
});

describe("BuyBox cart and wishlist", () => {
  const product = {
    id: "p1",
    slug: "volt-cell",
    name: "Volt Cell",
    brand: "Volt",
    model: "",
    description: "",
    warranty: "",
    originCountry: "IN",
    isLocal: false,
    ratingAvg: 0,
    ratingCount: 0,
    category: { slug: "power-banks", name: "Power banks" },
    seller: { storeName: "Volt Store", verified: false },
    specs: [],
    variants: [{ id: "v1", sku: "A", attrs: {}, mrpPaise: 449900, pricePaise: 279900 }],
    images: [],
    updatedAt: "2026-11-25T00:00:00Z",
  } as ProductPage;

  it("adds to cart and saves to the wishlist", async () => {
    const calls = stubApi([
      {
        method: "GET",
        path: "/products/p1/live",
        body: {
          viewer: "BUYER",
          isMember: false,
          saved: [],
          actions: [
            { key: "add_to_cart", enabled: true },
            { key: "buy_now", enabled: false, reason: "COMING_M2" },
            { key: "wishlist", enabled: true },
          ],
          variants: [
            {
              id: "v1",
              pricePaise: 279900,
              mrpPaise: 449900,
              available: 5,
              electronsNonMember: 14,
              electronsMember: 56,
            },
          ],
        },
      },
      { method: "GET", path: "/cart", body: { ...cart, groups: [], itemCount: 0 } },
      { method: "PUT", path: "/cart/items/v1", body: { ...cart, groups: [cart.groups[0]] } },
      { method: "PUT", path: "/wishlist/v1", status: 204 },
    ]);
    renderWithProviders(<BuyBox product={product} />);
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Add to cart" }));
    expect(await screen.findByText(/Added\. 2 in your cart/)).toBeInTheDocument();
    expect(
      await calls
        .find((c) => c.url.endsWith("/cart/items/v1"))!
        .clone()
        .json(),
    ).toEqual({ qty: 1 });
    await user.click(screen.getByRole("button", { name: "Add to wishlist" }));
    expect(await screen.findByRole("button", { name: "Saved to wishlist" })).toHaveAttribute("aria-pressed", "true");
  });
});
