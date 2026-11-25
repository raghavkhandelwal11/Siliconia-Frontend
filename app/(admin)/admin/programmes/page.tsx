import type { Metadata } from "next";
import { AdminProgrammes } from "@/components/m4/Portals";

export const metadata: Metadata = { title: "Programmes" };

export default function Page() {
  return <AdminProgrammes />;
}
