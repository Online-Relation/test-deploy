// app/fantasy/menu-editor/naughty-profile/page.tsx

"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useUserContext } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";

const DndKitWrapper = dynamic(() => import("@/components/naughty/DndKitWrapper"), {
  ssr: false,
});

interface Option {
  id: string;
  text: string;
  created_by: string;
  is_addon: boolean;
}

const EDITOR_ID = "190a3151-97bc-43be-9daf-1f3b3062f97f";

export default function MenuSelectPage() {
  console.log("🔄 MenuSelectPage rendering...");
  const { user, loading } = useUserContext(); // skal altid kaldes uden for betingelser
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
    if (!user) return;

    const fetchData = async () => {
      console.log("📦 Henter data fra Supabase...");

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

      console.log("✅ optionsData:", optionsData);
      console.log("✅ addonData:", addonData);
      console.log("✅ items:", items);
      console.log("✅ metaData:", metaData);
      console.log("✅ noGoData:", noGoData);

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
  if (!user) return; // Beskyt mod null user

  console.log("💾 Gemmer valg til Supabase...");

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

  console.log("📦 Indhold der gemmes:", toInsert);

  if (toInsert.length) {
    await supabase
      .from("fantasy_menu_items")
      .upsert(toInsert, { onConflict: "user_id,text" });
  }

  router.push("/fantasy/menu-editor/naughty-profile");
};


  // først her må du returnere tidlig
  if (loading || !user) {
    console.log("⏳ Enten loader vi eller mangler user – return null");
    return null;
  }

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
        <label className="block font-semibold text-pink-600">NO-GO zoner eller personlige grænser:</label>
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
