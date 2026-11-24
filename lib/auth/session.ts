"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError, unwrap, type Account, type Role } from "@/lib/api/client";

export type Session =
  | { state: "anonymous" }
  | { state: "mfa-required" } // admin signed in but has not entered the authenticator code
  | { state: "signed-in"; account: Account };

export const sessionKey = ["session"] as const;

async function loadSession(): Promise<Session> {
  const res = await api.GET("/me");
  if (res.response.status === 401) return { state: "anonymous" };
  try {
    return { state: "signed-in", account: unwrap(res) };
  } catch (e) {
    if (e instanceof ApiError && e.code === "MFA_REQUIRED") return { state: "mfa-required" };
    throw e;
  }
}

/** The current session; refetched after sign-in, sign-out and role switch. */
export function useSession() {
  return useQuery({ queryKey: sessionKey, queryFn: loadSession, staleTime: 60_000, retry: false });
}

/** The role whose screens the user sees: an admin's acting role, else their own. */
export function effectiveRole(a: Account): Role {
  return a.role === "ADMIN" && a.actingRole ? a.actingRole : a.role;
}

/** Landing page for each role after sign-in. */
export function homeFor(role: Role): string {
  switch (role) {
    case "SELLER":
      return "/seller";
    case "PROMOTER":
      return "/promoter";
    case "CREATOR":
      return "/creator";
    case "ADMIN":
      return "/admin";
    default:
      return "/";
  }
}

/** "+919876543210" → "+91 98765 43210". */
export function formatPhone(e164: string | undefined): string {
  if (!e164) return "";
  const m = /^\+91(\d{5})(\d{5})$/.exec(e164);
  return m ? `+91 ${m[1]} ${m[2]}` : e164;
}

/** Only same-site relative paths, so ?next= cannot redirect off the site. */
export function safeNext(next: string | null | undefined, fallback = "/"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return fallback;
  return next;
}

export function useSignOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.POST("/auth/logout");
    },
    onSettled: () => {
      qc.setQueryData(sessionKey, { state: "anonymous" } satisfies Session);
      qc.invalidateQueries();
    },
  });
}
