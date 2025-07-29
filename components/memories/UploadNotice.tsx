"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function UploadNotice() {
  const searchParams = useSearchParams();
  const [showNotice, setShowNotice] = useState(false);

  useEffect(() => {
    const uploaded = searchParams.get("uploaded");
    if (uploaded === "true") {
      setShowNotice(true);
    }
  }, [searchParams]);

  if (!showNotice) return null;

  return (
    <div className="relative mb-6">
      <div className="rounded-2xl shadow-lg p-6 bg-black text-white border border-purple-700 relative overflow-hidden">
        <h2 className="text-purple-400 font-semibold text-sm mb-2">🎯 MISSION GENNEMFØRT</h2>
        <div className="bg-purple-900/20 border border-purple-500 rounded-xl p-4 mb-4">
          <p className="text-purple-200 text-base font-medium">
            Dit billede er nu uploadet og gemt i jeres minder.
          </p>
          <p className="text-purple-200 text-sm mt-2">
            Du har fuldført en mission og gjort hverdagen mere spændende og sjov.
          </p>
          <p className="text-purple-300 text-sm mt-2 italic">
            Tag et øjeblik og se sidste måneds minder, så du husker at være taknemmelig for de oplevelser I skaber.
          </p>
        </div>
        <div className="text-xs text-gray-300">🕰️ {new Date().toLocaleString("da-DK")} </div>
      </div>
    </div>
  );
}
