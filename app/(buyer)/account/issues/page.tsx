"use client";

import { RoleGuard } from "@/components/auth/RoleGuard";
import { IssuesPage } from "@/components/support/IssuesPage";

export default function Page() {
  return (
    <RoleGuard roles={["BUYER"]}>
      <IssuesPage />
    </RoleGuard>
  );
}
