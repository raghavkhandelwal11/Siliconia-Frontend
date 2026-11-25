"use client";

import { Suspense } from "react";
import { CreatorPortal } from "@/components/m4/Portals";

export default function Page() {
  return (
    <Suspense>
      <CreatorPortal />
    </Suspense>
  );
}
