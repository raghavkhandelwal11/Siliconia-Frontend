import type { Metadata } from "next";
import { IssueThread } from "@/components/support/IssueThread";

export const metadata: Metadata = { title: "Issue" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <IssueThread id={id} support />;
}
