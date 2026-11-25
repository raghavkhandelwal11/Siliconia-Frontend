import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { stubApi } from "@/test/fetch";
import { nav } from "@/test/navigation";
import { discountPct, formatPaise, toPaise, type ProductEditor as Product } from "@/lib/products";
import { ProductList } from "./ProductList";
import { NewProduct } from "./NewProduct";
import { ProductEditor } from "./ProductEditor";

const draft: Product = {
  id: "p1",
  slug: "nova-5g-abc123",
  status: "DRAFT",
  category: {
    id: "c-phones",
    slug: "smartphones",
    name: "Smartphones",
    parentName: "Mobiles & Tablets",
    parentIcon: "phone",
  },
  specSchema: {
    fields: [
      { key: "ram_gb", label: "RAM", type: "number", unit: "GB", required: true, main: true },
      { key: "os", label: "Operating system", type: "enum", options: ["Android", "iOS"], required: true },
      { key: "has_5g", label: "5G", type: "boolean" },
    ],
  },
  name: "Nova 5G",
  brand: "Nova",
  model: "",
  description: "",
  warranty: "",
  originCountry: "IN",
  isLocal: false,
  specs: {},
  variants: [],
  images: [],
  missing: ["description", "warranty", "specs", "variants", "images"],
  specProblems: [{ key: "ram_gb", message: "RAM is required" }],
  version: 1,
  updatedAt: "2026-11-25T00:00:00Z",
};

describe("money helpers", () => {
  it("formats paise as rupees and parses rupee input", () => {
    expect(formatPaise(1999900)).toBe("₹19,999");
    expect(toPaise("19,999.50")).toBe(1999950);
    expect(Number.isNaN(toPaise("abc"))).toBe(true);
    expect(discountPct(2499900, 1999900)).toBe(20);
  });
});

describe("ProductList", () => {
  it("shows cards with price ranges and stock", async () => {
    stubApi([
      {
        method: "GET",
        path: "/seller/products",
        body: {
          products: [
            {
              id: "p1",
              slug: "s",
              name: "Nova 5G",
              brand: "Nova",
              status: "ACTIVE",
              categoryName: "Smartphones",
              minPricePaise: 1949900,
              maxPricePaise: 1999900,
              variantCount: 2,
              available: 30,
              coverUrl: "/api/v1/media/products/x.jpg",
              updatedAt: "2026-11-25T00:00:00Z",
            },
          ],
        },
      },
    ]);
    renderWithProviders(<ProductList />);
    expect(await screen.findByRole("link", { name: /Nova 5G/ })).toHaveAttribute("href", "/seller/products/p1");
    expect(screen.getByText("₹19,499 – ₹19,999")).toBeInTheDocument();
    expect(screen.getByText("30 in stock · 2 variants")).toBeInTheDocument();
    expect(screen.getByText("Live")).toBeInTheDocument();
  });

  it("sends sellers who are not approved to their application", async () => {
    stubApi([
      {
        method: "GET",
        path: "/seller/products",
        status: 403,
        body: { code: "SELLER_NOT_APPROVED", title: "x", status: 403, type: "x" },
      },
    ]);
    renderWithProviders(<ProductList />);
    expect(await screen.findByRole("link", { name: "Go to your application" })).toHaveAttribute(
      "href",
      "/seller/onboarding",
    );
  });
});

describe("NewProduct", () => {
  it("picks a category, then a sub-category, then creates the draft", async () => {
    const calls = stubApi([
      {
        method: "GET",
        path: "/categories",
        body: {
          categories: [
            {
              id: "c1",
              slug: "mobiles-tablets",
              name: "Mobiles & Tablets",
              icon: "phone",
              children: [{ id: "c-phones", slug: "smartphones", name: "Smartphones", examples: "5G phones" }],
            },
          ],
        },
      },
      { method: "POST", path: "/seller/products", body: draft },
    ]);
    renderWithProviders(<NewProduct />);
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: /Mobiles & Tablets/ }));
    await user.click(screen.getByRole("button", { name: /Smartphones/ }));
    await user.type(screen.getByLabelText("Product name"), "Nova 5G");
    await user.click(screen.getByRole("button", { name: "Create draft" }));
    await waitFor(() => expect(nav.push).toHaveBeenCalledWith("/seller/products/p1"));
    expect(
      await calls
        .find((c) => c.method === "POST")!
        .clone()
        .json(),
    ).toEqual({ categoryId: "c-phones", name: "Nova 5G", brand: "" });
  });
});

describe("ProductEditor", () => {
  it("renders spec fields from the schema and shows per-field errors from the API", async () => {
    stubApi([
      { method: "GET", path: "/seller/products/p1", body: draft },
      {
        method: "PUT",
        path: "/seller/products/p1",
        status: 422,
        body: {
          code: "SPECS_INVALID",
          title: "Some specifications are not valid",
          status: 422,
          type: "x",
          fields: [{ key: "ram_gb", message: "RAM must be a number of 0 or more" }],
        },
      },
    ]);
    renderWithProviders(<ProductEditor id="p1" />);
    const user = userEvent.setup();
    expect(await screen.findByRole("heading", { name: "Nova 5G" })).toBeInTheDocument();
    expect(screen.getByLabelText(/Operating system/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Publish product/ })).toBeDisabled();
    expect(screen.getByText("1/6")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Save details" }));
    expect(await screen.findByText("RAM must be a number of 0 or more")).toBeInTheDocument();
  });

  it("saves variants with prices in paise and stock", async () => {
    const calls = stubApi([
      { method: "GET", path: "/seller/products/p1", body: draft },
      {
        method: "PUT",
        path: "/seller/products/p1/variants",
        body: {
          ...draft,
          version: 2,
          variants: [
            {
              id: "v1",
              sku: "NOVA-128",
              attrs: {},
              mrpPaise: 2499900,
              pricePaise: 1999900,
              stock: 25,
              reserved: 0,
              sold: 0,
            },
          ],
          missing: ["description", "warranty", "specs", "images"],
        },
      },
    ]);
    renderWithProviders(<ProductEditor id="p1" />);
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText("SKU"), "NOVA-128");
    await user.type(screen.getByLabelText("MRP (₹)"), "24999");
    await user.type(screen.getByLabelText("Price (₹)"), "19999");
    expect(screen.getByText("20% off · sells at ₹19,999")).toBeInTheDocument();
    await user.clear(screen.getByLabelText("Stock"));
    await user.type(screen.getByLabelText("Stock"), "25");
    await user.click(screen.getByRole("button", { name: "Save variants" }));
    await waitFor(() => expect(screen.getByText("2/6")).toBeInTheDocument());
    const put = calls.find((c) => c.method === "PUT")!;
    expect(await put.clone().json()).toEqual({
      variants: [{ sku: "NOVA-128", attrs: {}, mrpPaise: 2499900, pricePaise: 1999900, stock: 25 }],
    });
  });
});
