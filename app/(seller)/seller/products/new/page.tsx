import type { Metadata } from "next";
import { NewProduct } from "@/components/products/NewProduct";

export const metadata: Metadata = { title: "Add a product" };

export default function Page() {
  return <NewProduct />;
}
