import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthFrame } from "@/components/auth/AuthFrame";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { VerifyPhoneForm } from "@/components/auth/VerifyPhoneForm";

export const metadata: Metadata = { title: "Add your mobile number" };

export default function Page() {
  return (
    <AuthFrame>
      <Suspense>
        <RoleGuard>
          <VerifyPhoneForm />
        </RoleGuard>
      </Suspense>
    </AuthFrame>
  );
}
