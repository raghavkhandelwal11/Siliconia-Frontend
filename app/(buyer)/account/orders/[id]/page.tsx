"use client";

import { use } from "react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { OrderDetail } from "@/components/orders/OrderDetail";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <RoleGuard roles={["BUYER"]}>
      <OrderDetail id={id} />
    </RoleGuard>
  );
}
