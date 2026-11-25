"use client";

import { RoleGuard } from "@/components/auth/RoleGuard";
import { WishlistPage } from "@/components/cart/WishlistPage";

export default function Page() {
  return (
    <RoleGuard roles={["BUYER"]}>
      <WishlistPage />
    </RoleGuard>
  );
}
