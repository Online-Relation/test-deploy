// app/fantasy/menu-editor/naughty-profile/page.tsx

"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useUserContext } from "@/context/UserContext";
import { Pencil } from "lucide-react";

const SortableItem = dynamic(() => import("@/components/SortableItem") as any, {
  ssr: false,
});


const DndKitWrapper = dynamic(() => import("@/components/naughty/DndKitWrapper"), { ssr: false });

interface Option {
  id: string;
  text: string;
  created_by: string;
  is_addon: boolean;
}

const EDITOR_ID = "190a3151-97bc-43be-9daf-1f3b3062f97f";

export default function MenuSelectPage() {
  const { user } = useUserContext();
  const router = useRouter();
  const [options, setOptions] = useState<Option[]>([]);
  const [addons, setAddons] = useState<Option[]>([]);
  const [selections, setSelections] = useState<Record<string, "yes" | "no" | null>>({});
  const [price, setPrice] = useState(100);
  const [addonPrice, setAddonPrice] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [newOption, setNewOption] = useState("");
  const [newAddon, setNewAddon] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [noGoText, setNoGoText] = useState("");
  const isEditor = user?.id === EDITOR_ID;

  useEffect(() => {
    if (!user?.id) return;
    const fetchData = async () => {
      const { data: optionsData } = await supabase
        .from("fantasy_menu_options")
        .select("*")
        .eq("is_addon", false)
        .order("sort_order");

      const { data: addonData } = await supabase
        .from("fantasy_menu_options")
        .select("*")
        .eq("is_addon", true)
        .order("sort_order");

      const { data: items } = await supabase
        .from("fantasy_menu_items")
        .select("text, choice")
        .eq("user_id", user.id);

      const { data: metaData } = await supabase
        .from("fantasy_menu_meta")
        .select("price, addon_price, notes")
        .eq("user_id", user.id)
        .single();

      const { data: noGoData } = await supabase
        .from("fantasy_menu_nogos")
        .select("text")
        .eq("user_id", user.id)
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
  }, [user?.id]);

  const handleSave = async () => {
    if (!user?.id) return alert("Bruger ikke fundet");

    await supabase
      .from("fantasy_menu_meta")
      .upsert(
        { user_id: user.id, price, addon_price: addonPrice, notes },
        { onConflict: "user_id" }
      );

    await supabase
      .from("fantasy_menu_nogos")
      .upsert({ user_id: user.id, text: noGoText }, { onConflict: "user_id" });

    const toInsert = Object.entries(selections)
      .filter(([_, choice]) => choice !== null)
      .map(([id, choice]) => ({
        user_id: user.id,
        text: [...options, ...addons].find((opt) => opt.id === id)?.text ?? "",
        choice,
        extra_price: addons.some((a) => a.id === id) ? addonPrice : null,
        is_selected: choice === "yes",
      }));

    if (toInsert.length) {
      await supabase
        .from("fantasy_menu_items")
        .upsert(toInsert, { onConflict: "user_id,text" });
    }

    router.push("/fantasy/menu-editor/naughty-profile");
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold text-center flex justify-center items-center gap-2">
        Stines valg 🍓
        {isEditor && (
          <button
            className="ml-2 p-1 text-gray-500 hover:text-black"
            onClick={() => setEditMode(!editMode)}
          >
            <Pencil size={20} />
          </button>
        )}
      </h1>

      <DndKitWrapper
        options={options}
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

      <div>
        <label className="block font-semibold text-red-600">NO-GO zoner eller personlige grænser:</label>
        <textarea
          value={noGoText}
          onChange={(e) => setNoGoText(e.target.value)}
          rows={4}
          className="w-full border rounded px-2 py-1"
          placeholder="Skriv fx: ingen analsex, ingen dominans, eller andre vigtige grænser..."
        />
      </div>

      <button
        onClick={handleSave}
        className="w-full bg-blue-600 text-white py-2 rounded mt-6"
      >
        Gem valgene
      </button>
    </div>
  );
}
