import type { Metadata } from "next";
import { AdminPayouts } from "@/components/m5/Admin";

export const metadata: Metadata = { title: "Payouts" };

export default function Page() {
  return <AdminPayouts />;
}
