import type { Metadata } from "next";
import { SellerProgrammes } from "@/components/m4/Portals";

export const metadata: Metadata = { title: "Creators and promoters" };

export default function Page() {
  return <SellerProgrammes />;
}
