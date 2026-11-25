import type { Metadata } from "next";
import { SellerOnboarding } from "@/components/seller/SellerOnboarding";

export const metadata: Metadata = { title: "Seller application" };

export default function Page() {
  return <SellerOnboarding testMode={process.env.NEXT_PUBLIC_TEST_MODE !== "false"} />;
}
