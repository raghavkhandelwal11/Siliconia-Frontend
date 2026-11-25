import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { stubApi } from "@/test/fetch";
import type { CategoryNode } from "@/lib/catalogue";
import { CategoryGrid } from "./CategoryGrid";
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
