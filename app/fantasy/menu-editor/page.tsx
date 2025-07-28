// app/fantasy/menu-editor/naughty-profile/page.tsx

"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useUserContext } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { SortableItem } from "@/components/SortableItem";

const DndKitWrapper = dynamic(() => import("@/components/naughty/DndKitWrapper"), {
  ssr: false,
});

const STINE_ID = "5687c342-1a13-441c-86ca-f7e87e1edbd5";

interface Option {
  id: string;
  text: string;
  created_by: string;
  is_addon: boolean;
}

const EDITOR_ID = "190a3151-97bc-43be-9daf-1f3b3062f97f";

export default function MenuSelectPage() {
  const { user, loading } = useUserContext();
  const router = useRouter();

  const [options, setOptions] = useState<Option[]>([]);
  const [addons, setAddons] = useState<Option[]>([]);
  const [selections, setSelections] = useState<Record<string, "yes" | "no" | null>>({});
  const [price, setPrice] = useState(100);
  const [addonPrice, setAddonPrice] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [newOption, setNewOption] = useState("");
  const [newAddon, setNewAddon] = useState("");
  const [editMode, setEditMode] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [noGoText, setNoGoText] = useState("");

  const [optionAdded, setOptionAdded] = useState(false);
  const [addonAdded, setAddonAdded] = useState(false);

  const isEditor = user?.id === EDITOR_ID;

  useEffect(() => {
    const fetchData = async () => {
      const { data: optionsData, error: optionsError } = await supabase
        .from("fantasy_menu_options")
        .select("id, text, created_by, is_addon")
        .eq("is_addon", false);

      if (optionsError) console.error("❌ optionsError", optionsError);
      console.log("✅ optionsData", optionsData);

      const { data: addonData, error: addonError } = await supabase
        .from("fantasy_menu_options")
        .select("id, text, created_by, is_addon")
        .eq("is_addon", true);

      if (addonError) console.error("❌ addonError", addonError);
      console.log("✅ addonData", addonData);

      const { data: items } = await supabase
        .from("fantasy_menu_items")
        .select("text, choice")
        .eq("user_id", STINE_ID);

      const { data: metaData } = await supabase
        .from("fantasy_menu_meta")
        .select("price, addon_price, notes")
        .eq("user_id", STINE_ID)
        .single();

      const { data: noGoData } = await supabase
        .from("fantasy_menu_nogos")
        .select("text")
        .eq("user_id", STINE_ID)
        .single();

      if (metaData) {
        setPrice(metaData.price ?? 100);
        setNotes(metaData.notes ?? "");
        if (typeof metaData.addon_price === "number") {
          setAddonPrice(metaData.addon_price);
        }
      }

      if (noGoData) {
        setNoGoText(noGoData.text);
      }

      setOptions(optionsData || []);
      setAddons(addonData || []);

      const allOptions = [...(optionsData || []), ...(addonData || [])];
      const initial: Record<string, "yes" | "no" | null> = {};
      allOptions.forEach((opt) => {
        const match = items?.find((i) => i.text === opt.text);
        initial[opt.id] = match?.choice ?? null;
      });
      setSelections(initial);
    };

    fetchData();
  }, []);

  const handleSave = async () => {
  console.log("📦 selections", selections);
  console.log("📦 options", options);
  console.log("📦 addons", addons);

  // Gem meta
  await supabase
    .from("fantasy_menu_meta")
    .upsert(
      { user_id: STINE_ID, price, addon_price: addonPrice, notes },
      { onConflict: "user_id" }
    );

  // Gem NO-GO tekst
  await supabase
    .from("fantasy_menu_nogos")
    .upsert({ user_id: STINE_ID, text: noGoText }, { onConflict: "user_id" });

  // Kombinér alle ydelser
  const allOptions = [...options, ...addons];

  // Byg listen til insert
  const toInsert = Object.entries(selections)
    .filter(([_, choice]) => choice !== null)
    .map(([id, choice]) => {
      const match = allOptions.find((opt) => opt.id === id);
      if (!match) {
        console.warn("⚠️ Mangler match for ID:", id);
        return null;
      }

      return {
        user_id: STINE_ID,
        text: match.text,
        choice,
        extra_price: match.is_addon ? addonPrice : null,
        is_selected: choice === "yes",
      };
    })
    .filter(Boolean);

  // Fjern dubletter baseret på user_id + text
 // Fjern dubletter baseret på user_id + text
const seen = new Set();
const filteredToInsert = toInsert.filter((item): item is NonNullable<typeof item> => {
  if (!item) return false;
  const key = `${item.user_id}-${item.text}`;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});


  console.log("🧾 Klar til at sende til Supabase (uden dubletter):");
  console.table(filteredToInsert);

  // Gem til Supabase
  const { error } = await supabase
    .from("fantasy_menu_items")
    .upsert(filteredToInsert, { onConflict: "user_id,text" });

  if (error) {
    console.error("❌ Supabase upsert-fejl", error);
    return;
  }

  // Gå videre
  router.push("/fantasy/menu-editor/naughty-profile");
};



  const handleAddOption = async () => {
    if (!newOption || !user) return;
    const { data, error } = await supabase
      .from("fantasy_menu_options")
      .insert({ text: newOption, is_addon: false, created_by: STINE_ID })
      .select();
    if (!error && data?.[0]) {
      setOptions((prev) => [...prev, data[0]]);
      setNewOption("");
      setOptionAdded(true);
    }
  };

  const handleAddAddon = async () => {
    if (!newAddon || !user) return;
    const { data, error } = await supabase
      .from("fantasy_menu_options")
      .insert({ text: newAddon, is_addon: true, created_by: STINE_ID })
      .select();
    if (!error && data?.[0]) {
      setAddons((prev) => [...prev, data[0]]);
      setNewAddon("");
      setAddonAdded(true);
    }
  };

  if (loading || !user) return null;

  return (
    <div className="max-w-md mx-auto p-4 space-y-6 bg-pink-50 border border-pink-200 rounded-2xl shadow-lg">
      <h1 className="text-3xl font-bold text-center text-pink-700 flex justify-center items-center gap-2">
        Stines valg
        {isEditor && (
          <button
            className="ml-2 p-1 text-gray-500 hover:text-black"
            onClick={() => setEditMode(!editMode)}
          >
            <Pencil size={20} />
          </button>
        )}
      </h1>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-normal text-pink-600">Tilføj ny ydelse</label>
          <input
            type="text"
            value={newOption}
            onChange={(e) => {
              setNewOption(e.target.value);
              setOptionAdded(false);
            }}
            className="w-full border border-pink-300 rounded px-3 py-2"
          />
          <button onClick={handleAddOption} className="mt-1 bg-pink-600 text-white px-3 py-1 rounded">
            Tilføj
          </button>
          {optionAdded && <p className="text-xs text-pink-600 mt-1">Tilføjet</p>}
        </div>

        <div>
          <label className="block text-sm font-normal text-pink-600">Pris for hele pakken</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="w-full border border-pink-300 rounded px-3 py-2"
          />
        </div>
      </div>

      <DndKitWrapper
        options={options}
        addons={[]}
        selections={selections}
        setSelections={setSelections}
        setOptions={setOptions}
        setAddons={setAddons}
        isEditor={isEditor}
        editMode={editMode}
        editingId={editingId}
        setEditingId={setEditingId}
        editText={editText}
        setEditText={setEditText}
      />

      <div className="space-y-4 pt-4 border-t border-pink-200">
        <h2 className="text-xl font-bold text-pink-500">Tillægsydelser</h2>

        <div>
          <label className="block text-sm font-normal text-pink-600">Pris for hver tillægsydelse</label>
          <input
            type="number"
            value={addonPrice}
            onChange={(e) => setAddonPrice(Number(e.target.value))}
            className="w-full border border-pink-300 rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-normal text-pink-600">Tilføj ny tillægsydelse</label>
          <input
            type="text"
            value={newAddon}
            onChange={(e) => {
              setNewAddon(e.target.value);
              setAddonAdded(false);
            }}
            className="w-full border border-pink-300 rounded px-3 py-2"
          />
          <button onClick={handleAddAddon} className="mt-1 bg-pink-600 text-white px-3 py-1 rounded">
            Tilføj
          </button>
          {addonAdded && <p className="text-xs text-pink-600 mt-1">Tilføjet</p>}
        </div>

        <DndKitWrapper
          options={[]}
          addons={addons}
          selections={selections}
          setSelections={setSelections}
          setOptions={setOptions}
          setAddons={setAddons}
          isEditor={isEditor}
          editMode={editMode}
          editingId={editingId}
          setEditingId={setEditingId}
          editText={editText}
          setEditText={setEditText}
        />
      </div>

      <div>
        <label className="block font-normal text-pink-600">NO-GO zoner eller personlige grænser:</label>
        <textarea
          value={noGoText}
          onChange={(e) => setNoGoText(e.target.value)}
          rows={4}
          className="w-full border border-pink-300 rounded px-3 py-2"
          placeholder="Skriv fx: ingen analsex, ingen dominans, eller andre vigtige grænser..."
        />
      </div>

      <button
        onClick={handleSave}
        className="w-full bg-pink-600 hover:bg-pink-700 text-white py-2 rounded-xl font-semibold shadow"
      >
        Gem valgene
      </button>
    </div>
  );
}
