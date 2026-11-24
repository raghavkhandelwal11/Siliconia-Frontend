"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { api, unwrap, type Role } from "@/lib/api/client";
import { effectiveRole, homeFor, sessionKey, useSession, useSignOut } from "@/lib/auth/session";
import { Icon } from "@/components/ui/Icon";

const ROLES: Role[] = ["ADMIN", "BUYER", "SELLER", "PROMOTER", "CREATOR"];

// UI-GLB-02 account menu, plus the admin "View as" switch (UI-ADM-06, FR-ROLE-07).
export function AccountMenu() {
  const t = useTranslations("menu");
  const tr = useTranslations("roles");
  const session = useSession();
  const signOut = useSignOut();
  const router = useRouter();
  const qc = useQueryClient();
  const menu = useRef<HTMLDetailsElement>(null);
  const [switching, setSwitching] = useState(false);

  const data = session.data;
  if (!data || data.state === "anonymous") {
    return (
      <Link
        href="/auth/sign-in"
        className="ml-1 hidden rounded-full bg-brand px-4 py-2 text-sm font-semibold text-brand-ink sm:inline-block"
      >
        {t("signIn")}
      </Link>
    );
  }
  if (data.state === "mfa-required") {
    return (
      <Link href="/auth/mfa" className="ml-1 rounded-full border border-line px-4 py-2 text-sm font-semibold">
        {t("finishSignIn")}
      </Link>
    );
  }

  const account = data.account;
  const role = effectiveRole(account);
  const close = () => menu.current?.removeAttribute("open");

  async function viewAs(next: Role) {
    setSwitching(true);
    try {
      unwrap(await api.POST("/admin/role-switch", { body: { role: next === "ADMIN" ? null : next } }));
      await qc.invalidateQueries({ queryKey: sessionKey });
      close();
      router.push(homeFor(next));
    } finally {
      setSwitching(false);
    }
  }

  return (
    <details ref={menu} className="relative ml-1">
      <summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 rounded-full border border-line px-3 text-sm font-medium">
        <Icon name="user" size={18} />
        <span className="hidden max-w-32 truncate sm:inline">{account.name || tr(account.role)}</span>
        {account.role === "ADMIN" && account.actingRole && (
          <span className="rounded-full bg-warning px-2 text-xs font-semibold text-ink">{tr(role)}</span>
        )}
      </summary>
      <div className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-line bg-surface p-2 shadow-lg">
        <p className="px-3 py-2 text-sm text-muted">{t("signedInAs", { role: tr(account.role) })}</p>
        <Link href="/account" onClick={close} className="block rounded-lg px-3 py-2 text-sm hover:bg-bg">
          {t("account")}
        </Link>
        {account.role !== "BUYER" && (
          <Link href={homeFor(role)} onClick={close} className="block rounded-lg px-3 py-2 text-sm hover:bg-bg">
            {t("dashboard")}
          </Link>
        )}
        {account.role === "ADMIN" && (
          <label className="block px-3 py-2 text-sm">
            <span className="font-medium">{t("viewAs")}</span>
            <select
              className="mt-1 min-h-10 w-full rounded-lg border border-line bg-surface px-2"
              value={role}
              disabled={switching}
              onChange={(e) => viewAs(e.target.value as Role)}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {tr(r)}
                </option>
              ))}
            </select>
          </label>
        )}
        <button
          type="button"
          className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-bg"
          onClick={() =>
            signOut.mutate(undefined, {
              onSettled: () => {
                close();
                router.push("/");
              },
            })
          }
        >
          {t("signOut")}
        </button>
      </div>
    </details>
  );
}
