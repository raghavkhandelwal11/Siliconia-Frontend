import type { Metadata } from "next";
import { AdminHome } from "@/components/admin/AdminHome";

export const metadata: Metadata = { title: "Admin console" };

export default function Page() {
  return <AdminHome />;
}
