"use client";

import { RoleGuard } from "@/components/auth/RoleGuard";
import { ReturnsPage } from "@/components/support/ReturnsPage";

export default function Page() {
  return (
    <RoleGuard roles={["BUYER"]}>
      <ReturnsPage />
    </RoleGuard>
  );
}
