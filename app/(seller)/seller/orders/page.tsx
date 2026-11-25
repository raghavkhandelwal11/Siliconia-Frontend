import type { Metadata } from "next";
import { SellerOrders } from "@/components/seller/orders/SellerOrders";

export const metadata: Metadata = { title: "Orders" };

export default function Page() {
  return <SellerOrders />;
}
