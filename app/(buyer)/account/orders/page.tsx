"use client";

import { RoleGuard } from "@/components/auth/RoleGuard";
import { OrdersPage } from "@/components/checkout/OrdersPage";

export default function Page() {
  return (
    <RoleGuard roles={["BUYER"]}>
      <OrdersPage />
    </RoleGuard>
  );
}
