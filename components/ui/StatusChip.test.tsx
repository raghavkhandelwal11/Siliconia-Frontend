import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusChip } from "./StatusChip";

describe("StatusChip", () => {
  it("always shows text and an icon, never colour alone", () => {
    const { container } = render(<StatusChip tone="danger">Returned to origin</StatusChip>);
    expect(screen.getByText("Returned to origin")).toBeInTheDocument();
    expect(container.querySelector("svg")).not.toBeNull();
    expect(container.firstElementChild).toHaveAttribute("data-tone", "danger");
  });

  it("keeps the icon hidden from screen readers so the text is announced once", () => {
    const { container } = render(<StatusChip tone="success">Delivered</StatusChip>);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });
});
