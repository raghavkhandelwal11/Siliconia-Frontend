import type { Metadata } from "next";
import { ProductEditor } from "@/components/products/ProductEditor";

export const metadata: Metadata = { title: "Edit product" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <ProductEditor id={(await params).id} />;
}
