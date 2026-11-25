"use client";

import { RoleGuard } from "@/components/auth/RoleGuard";
import { NotificationsPage } from "@/components/notifications/NotificationsPage";

// Every account type has notifications, so no role filter here.
export default function Page() {
  return (
    <RoleGuard>
      <NotificationsPage />
    </RoleGuard>
  );
}
