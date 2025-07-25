// components/naughty/NaughtyServices/Client.tsx

"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import dynamic from "next/dynamic";

const RichTextEditor = dynamic(() => import("@/components/ui/RichTextEditor"), {
  ssr: false,
});

interface Props {
  myProfileId: string | null;
  services?: {
    id: string;
    text: string;
    extra_price?: number | null;
  }[];
}

export default function NaughtyServices({ myProfileId, services = [] }: Props) {
  const [hasMounted, setHasMounted] = useState(false);
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!hasMounted || !myProfileId) return;

    const fetchMeta = async () => {
      const { data: meta } = await supabase
        .from("fantasy_menu_meta")
        .select("description, price")
        .eq("user_id", myProfileId)
        .single();

      if (meta?.description) setDescription(meta.description);
      if (meta?.price != null) setBasePrice(meta.price);
    };

    fetchMeta();
  }, [myProfileId, hasMounted]);

  const handleSave = async () => {
    if (!myProfileId) return;
    const { data: existing } = await supabase
      .from("fantasy_menu_meta")
      .select("user_id")
      .eq("user_id", myProfileId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("fantasy_menu_meta")
        .update({ description })
        .eq("user_id", myProfileId);
    } else {
      await supabase
        .from("fantasy_menu_meta")
        .insert({ user_id: myProfileId, description });
    }

    setEditing(false);
  };

  const frækhedsProcent = Math.round(((services?.length || 0) / 30) * 100);

  if (!hasMounted) return null;

  return (
    <div className="space-y-6">
      <div className="bg-pink-50 border border-pink-200 rounded-xl p-5 shadow">
        {editing ? (
          <div className="space-y-2">
            <RichTextEditor value={description} onChange={setDescription} />
            <div className="flex gap-2">
              <button
                className="bg-pink-500 text-white px-4 py-1.5 rounded-lg text-sm shadow hover:bg-pink-600"
                onClick={handleSave}
              >
                Gem
              </button>
              <button
                className="text-sm text-gray-600 underline"
                onClick={() => setEditing(false)}
              >
                Annuller
              </button>
            </div>
          </div>
        ) : (
          <div>
            {description ? (
              <div
                className="text-sm text-gray-800 leading-relaxed prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: description }}
              />
            ) : (
              <p className="italic text-sm text-gray-500">Ingen beskrivelse endnu.</p>
            )}
            <button
              className="mt-2 inline-block text-xs text-pink-600 underline rounded hover:text-pink-800 transition"
              onClick={() => setEditing(true)}
            >
              Rediger beskrivelse
            </button>
          </div>
        )}
      </div>

      <h2 className="text-2xl font-semibold text-pink-700">
        Seksuelle ydelser hun tilbyder
      </h2>

      {(services || []).map((ydelse) => (
        <div
          key={ydelse.id}
          className="bg-white border border-pink-300 rounded-lg p-4 shadow-sm flex items-center justify-between"
        >
          <div className="text-gray-800 font-medium">{ydelse.text}</div>
          <div className="text-sm text-gray-500 ml-4 whitespace-nowrap">
            {ydelse.extra_price != null
              ? `${ydelse.extra_price} kr.`
              : basePrice != null
              ? `${basePrice} kr.`
              : ""}
          </div>
        </div>
      ))}
    </div>
  );
}
