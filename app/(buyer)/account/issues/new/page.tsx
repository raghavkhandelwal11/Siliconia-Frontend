"use client";

import { Suspense } from "react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { RaiseIssue } from "@/components/support/RaiseIssue";

export default function Page() {
  return (
    <RoleGuard roles={["BUYER"]}>
      <Suspense>
        <RaiseIssue />
      </Suspense>
    </RoleGuard>
  );
}
