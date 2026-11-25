"use client";

import { Suspense } from "react";
import { PromoterPortal } from "@/components/m4/Portals";

export default function Page() {
  return (
    <Suspense>
      <PromoterPortal />
    </Suspense>
  );
}
