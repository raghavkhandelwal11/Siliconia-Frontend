"use client";

import { Suspense } from "react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { MembershipPage } from "@/components/m3/MembershipPage";

export default function Page() {
  return (
    <RoleGuard roles={["BUYER"]}>
      <Suspense>
        <MembershipPage />
      </Suspense>
    </RoleGuard>
  );
}
