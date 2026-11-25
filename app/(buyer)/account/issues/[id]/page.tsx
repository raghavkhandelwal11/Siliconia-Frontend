"use client";

import { use } from "react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { IssueThread } from "@/components/support/IssueThread";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <RoleGuard roles={["BUYER"]}>
      <IssueThread id={id} />
    </RoleGuard>
  );
}
