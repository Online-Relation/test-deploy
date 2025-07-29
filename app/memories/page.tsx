// /app/memories/page.tsx

export const dynamic = "force-dynamic";

import React, { Suspense } from "react";
import MemoriesContent from "@/components/memories/MemoriesContent";

export default function MemoriesPage() {
  return (
    <Suspense fallback={<div className="text-center text-gray-500 mt-10">Indlæser minder…</div>}>
      <MemoriesContent />
    </Suspense>
  );
}
