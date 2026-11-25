import type { Metadata } from "next";
import { LaunchPage } from "@/components/m3/LaunchPage";

export const metadata: Metadata = { title: "Launch deal" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LaunchPage id={id} />;
}
