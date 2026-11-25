"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { api, apiBaseUrl, unwrap } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";

export type Notification = components["schemas"]["Notification"];
export type Prefs = components["schemas"]["NotificationPrefs"];
type Inbox = { items: Notification[]; unread: number };

export const inboxKey = ["notifications"] as const;

export function useInbox(enabled = true) {
  return useQuery({
    queryKey: inboxKey,
    queryFn: async (): Promise<Inbox> => unwrap(await api.GET("/me/notifications")),
    enabled,
  });
}

/**
 * Keeps the inbox live while a signed-in page is open: the server sends the
 * unread count, then each new notification (server-sent events). EventSource
 * reconnects by itself after network drops or the server's 30-minute limit.
 */
export function useLiveInbox(enabled: boolean) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!enabled || typeof EventSource === "undefined") return;
    const es = new EventSource(`${apiBaseUrl()}/me/notifications/stream`, { withCredentials: true });
    es.addEventListener("unread", (e) => {
      const { unread } = JSON.parse((e as MessageEvent).data) as { unread: number };
      qc.setQueryData<Inbox>(inboxKey, (old) => (old ? { ...old, unread } : old));
      if (!qc.getQueryData(inboxKey)) void qc.invalidateQueries({ queryKey: inboxKey });
    });
    es.addEventListener("notification", (e) => {
      const n = JSON.parse((e as MessageEvent).data) as Notification;
      qc.setQueryData<Inbox>(inboxKey, (old) =>
        old
          ? { items: [n, ...old.items.filter((x) => x.id !== n.id)].slice(0, 30), unread: old.unread + 1 }
          : { items: [n], unread: 1 },
      );
      // New order events usually change the order pages too.
      void qc.invalidateQueries({ queryKey: ["order"] });
      void qc.invalidateQueries({ queryKey: ["seller-orders"] });
    });
    return () => es.close();
  }, [enabled, qc]);
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => unwrap(await api.POST("/me/notifications/read", { body: { ids } })),
    onMutate: (ids) => {
      const now = new Date().toISOString();
      qc.setQueryData<Inbox>(inboxKey, (old) =>
        old
          ? {
              items: old.items.map((n) =>
                ids.length === 0 || ids.includes(n.id) ? { ...n, readAt: n.readAt ?? now } : n,
              ),
              unread:
                ids.length === 0
                  ? 0
                  : Math.max(0, old.unread - old.items.filter((n) => ids.includes(n.id) && !n.readAt).length),
            }
          : old,
      );
    },
    onSuccess: ({ unread }) => qc.setQueryData<Inbox>(inboxKey, (old) => (old ? { ...old, unread } : old)),
  });
}

export function usePrefs() {
  return useQuery({
    queryKey: ["notification-prefs"],
    queryFn: async () => unwrap(await api.GET("/me/notification-prefs")),
  });
}

export function useSavePrefs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: Prefs) => unwrap(await api.PUT("/me/notification-prefs", { body: p })),
    onSuccess: (p) => qc.setQueryData(["notification-prefs"], p),
  });
}
