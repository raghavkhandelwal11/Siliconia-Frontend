import type { Metadata } from "next";
import { AdminOrders } from "@/components/m5/Admin";

export const metadata: Metadata = { title: "Orders and returns" };

export default function Page() {
  return <AdminOrders />;
}
