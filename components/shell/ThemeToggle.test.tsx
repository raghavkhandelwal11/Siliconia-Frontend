import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { ThemeToggle, themeScript } from "./ThemeToggle";

afterEach(() => {
  delete document.documentElement.dataset.theme;
  localStorage.clear();
});

describe("ThemeToggle", () => {
  it("cycles system → light → dark → system and remembers the choice", async () => {
    renderWithProviders(<ThemeToggle />);
    const user = userEvent.setup();
    const button = screen.getByRole("button", { name: "Theme: system. Switch to light" });

    await user.click(button);
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(localStorage.getItem("sx-theme")).toBe("light");
    expect(button).toHaveAccessibleName("Theme: light. Switch to dark");

    await user.click(button);
    expect(document.documentElement.dataset.theme).toBe("dark");

    await user.click(button);
    expect(document.documentElement.dataset.theme).toBeUndefined();
    expect(localStorage.getItem("sx-theme")).toBeNull();
  });

  it("applies a saved theme before paint via the head script", () => {
    localStorage.setItem("sx-theme", "dark");
    new Function(themeScript)();
    expect(document.documentElement.dataset.theme).toBe("dark");
  });
});
