// components/naughty/NaughtyServices.tsx

"use client";

import dynamic from "next/dynamic";

const NaughtyServices = dynamic(() => import("@/components/naughty/NaughtyServices/Client"), {
  ssr: false,
});

export default NaughtyServices;