// components/memories/MemoryFilters.tsx

import React from "react";

export type MemoryFiltersProps = {
  categories: string[];
  locations: string[];
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  activeLocation: string;
  setActiveLocation: (loc: string) => void;
  search: string;
  setSearch: (v: string) => void;
};

const chipStyle = (active: boolean) =>
  `px-3 py-1 rounded-full text-xs font-semibold mr-2 mb-2 cursor-pointer transition ${
    active
      ? "bg-purple-600 text-white shadow"
      : "bg-gray-200 text-gray-700 hover:bg-purple-100"
  }`;

const MemoryFilters: React.FC<MemoryFiltersProps> = ({
  categories,
  locations,
  activeCategory,
  setActiveCategory,
  activeLocation,
  setActiveLocation,
  search,
  setSearch,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-y-2 mb-6">
      {/* Kategori-chips */}
      <div className="flex flex-wrap mr-2">
        <span
          className={chipStyle(activeCategory === "Alle")}
          onClick={() => setActiveCategory("Alle")}
        >
          Alle
        </span>
        {(categories.length > 0 ? categories : ["Ingen kategorier"]).map((cat) => (
          <span
            key={cat}
            className={chipStyle(activeCategory === cat)}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </span>
        ))}
      </div>
      {/* Lokations-chips */}
      <div className="flex flex-wrap mr-2">
        {(locations.length > 0 ? ["Alle områder", ...locations] : ["Alle områder"]).map((loc) => (
          <span
            key={loc}
            className={chipStyle(activeLocation === loc)}
            onClick={() => setActiveLocation(loc)}
          >
            {loc}
          </span>
        ))}
      </div>
      {/* Søgefelt */}
      <input
        className="ml-auto px-2 py-1 border rounded-md text-sm w-48 focus:outline-none focus:ring-2 focus:ring-purple-400"
        placeholder="Søg minder…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
    </div>
  );
};

export default MemoryFilters;
