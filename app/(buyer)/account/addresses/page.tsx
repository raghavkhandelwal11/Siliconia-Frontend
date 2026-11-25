"use client";

import { RoleGuard } from "@/components/auth/RoleGuard";
import { AddressBook } from "@/components/checkout/AddressBook";

export default function Page() {
  return (
    <RoleGuard roles={["BUYER"]}>
      <AddressBook />
    </RoleGuard>
  );
}
