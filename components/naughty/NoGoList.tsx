// components/naughty/NoGoList.tsx

"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Props {
  myProfileId: string | null;
  pageProfileId: string | null;
}

export default function NoGoList({ myProfileId, pageProfileId }: Props) {
  const [noGoList, setNoGoList] = useState<string[]>([]);

  useEffect(() => {
    const fetchNoGos = async () => {
      if (!pageProfileId) return;

      const { data, error } = await supabase
        .from("fantasy_menu_nogos")
        .select("text")
        .eq("user_id", pageProfileId);

      if (!error && data) {
        setNoGoList(data.map((item) => item.text));
      }
    };

    fetchNoGos();
  }, [pageProfileId]);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-pink-700">No Go's</h2>
      <p className="italic text-sm text-gray-600">
        Hvad er den største turn off for dig? Er der noget man aldrig skal prøve på i sengen? Fortæl det her, så din partner ved hvad der ikke fungerer for dig.
      </p>
      <ul className="list-disc list-inside text-red-600">
        {noGoList.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
