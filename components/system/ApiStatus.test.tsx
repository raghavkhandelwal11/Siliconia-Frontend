import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { ApiStatus } from "./ApiStatus";

afterEach(() => vi.unstubAllGlobals());

function stubFetch(response: Response | Error) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      if (response instanceof Error) throw response;
      return response;
    }),
  );
}

describe("ApiStatus", () => {
  it("shows Working with the version when the API answers", async () => {
    stubFetch(
      new Response(JSON.stringify({ status: "ok", version: "0.1.0", mode: "local" }), {
        headers: { "Content-Type": "application/json" },
      }),
    );
    renderWithProviders(<ApiStatus />);
    expect(await screen.findByText("Working")).toBeInTheDocument();
    expect(screen.getByText("Version 0.1.0, mode local")).toBeInTheDocument();
  });

  it("shows Not reachable when the API is down", async () => {
    stubFetch(new TypeError("network down"));
    renderWithProviders(<ApiStatus />);
    expect(await screen.findByText("Not reachable")).toBeInTheDocument();
  });
});
