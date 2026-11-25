import type { Metadata } from "next";
import { AdminHealth } from "@/components/m5/Admin";

export const metadata: Metadata = { title: "Health" };

export default function Page() {
  return <AdminHealth />;
}
