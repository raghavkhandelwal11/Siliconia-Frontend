import type { Metadata } from "next";
import { Suspense } from "react";
import { SignInForm } from "@/components/auth/SignInForm";

export const metadata: Metadata = { title: "Sign in" };

export default async function Page({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const { role } = await searchParams;
  return (
    <Suspense>
      {/* Remount when switching between shopper and admin sign-in. */}
      <SignInForm key={role ?? "BUYER"} testMode={process.env.NEXT_PUBLIC_TEST_MODE !== "false"} />
    </Suspense>
  );
}
