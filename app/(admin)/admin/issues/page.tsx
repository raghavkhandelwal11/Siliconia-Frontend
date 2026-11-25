import type { Metadata } from "next";
import { SupportQueue } from "@/components/support/IssuesPage";

export const metadata: Metadata = { title: "Support issues" };

export default function Page() {
  return <SupportQueue />;
}
