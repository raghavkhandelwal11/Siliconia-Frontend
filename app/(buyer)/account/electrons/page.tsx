"use client";

import { RoleGuard } from "@/components/auth/RoleGuard";
import { ElectronsPage } from "@/components/m3/ElectronsPage";

export default function Page() {
  return (
    <RoleGuard>
      <ElectronsPage />
    </RoleGuard>
  );
}
