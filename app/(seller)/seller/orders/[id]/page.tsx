import type { Metadata } from "next";
import { SellerOrderDetail } from "@/components/seller/orders/SellerOrderDetail";

export const metadata: Metadata = { title: "Order" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SellerOrderDetail id={id} />;
}
