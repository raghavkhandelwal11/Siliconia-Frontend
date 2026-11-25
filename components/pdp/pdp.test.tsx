import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { stubApi } from "@/test/fetch";
import { nav } from "@/test/navigation";
import { optionGroups, pickVariant, specText, type ProductPage } from "@/lib/pdp";
import { BuyBox } from "./BuyBox";
import { Gallery } from "./Gallery";
import { MainSpecs, SpecTable } from "./Specs";

const product: ProductPage = {
  id: "p1",
  slug: "nova-5g",
  name: "Nova 5G",
  brand: "Nova",
  model: "N5",
  description: "A phone.",
  warranty: "1 year",
  originCountry: "IN",
  isLocal: true,
  ratingAvg: 0,
  ratingCount: 0,
  category: {
    slug: "smartphones",
    name: "Smartphones",
    parentSlug: "mobiles-tablets",
    parentName: "Mobiles & Tablets",
  },
  seller: { storeName: "Nova Store", verified: true },
  specs: [
    { key: "ram_gb", label: "RAM", value: 8, unit: "GB", main: true },
    { key: "has_5g", label: "5G", value: true },
    { key: "ports", label: "Ports", value: ["USB-C", "USB-A"] },
  ],
  variants: [
    { id: "v1", sku: "A", attrs: { Colour: "Black" }, mrpPaise: 2499900, pricePaise: 1899900 },
    { id: "v2", sku: "B", attrs: { Colour: "Blue" }, mrpPaise: 2499900, pricePaise: 1999900 },
  ],
  images: [
    { url: "/a.jpg", alt: "Front", width: 900, height: 900 },
    { url: "/b.jpg", alt: "Back", width: 900, height: 900 },
  ],
  updatedAt: "2026-11-25T00:00:00Z",
};

const live = (actions: object[], extra = {}) => ({
  method: "GET",
  path: "/products/p1/live",
  body: {
    viewer: "ANONYMOUS",
    isMember: false,
    actions,
    variants: [
      { id: "v1", pricePaise: 1899900, mrpPaise: 2499900, available: 40, electronsNonMember: 95, electronsMember: 380 },
      { id: "v2", pricePaise: 1999900, mrpPaise: 2499900, available: 3, electronsNonMember: 100, electronsMember: 400 },
    ],
    ...extra,
  },
});

describe("product helpers", () => {
  it("groups options, picks variants and formats specs", () => {
    expect(optionGroups(product.variants)).toEqual({ Colour: ["Black", "Blue"] });
    expect(pickVariant(product.variants, { Colour: "Blue" }).id).toBe("v2");
    expect(specText(5000, "mAh")).toBe("5,000 mAh");
    expect(specText(["USB-C", "USB-A"])).toBe("USB-C, USB-A");
    expect(specText(false)).toBe("No");
  });
});

describe("BuyBox", () => {
  it("shows live price, stock and Electrons for the chosen variant", async () => {
    stubApi([
      live([
        { key: "buy_now", enabled: false, reason: "SIGN_IN" },
        { key: "add_to_cart", enabled: false, reason: "SIGN_IN" },
      ]),
    ]);
    renderWithProviders(<BuyBox product={product} />);
    const user = userEvent.setup();
    expect(await screen.findByText("In stock (40 available)")).toBeInTheDocument();
    expect(screen.getByText("₹18,999")).toBeInTheDocument();
    expect(screen.getByText("24% off")).toBeInTheDocument();
    expect(screen.getByText("Earn 95 Electrons on this order")).toBeInTheDocument();
    expect(screen.getByText(/Electra members earn 380/)).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Sign in to buy" })[0]).toHaveAttribute(
      "href",
      "/auth/sign-in?next=/p/nova-5g",
    );
    expect(screen.getByRole("button", { name: "Buy now" })).toBeDisabled();

    await user.click(screen.getByLabelText("Blue"));
    expect(screen.getByText("₹19,999")).toBeInTheDocument();
    expect(screen.getByText("Only 3 left")).toBeInTheDocument();
  });

  it("Buy now adds the variant and opens checkout", async () => {
    const calls = stubApi([
      live([
        { key: "buy_now", enabled: true },
        { key: "add_to_cart", enabled: true },
      ]),
      {
        method: "GET",
        path: "/cart",
        body: {
          groups: [],
          itemCount: 0,
          subtotalPaise: 0,
          mrpTotalPaise: 0,
          savingsPaise: 0,
          electronsNonMember: 0,
          electronsMember: 0,
          canCheckout: false,
        },
      },
      {
        method: "PUT",
        path: "/cart/items/v1",
        body: {
          groups: [],
          itemCount: 1,
          subtotalPaise: 0,
          mrpTotalPaise: 0,
          savingsPaise: 0,
          electronsNonMember: 0,
          electronsMember: 0,
          canCheckout: true,
        },
      },
    ]);
    renderWithProviders(<BuyBox product={product} />);
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Buy now" }));
    await waitFor(() => expect(nav.push).toHaveBeenCalledWith("/checkout"));
    expect(calls.some((c) => c.method === "PUT" && c.url.endsWith("/cart/items/v1"))).toBe(true);
  });

  it("gives the product's seller an edit link", async () => {
    stubApi([live([{ key: "edit", enabled: true, href: "/seller/products/p1" }], { viewer: "SELLER" })]);
    renderWithProviders(<BuyBox product={product} />);
    expect(await screen.findByRole("link", { name: "Edit this product" })).toHaveAttribute(
      "href",
      "/seller/products/p1",
    );
  });
});

describe("Gallery and specs", () => {
  it("switches photos from thumbnails and arrows", async () => {
    renderWithProviders(<Gallery images={product.images} name="Nova 5G" />);
    const user = userEvent.setup();
    expect(screen.getByRole("img", { name: "Front" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Show photo 2" }));
    expect(screen.getByRole("img", { name: "Back" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Next photo" }));
    expect(screen.getByRole("img", { name: "Front" })).toBeInTheDocument();
  });

  it("highlights main specs and lists all specs with units", () => {
    renderWithProviders(
      <>
        <MainSpecs specs={product.specs} />
        <SpecTable product={product} />
      </>,
    );
    expect(screen.getAllByText("8 GB").length).toBe(2);
    expect(screen.getByRole("rowheader", { name: "5G" }).nextSibling).toHaveTextContent("Yes");
    expect(screen.getByRole("rowheader", { name: "Country of origin" }).nextSibling).toHaveTextContent("India");
  });
});
