import type { Metadata } from "next";
import { AdminUsers } from "@/components/m5/Admin";

export const metadata: Metadata = { title: "Users" };

export default function Page() {
  return <AdminUsers />;
}
