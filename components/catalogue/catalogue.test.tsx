import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { stubApi } from "@/test/fetch";
import type { CategoryDetail, CategoryNode } from "@/lib/catalogue";
import { CategoryGrid } from "./CategoryGrid";
import { CategoryOverview } from "./CategoryOverview";
import { CategoryMenu } from "./CategoryMenu";

const sub = (slug: string, name: string): CategoryNode => ({ id: slug, slug, name, examples: `${name} examples` });
const tree: CategoryNode[] = [
  {
    id: "m",
    slug: "mobiles-tablets",
    name: "Mobiles & Tablets",
    icon: "phone",
    children: ["a", "b", "c", "d", "e", "f"].map((x) => sub(`s-${x}`, `Sub ${x}`)),
  },
  { id: "g", slug: "gaming", name: "Gaming", icon: "unknown-icon", children: [sub("consoles", "Consoles")] },
];

describe("CategoryGrid", () => {
  it("links every category and its first sub-categories", () => {
    renderWithProviders(<CategoryGrid categories={tree} />);
    expect(screen.getByRole("link", { name: "Mobiles & Tablets" })).toHaveAttribute("href", "/c/mobiles-tablets");
    expect(screen.getByRole("link", { name: "Sub e" })).toHaveAttribute("href", "/c/s-e");
    expect(screen.queryByRole("link", { name: "Sub f" })).toBeNull();
    expect(screen.getByRole("link", { name: "See all 6" })).toHaveAttribute("href", "/c/mobiles-tablets");
    expect(screen.getByRole("link", { name: "Shop Gaming" })).toBeInTheDocument();
  });
});

describe("CategoryOverview", () => {
  const smartphones: CategoryDetail = {
    id: "s",
    slug: "smartphones",
    name: "Smartphones",
    examples: "5G phones, foldables",
    parent: { id: "m", slug: "mobiles-tablets", name: "Mobiles & Tablets" },
    children: [],
    specSchema: {
      fields: [
        { key: "ram_gb", label: "RAM", type: "number", unit: "GB", filter: true },
        { key: "chip", label: "Chip", type: "text" },
        { key: "has_5g", label: "5G", type: "boolean", filter: true },
      ],
    },
  };

  it("shows the breadcrumb, filterable specs and an empty product state", () => {
    renderWithProviders(<CategoryOverview category={smartphones} />);
    const crumbs = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(within(crumbs).getByRole("link", { name: "Mobiles & Tablets" })).toHaveAttribute(
      "href",
      "/c/mobiles-tablets",
    );
    expect(screen.getByRole("heading", { level: 1, name: "Smartphones" })).toBeInTheDocument();
    expect(screen.getByText("RAM (GB)")).toBeInTheDocument();
    expect(screen.getByText("5G")).toBeInTheDocument();
    expect(screen.queryByText("Chip")).toBeNull();
    expect(screen.getByText("No products here yet")).toBeInTheDocument();
  });

  it("lists sub-categories for a top-level category", () => {
    renderWithProviders(
      <CategoryOverview category={{ ...tree[0], children: tree[0].children!, specSchema: { fields: [] } }} />,
    );
    expect(screen.getByRole("heading", { name: "Sub-categories" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Sub f/ })).toHaveAttribute("href", "/c/s-f");
    expect(screen.queryByText("No products here yet")).toBeNull();
  });
});

describe("CategoryMenu", () => {
  it("loads the tree only when opened", async () => {
    const calls = stubApi([{ method: "GET", path: "/categories", body: { categories: tree } }]);
    renderWithProviders(<CategoryMenu />);
    expect(calls).toHaveLength(0);
    await userEvent.setup().click(screen.getByText("Categories"));
    expect(await screen.findByRole("link", { name: "Consoles" })).toHaveAttribute("href", "/c/consoles");
    expect(calls).toHaveLength(1);
  });
});
