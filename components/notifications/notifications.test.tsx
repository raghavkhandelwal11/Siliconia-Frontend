import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { stubApi } from "@/test/fetch";
import { NotificationBell } from "./NotificationBell";
import { NotificationsPage } from "./NotificationsPage";

const me = {
  method: "GET",
  path: "/me",
  body: {
    id: "a1",
    role: "BUYER",
    name: "Asha",
    phoneVerified: true,
    approval: "APPROVED",
    mfaVerified: false,
    createdAt: "2026-11-01T00:00:00Z",
  },
};

const note = (id: string, extra = {}) => ({
  id,
  template: "order_shipped",
  title: "Order SX-1 shipped",
  body: "Your items have shipped.",
  link: "/account/orders/o1",
  createdAt: "2026-11-26T10:00:00Z",
  ...extra,
});

/** A stand-in EventSource the test can push events through. */
class FakeEventSource {
  static last: FakeEventSource | null = null;
  listeners: Record<string, ((e: MessageEvent) => void)[]> = {};
  closed = false;
  constructor(public url: string) {
    FakeEventSource.last = this;
  }
  addEventListener(type: string, fn: (e: MessageEvent) => void) {
    (this.listeners[type] ??= []).push(fn);
  }
  emit(type: string, data: unknown) {
    for (const fn of this.listeners[type] ?? []) fn(new MessageEvent(type, { data: JSON.stringify(data) }));
  }
  close() {
    this.closed = true;
  }
}

describe("NotificationBell", () => {
  it("shows the unread count and updates live", async () => {
    vi.stubGlobal("EventSource", FakeEventSource);
    stubApi([me, { method: "GET", path: "/me/notifications", body: { items: [note("n1")], unread: 1 } }]);
    renderWithProviders(<NotificationBell />);
    expect(await screen.findByRole("link", { name: "Notifications, 1 unread" })).toHaveAttribute(
      "href",
      "/account/notifications",
    );
    expect(FakeEventSource.last?.url).toContain("/api/v1/me/notifications/stream");
    act(() => FakeEventSource.last!.emit("notification", note("n2", { title: "Out for delivery today" })));
    expect(await screen.findByRole("link", { name: "Notifications, 2 unread" })).toBeInTheDocument();
    act(() => FakeEventSource.last!.emit("unread", { unread: 0 }));
    expect(await screen.findByRole("link", { name: "Notifications" })).toBeInTheDocument();
  });

  it("does not open a stream when signed out", async () => {
    vi.stubGlobal("EventSource", FakeEventSource);
    FakeEventSource.last = null;
    stubApi([{ method: "GET", path: "/me", status: 401, body: { code: "AUTH_REQUIRED" } }]);
    renderWithProviders(<NotificationBell />);
    await waitFor(() => expect(screen.getByRole("link", { name: "Notifications" })).toBeInTheDocument());
    expect(FakeEventSource.last).toBeNull();
  });
});

describe("NotificationsPage", () => {
  it("lists notifications, marks them read and saves preferences", async () => {
    const calls = stubApi([
      {
        method: "GET",
        path: "/me/notifications",
        body: {
          items: [note("n1"), note("n2", { readAt: "2026-11-26T11:00:00Z", title: "Order SX-1 confirmed" })],
          unread: 1,
        },
      },
      { method: "POST", path: "/me/notifications/read", body: { unread: 0 } },
      { method: "GET", path: "/me/notification-prefs", body: { whatsapp: true, email: true, marketing: false } },
      { method: "PUT", path: "/me/notification-prefs", body: { whatsapp: false, email: true, marketing: false } },
    ]);
    renderWithProviders(<NotificationsPage />);
    const user = userEvent.setup();
    expect(await screen.findByText("Order SX-1 shipped")).toBeInTheDocument();
    expect(screen.getByText("(unread)")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Mark all as read" }));
    await waitFor(() => expect(screen.queryByText("(unread)")).not.toBeInTheDocument());
    expect(
      await calls
        .find((c) => c.method === "POST")!
        .clone()
        .json(),
    ).toEqual({ ids: [] });

    await user.click(await screen.findByRole("switch", { name: /WhatsApp/ }));
    await waitFor(() => expect(calls.some((c) => c.method === "PUT")).toBe(true));
    expect(
      await calls
        .find((c) => c.method === "PUT")!
        .clone()
        .json(),
    ).toEqual({ whatsapp: false, email: true, marketing: false });
  });
});
