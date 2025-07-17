// /components/ui/globalmodal/CategorySelect.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Badge from "@/components/ui/globalmodal/CategoryBadge";
import { Category } from "./types";

type CategorySelectProps = {
  value: Category[];
  onChange: (newCategories: Category[]) => void;
  categoryType?: string; // <-- NY: angiv kategori-type fx "fantasy"
};

const CATEGORY_COLORS: Category["color"][] = [
  "orange",
  "blue",
  "green",
  "purple",
  "gray",
];

export default function CategorySelect({
  value,
  onChange,
  categoryType = "global", // <-- default til "global" hvis intet angives
}: CategorySelectProps) {
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState("");
  const [filtered, setFiltered] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Hent kun kategorier for den angivne type
  useEffect(() => {
  setIsLoading(true);
  supabase
    .from("modal_categories")
    .select("*")
    .eq("type", categoryType)
    .then(({ data }) => {
      console.log("Fetched categories for type", categoryType, data); // <-- LOG
      if (data) {
        setAllCategories(
          (data as any[]).map((cat) => ({
            ...cat,
            color: CATEGORY_COLORS.includes(cat.color)
              ? cat.color
              : "gray",
          }))
        );
      }
      setIsLoading(false);
    });
}, [categoryType]);


  // Filtrer på søgning og undgå allerede valgte
 useEffect(() => {
  const lower = query.toLowerCase();
  const filteredResult = allCategories.filter(
    (cat) =>
      cat.label.toLowerCase().includes(lower) &&
      !value.find((v) => v.id === cat.id)
  );
  console.log("Query:", query, "All:", allCategories, "Filtered:", filteredResult, "Value:", value);
  setFiltered(filteredResult);
}, [query, allCategories, value]);


  // Tilføj eksisterende kategori
  function handleSelect(cat: Category) {
    onChange([...value, cat]);
    setQuery("");           // <-- Ryd søgefeltet
    setFiltered([]);        // <-- Ryd forslag
  }

  // Tilføj ny kategori (opretter i Supabase)
  async function handleAddNew() {
    const label = query.trim();
    if (!label) return;
    if (
      allCategories.find(
        (cat) =>
          cat.label.toLowerCase() === label.toLowerCase() &&
          cat.type === categoryType
      )
    )
      return;

    const color: Category["color"] = "purple";
    const { data } = await supabase
      .from("modal_categories")
      .insert([{ label, color, type: categoryType }])
      .select()
      .single();
    if (data) {
      const cat: Category = {
        id: data.id,
        label: data.label,
        color: CATEGORY_COLORS.includes(data.color) ? data.color : "gray",
        type: data.type,
      };
      onChange([...value, cat]);
      setAllCategories((prev) => [...prev, cat]);
      setQuery("");        // <-- Ryd søgefeltet
      setFiltered([]);     // <-- Ryd forslag
    }
  }

  // Fjern kategori
  function handleRemove(cat: Category) {
    onChange(value.filter((c) => c.id !== cat.id));
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map((cat) => (
          <Badge color={cat.color} key={cat.id}>
            {cat.label}
            <button
              onClick={() => handleRemove(cat)}
              className="ml-1 text-red-500 font-bold"
              type="button"
              tabIndex={-1}
            >
              &times;
            </button>
          </Badge>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Søg eller tilføj kategori"
          className="border rounded px-3 py-2 flex-grow"
          onKeyDown={e => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (
                !allCategories.find(
                  cat =>
                    cat.label.toLowerCase() === query.trim().toLowerCase() &&
                    cat.type === categoryType
                )
              ) {
                handleAddNew();
              } else if (filtered.length > 0) {
                handleSelect(filtered[0]);
              }
            }
          }}
        />
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleAddNew}
          disabled={
            !query.trim() ||
            !!allCategories.find(
              cat =>
                cat.label.toLowerCase() === query.trim().toLowerCase() &&
                cat.type === categoryType
            )
          }
        >
          Tilføj
        </button>
      </div>

      {query && filtered.length > 0 && (
        <div className="mt-1 border bg-white rounded shadow-sm max-h-40 overflow-auto z-20">
          {filtered.map(cat => (
            <div
              key={cat.id}
              onClick={() => handleSelect(cat)}
              className="px-3 py-2 cursor-pointer hover:bg-gray-100"
            >
              {cat.label}
            </div>
          ))}
        </div>
      )}

      {isLoading && <div className="text-xs text-gray-500 mt-2">Henter kategorier…</div>}
    </div>
  );
}
