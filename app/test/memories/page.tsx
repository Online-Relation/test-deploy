"use client";

import React, { Suspense } from "react";
import MemoriesContent from "@/components/memories/MemoriesContent";

export default function MemoriesPage() {
  return (
    <Suspense fallback={<div>Indlæser...</div>}>
      <MemoriesContent />
    </Suspense>
  );
}