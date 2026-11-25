import type { Metadata } from "next";
import { LegalPage } from "@/components/m5/Seller";

export const metadata: Metadata = { title: "Legal" };

export default async function Page({ params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  return <LegalPage kind={kind.replace(/-/g, "_")} />;
}
