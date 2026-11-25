"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { api, apiBaseUrl, unwrap } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";

export type Balance = components["schemas"]["ElectronsBalance"];
export type LedgerEntry = components["schemas"]["LedgerEntry"];
export type Membership = components["schemas"]["Membership"];
export type Launch = components["schemas"]["Launch"];
export type LaunchSummary = components["schemas"]["LaunchSummary"];
export type LaunchDraft = components["schemas"]["LaunchDraft"];
export type LaunchPreview = components["schemas"]["LaunchPreview"];
export type QueueState = components["schemas"]["QueueState"];
export type Live = { status: string; dealRemaining: number; held: number; normalAvailable: number };

export function useBalance(enabled = true) {
  return useQuery({ queryKey: ["electrons"], queryFn: async () => unwrap(await api.GET("/electrons")), enabled });
}

export function useLedger() {
  return useQuery({
    queryKey: ["electrons-ledger"],
    queryFn: async () => unwrap(await api.GET("/electrons/ledger")).items,
  });
}

/** Membership status; polls while a just-paid purchase is being confirmed. */
export function useMembership(enabled = true, confirming = false) {
  return useQuery({
    queryKey: ["membership"],
    queryFn: async () => unwrap(await api.GET("/membership")),
    enabled,
    refetchInterval: (q) => (confirming && !q.state.data?.isMember ? 2000 : false),
  });
}

export function useBuyMembership() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { electrons: number; autoRenew: boolean }) =>
      unwrap(await api.POST("/membership/purchase", { body: v })),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["membership"] });
      void qc.invalidateQueries({ queryKey: ["electrons"] });
    },
  });
}

export function useAutoRenew() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (autoRenew: boolean) => unwrap(await api.PATCH("/membership", { body: { autoRenew } })),
    onSuccess: (m) => qc.setQueryData(["membership"], m),
  });
}

export function useLaunches(admin = false) {
  return useQuery({
    queryKey: ["launches", admin],
    queryFn: async () => unwrap(admin ? await api.GET("/admin/launches") : await api.GET("/launches")).items,
  });
}

export function useLaunch(id: string) {
  return useQuery({
    queryKey: ["launch", id],
    queryFn: async () => unwrap(await api.GET("/launches/{id}", { params: { path: { id } } })),
  });
}

/** Units left, pushed by the server as they change (SSE). */
export function useLiveLaunch(id: string): Live | null {
  const [live, setLive] = useState<Live | null>(null);
  useEffect(() => {
    if (typeof EventSource === "undefined") return;
    const es = new EventSource(`${apiBaseUrl()}/launches/${id}/stream`);
    es.addEventListener("live", (e) => setLive(JSON.parse((e as MessageEvent).data) as Live));
    return () => es.close();
  }, [id]);
  return live;
}

export function useReserve(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { qty: number; admissionToken?: string }) =>
      unwrap(await api.POST("/launches/{id}/reserve", { params: { path: { id } }, body: v })),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["launch", id] }),
  });
}

export function useQueue(id: string, joined: boolean) {
  return useQuery({
    queryKey: ["launch-queue", id],
    queryFn: async () => unwrap(await api.GET("/launches/{id}/queue", { params: { path: { id } } })),
    enabled: joined,
    refetchInterval: (q) => (q.state.data?.admitted ? false : 2000),
  });
}

export async function joinQueue(id: string): Promise<QueueState> {
  return unwrap(await api.POST("/launches/{id}/queue", { params: { path: { id } } }));
}

export async function previewLaunch(d: LaunchDraft): Promise<LaunchPreview> {
  return unwrap(await api.POST("/admin/launches/preview", { body: d }));
}

export function useAdminLaunch() {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ["launches", true] });
  return {
    create: useMutation({
      mutationFn: async (d: LaunchDraft) => unwrap(await api.POST("/admin/launches", { body: d })),
      onSuccess: refresh,
    }),
    schedule: useMutation({
      mutationFn: async (id: string) => {
        const r = await api.POST("/admin/launches/{id}/schedule", { params: { path: { id } } });
        if (!r.response.ok) throw new Error("Could not schedule");
      },
      onSuccess: refresh,
    }),
    cancel: useMutation({
      mutationFn: async (id: string) => {
        const r = await api.POST("/admin/launches/{id}/cancel", { params: { path: { id } } });
        if (!r.response.ok) throw new Error("Could not cancel");
      },
      onSuccess: refresh,
    }),
  };
}

/** Counts down to a time, corrected by the server's clock. */
export function useCountdown(target: string, serverTime?: string) {
  const [now, setNow] = useState(() => Date.now());
  const [offset] = useState(() => (serverTime ? new Date(serverTime).getTime() - Date.now() : 0));
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return Math.max(0, Math.floor((new Date(target).getTime() - (now + offset)) / 1000));
}

export function hms(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h > 0 ? `${h}:` : ""}${String(m).padStart(h > 0 ? 2 : 1, "0")}:${String(sec).padStart(2, "0")}`;
}
