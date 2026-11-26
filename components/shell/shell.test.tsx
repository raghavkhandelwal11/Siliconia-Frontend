import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { AppShell } from "./AppShell";

describe("AppShell", () => {
  it("shows the TEST MODE banner with a link to the test inbox in the prototype", () => {
    renderWithProviders(<AppShell testMode>content</AppShell>);
    expect(screen.getByRole("status")).toHaveTextContent("TEST MODE");
    expect(screen.getByRole("link", { name: "Open the test inbox" })).toHaveAttribute("href", "/test-inbox");
  });

  it("hides the banner when test mode is off", () => {
    renderWithProviders(<AppShell testMode={false}>content</AppShell>);
    expect(screen.queryByText(/TEST MODE/)).toBeNull();
  });

  it("has a skip link, a search box and a main landmark", () => {
    renderWithProviders(<AppShell testMode>content</AppShell>);
    expect(screen.getByRole("link", { name: "Skip to main content" })).toHaveAttribute("href", "#main");
    expect(screen.getByRole("combobox", { name: "Search products" })).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveTextContent("content");
  });

  it("links to the Journey page from the navbar", () => {
    renderWithProviders(<AppShell testMode>content</AppShell>);
    const nav = screen.getByRole("navigation", { name: "Main" });
    expect(nav.querySelector('a[href="/journey"]')).toHaveTextContent("Journey");
  });
});
