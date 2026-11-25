"use client";

import { Suspense } from "react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { ResultPage } from "@/components/checkout/ResultPage";

export default function Page() {
  return (
    <RoleGuard roles={["BUYER"]}>
      <Suspense>
        <ResultPage />
      </Suspense>
    </RoleGuard>
  );
}
