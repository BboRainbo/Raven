"use client";

import { Suspense } from "react";
import AIDiscussStep1 from "./AIDiscussStep1";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading Step1...</div>}>
      <AIDiscussStep1 />
    </Suspense>
  );
}
