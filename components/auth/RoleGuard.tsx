"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import type { Role } from "@/lib/api/client";
import { effectiveRole, useSession } from "@/lib/auth/session";
import { Card } from "@/components/ui/Form";

/**
 * Client-side route guard (LLD 14.3). The API enforces every rule; this only
 * sends people to the right page: sign-in, the admin authenticator step, or a
 * message when the account type does not match.
 */
export function RoleGuard({ roles, children }: { roles?: Role[]; children: React.ReactNode }) {
  const t = useTranslations("guard");
  const tr = useTranslations("roles");
  const session = useSession();
  const router = useRouter();
  const path = usePathname();
  const state = session.data?.state;

  useEffect(() => {
    if (state === "anonymous") router.replace(`/auth/sign-in?next=${encodeURIComponent(path)}`);
    if (state === "mfa-required") router.replace(`/auth/mfa?next=${encodeURIComponent(path)}`);
  }, [state, path, router]);

  if (session.isPending || state === "anonymous" || state === "mfa-required") {
    return <p className="text-muted">{t("loading")}</p>;
  }
  if (session.isError || session.data?.state !== "signed-in") {
    return <p className="text-danger">{t("error")}</p>;
  }
  const account = session.data.account;
  const role = effectiveRole(account);
  if (roles && !roles.includes(role)) {
    return (
      <Card>
        <h1 className="text-xl font-bold">{t("wrongRoleTitle")}</h1>
        <p className="mt-2 text-muted">
          {t("wrongRole", { needed: roles.map((r) => tr(r)).join(", "), current: tr(role) })}
        </p>
        <Link
          href={`/auth/sign-in?role=${roles[0]}&next=${encodeURIComponent(path)}`}
          className="mt-4 inline-block font-semibold text-accent underline"
        >
          {t("signInAs", { role: tr(roles[0]) })}
        </Link>
      </Card>
    );
  }
  return <>{children}</>;
}
