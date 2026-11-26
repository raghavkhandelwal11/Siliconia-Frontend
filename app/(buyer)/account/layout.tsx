import type { Metadata } from "next";

// Absolute so the brand suffix survives nesting; children keep the template.
export const metadata: Metadata = { title: { absolute: "Your account · Siliconics", template: "%s · Siliconics" } };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
