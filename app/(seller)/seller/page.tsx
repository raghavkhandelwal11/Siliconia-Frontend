import type { Metadata } from "next";
import { SellerHome } from "@/components/seller/SellerHome";

export const metadata: Metadata = { title: "Seller dashboard" };

export default function Page() {
  return <SellerHome />;
}
