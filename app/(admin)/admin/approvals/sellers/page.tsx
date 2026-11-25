import type { Metadata } from "next";
import { SellerQueue } from "@/components/admin/SellerQueue";

export const metadata: Metadata = { title: "Seller approvals" };

export default function Page() {
  return <SellerQueue />;
}
