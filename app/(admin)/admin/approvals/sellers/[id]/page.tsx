import type { Metadata } from "next";
import { SellerReviewPanel } from "@/components/admin/SellerReviewPanel";

export const metadata: Metadata = { title: "Review seller" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <SellerReviewPanel id={(await params).id} />;
}
