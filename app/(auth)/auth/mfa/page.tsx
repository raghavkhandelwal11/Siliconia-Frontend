import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthFrame } from "@/components/auth/AuthFrame";
import { MfaForm } from "@/components/auth/MfaForm";

export const metadata: Metadata = { title: "Admin verification" };

export default function Page() {
  return (
    <AuthFrame>
      <Suspense>
        <MfaForm />
      </Suspense>
    </AuthFrame>
  );
}
