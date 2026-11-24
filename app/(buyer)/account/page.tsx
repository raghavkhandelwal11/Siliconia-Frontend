"use client";

import { RoleGuard } from "@/components/auth/RoleGuard";
import { AccountSettings } from "@/components/account/AccountSettings";
import { useSession } from "@/lib/auth/session";

export default function Page() {
  const session = useSession();
  return (
    <RoleGuard>{session.data?.state === "signed-in" && <AccountSettings account={session.data.account} />}</RoleGuard>
  );
}
