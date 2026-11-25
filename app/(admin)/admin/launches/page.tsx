import type { Metadata } from "next";
import { AdminLaunches } from "@/components/m3/AdminLaunches";

export const metadata: Metadata = { title: "Launches" };

export default function Page() {
  return <AdminLaunches />;
}
