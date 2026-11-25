"use client";

import { Suspense } from "react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { CheckoutPage } from "@/components/checkout/CheckoutPage";

export default function Page() {
  return (
    <RoleGuard roles={["BUYER"]}>
      <Suspense>
        <CheckoutPage />
      </Suspense>
    </RoleGuard>
  );
}
