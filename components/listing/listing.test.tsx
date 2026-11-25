import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { stubApi } from "@/test/fetch";
import { nav, resetNav } from "@/test/navigation";
import type { SearchResult } from "@/lib/search";
import { listingParams, toggleListValue } from "@/lib/search";
import { Listing } from "./Listing";
import { SearchBox } from "./SearchBox";

const card = (id: string, name: string, price: number, extra = {}) => ({
  id,
  slug: `${id}-slug`,
  name,
  brand: "Nova",
  coverUrl: `/api/v1/media/products/${id}.jpg`,
  pricePaise: price,
  mrpPaise: price * 1.25,
  discountPct: 20,
  inStock: true,
  ratingAvg: 0,
  ratingCount: 0,
  isLocal: false,
  verifiedSeller: true,
  ...extra,
});

const result: SearchResult = {
  items: [card("a", "Nova 5G", 1899900, { isLocal: true }), card("b", "Nova Lite", 899900, { inStock: false })],
  total: 3,
  page: 1,
  pageSize: 2,
  facets: {
    categories: [],
    brands: [
      { value: "Nova", count: 2 },
      { value: "Zen", count: 1 },
    ],
    price: [899900, 5999900],
    specs: [
      {
        key: "os",
        label: "Operating system",
        type: "enum",
        options: [
          { value: "Android", count: 2 },
          { value: "iOS", count: 1 },
        ],
      },
      { key: "ram_gb", label: "RAM", type: "number", unit: "GB", min: 4, max: 8 },
    ],
  },
};

describe("search helpers", () => {
  it("keeps only listing parameters and toggles list values", () => {
    expect(
      listingParams(
        { q: "nova", foo: "x", "spec.os": "iOS", brand: ["Zen", "Nova"] },
        { category: "smartphones" },
      ).toString(),
    ).toBe("q=nova&spec.os=iOS&brand=Zen&category=smartphones");
    expect(toggleListValue("Nova,Zen", "Zen")).toBe("Nova");
    expect(toggleListValue(null, "Zen")).toBe("Zen");
  });
});

describe("Listing", () => {
  it("shows cards with badges, and filters write to the URL", async () => {
    resetNav("/c/smartphones", "brand=Nova&spec.ram_gb=6..8");
    renderWithProviders(<Listing result={result} title="Smartphones" fixed={{ category: "smartphones" }} />);
    const user = userEvent.setup();
    expect(screen.getByRole("heading", { name: "Smartphones" })).toBeInTheDocument();
    expect(screen.getByText("Out of stock")).toBeInTheDocument();
    expect(screen.getAllByText("Made in India").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /Nova 5G/ })).toHaveAttribute("href", "/p/a-slug");
    // Active chips from the URL, removable in one tap.
    expect(screen.getByRole("button", { name: "Remove filter Nova" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove filter RAM: 6–8 GB" })).toBeInTheDocument();

    await user.click(screen.getAllByLabelText(/^iOS/)[0]);
    expect(nav.push).toHaveBeenLastCalledWith("/c/smartphones?brand=Nova&spec.ram_gb=6..8&spec.os=iOS", {
      scroll: false,
    });
    await user.selectOptions(screen.getByLabelText("Sort by"), "price_asc");
    expect(nav.push).toHaveBeenLastCalledWith("/c/smartphones?brand=Nova&spec.ram_gb=6..8&sort=price_asc", {
      scroll: false,
    });
    await user.click(screen.getByRole("button", { name: "Remove filter Nova" }));
    expect(nav.push).toHaveBeenLastCalledWith("/c/smartphones?spec.ram_gb=6..8", { scroll: false });
  });

  it("loads the next page with the page's fixed category", async () => {
    resetNav("/c/smartphones", "");
    const calls = stubApi([
      { method: "GET", path: "/products", body: { ...result, page: 2, items: [card("c", "Zen Pro", 5999900)] } },
    ]);
    renderWithProviders(<Listing result={result} title="Smartphones" fixed={{ category: "smartphones" }} />);
    await userEvent.setup().click(screen.getByRole("button", { name: "Load more" }));
    expect(await screen.findByRole("link", { name: /Zen Pro/ })).toBeInTheDocument();
    expect(new URL(calls[0].url).search).toBe("?page=2&category=smartphones");
    expect(screen.queryByRole("button", { name: "Load more" })).toBeNull();
    expect(screen.getByText("Showing 3 of 3")).toBeInTheDocument();
  });

  it("shows an empty state", () => {
    renderWithProviders(<Listing result={{ ...result, items: [], total: 0 }} title="Search" />);
    expect(screen.getByText("Nothing matches yet")).toBeInTheDocument();
  });
});

describe("SearchBox", () => {
  it("suggests as you type and opens the chosen suggestion", async () => {
    stubApi([
      {
        method: "GET",
        path: "/products/suggest",
        body: {
          suggestions: [
            { kind: "product", text: "Nova 5G", slug: "nova-5g", brand: "Nova" },
            { kind: "category", text: "Smartphones", slug: "smartphones" },
          ],
        },
      },
    ]);
    renderWithProviders(<SearchBox />);
    const user = userEvent.setup();
    const box = screen.getByRole("combobox", { name: "Search products" });
    await user.type(box, "nov");
    expect(await screen.findByRole("option", { name: /Nova 5G/ })).toBeInTheDocument();
    await user.keyboard("{ArrowDown}{ArrowDown}{Enter}");
    await waitFor(() => expect(nav.push).toHaveBeenCalledWith("/c/smartphones"));
  });

  it("searches the typed text and remembers it", async () => {
    stubApi([{ method: "GET", path: "/products/suggest", body: { suggestions: [] } }]);
    renderWithProviders(<SearchBox />);
    const user = userEvent.setup();
    await user.type(screen.getByRole("combobox", { name: "Search products" }), "gaming laptop{Enter}");
    expect(nav.push).toHaveBeenCalledWith("/search?q=gaming%20laptop");
    expect(JSON.parse(localStorage.getItem("sx-recent-searches")!)).toEqual(["gaming laptop"]);
  });
});
