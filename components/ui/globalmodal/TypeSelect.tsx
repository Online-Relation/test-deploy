// /components/ui/globalmodal/TypeSelect.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type TypeOption = {
  id: string;
  label: string;
};

type TypeSelectProps = {
  value: TypeOption | null;
  onChange: (type: TypeOption | null) => void;
};

export default function TypeSelect({ value, onChange }: TypeSelectProps) {
  const [allTypes, setAllTypes] = useState<TypeOption[]>([]);
  const [query, setQuery] = useState("");
  const [filtered, setFiltered] = useState<TypeOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Hent alle eksisterende typer fra 'modal_objects' eller evt. 'modal_types'
  useEffect(() => {
    setIsLoading(true);
    supabase
      .from("modal_objects")
      .select("type")
      .then(({ data }) => {
        if (data) {
          // Udtræk unikke types
          const uniqueTypes = Array.from(
            new Set(data.map((row: any) => row.type).filter(Boolean))
          ).map((t) => ({
            id: t,
            label: t.charAt(0).toUpperCase() + t.slice(1),
          }));
          setAllTypes(uniqueTypes);
        }
        setIsLoading(false);
      });
  }, []);

  // Filtrer på søgning og undgå allerede valgt type
  useEffect(() => {
    const lower = query.toLowerCase();
    setFiltered(
      allTypes.filter(
        (type) =>
          type.label.toLowerCase().includes(lower) &&
          (!value || type.id !== value.id)
      )
    );
  }, [query, allTypes, value]);

  // Vælg eksisterende type
  function handleSelect(type: TypeOption) {
    onChange(type);
    setQuery("");
    setFiltered([]);
  }

  // Tilføj ny type (opret ikke i DB, bare som value)
  function handleAddNew() {
    const label = query.trim();
    if (!label) return;
    if (allTypes.find((t) => t.label.toLowerCase() === label.toLowerCase()))
      return;
    const newType = {
      id: label.toLowerCase(),
      label: label.charAt(0).toUpperCase() + label.slice(1),
    };
    setAllTypes((prev) => [...prev, newType]);
    onChange(newType);
    setQuery("");
    setFiltered([]);
  }

  // Fjern valgt type
  function handleRemove() {
    onChange(null);
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {value && (
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center">
            {value.label}
            <button
              onClick={handleRemove}
              className="ml-2 text-red-500 font-bold"
              type="button"
              tabIndex={-1}
            >
              &times;
            </button>
          </span>
        )}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Søg eller tilføj type"
          className="border rounded px-3 py-2 flex-grow"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (
                !allTypes.find(
                  (t) => t.label.toLowerCase() === query.trim().toLowerCase()
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
            !!allTypes.find(
              (t) => t.label.toLowerCase() === query.trim().toLowerCase()
            )
          }
        >
          Tilføj
        </button>
      </div>
      {query && filtered.length > 0 && (
        <div className="mt-1 border bg-white rounded shadow-sm max-h-40 overflow-auto z-20">
          {filtered.map((type) => (
            <div
              key={type.id}
              onClick={() => handleSelect(type)}
              className="px-3 py-2 cursor-pointer hover:bg-gray-100"
            >
              {type.label}
            </div>
          ))}
        </div>
      )}
      {isLoading && <div className="text-xs text-gray-500 mt-2">Henter typer…</div>}
    </div>
  );
}
