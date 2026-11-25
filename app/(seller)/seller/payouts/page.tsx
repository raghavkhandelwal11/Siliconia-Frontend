import type { Metadata } from "next";
import { SellerPayouts } from "@/components/m5/Seller";

export const metadata: Metadata = { title: "Payouts" };

export default function Page() {
  return <SellerPayouts />;
}
