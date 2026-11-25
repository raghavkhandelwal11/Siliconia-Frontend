import type { Metadata } from "next";
import { ProductList } from "@/components/products/ProductList";

export const metadata: Metadata = { title: "Your products" };

export default function Page() {
  return <ProductList />;
}
