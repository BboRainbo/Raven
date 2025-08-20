"use client";

import { Suspense } from "react";
import AIDiscussStep2 from "./Step2Content";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading Step2...</div>}>
      <AIDiscussStep2 />
    </Suspense>
  );
}
