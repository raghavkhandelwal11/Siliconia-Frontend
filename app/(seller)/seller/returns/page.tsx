import type { Metadata } from "next";
import { SellerReturns } from "@/components/support/SellerReturns";

export const metadata: Metadata = { title: "Returns" };

export default function Page() {
  return <SellerReturns />;
}
