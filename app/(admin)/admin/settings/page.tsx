import type { Metadata } from "next";
import { AdminSettings } from "@/components/m5/Admin";

export const metadata: Metadata = { title: "Settings" };

export default function Page() {
  return <AdminSettings />;
}
