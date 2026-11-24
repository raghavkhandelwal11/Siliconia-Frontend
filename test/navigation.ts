import { vi } from "vitest";

// Shared stand-in for next/navigation (the App Router is not mounted in tests).
export const nav = {
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  back: vi.fn(),
  prefetch: vi.fn(),
  pathname: "/",
  search: new URLSearchParams(),
};

export function resetNav(path = "/", search = "") {
  nav.push.mockReset();
  nav.replace.mockReset();
  nav.pathname = path;
  nav.search = new URLSearchParams(search);
}
