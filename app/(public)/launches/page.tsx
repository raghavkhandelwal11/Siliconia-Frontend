import type { Metadata } from "next";
import { LaunchList } from "@/components/m3/LaunchList";

export const metadata: Metadata = { title: "Launch deals" };

export default function Page() {
  return <LaunchList />;
}
