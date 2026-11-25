import type { Metadata } from "next";
import { AdminAudit } from "@/components/m5/Admin";

export const metadata: Metadata = { title: "Audit and reports" };

export default function Page() {
  return <AdminAudit />;
}
