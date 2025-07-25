"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableItem } from "@/components/SortableItem";

interface TableItem {
  id: string;
  table_name: string;
  description: string;
  enabled: boolean;
  priority: number;
  ignored: boolean;
}

const EXCLUDE_TABLES = [
  "spatial_ref_sys",
  "geometry_columns",
  "geography_columns",
  "raster_columns",
  "raster_overviews",
  "topology",
  "topology_edges",
  "topology_faces",
  "topology_nodes",
  "topology_paths",
  "topology_topogroups",
];

export default function SettingsTables() {
  const [tables, setTables] = useState<TableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    async function fetchTables() {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from("recommendation_sources")
          .select("*")
          .order("priority", { ascending: true });
        if (error) throw error;

        const { data: allTables, error: allTablesError } = await supabase.rpc(
          "get_all_public_tables"
        );
        if (allTablesError) throw allTablesError;

        const filteredAllTables = allTables.filter(
          (tbl: any) => !EXCLUDE_TABLES.includes(tbl.table_name)
        );

        const existingTableNames = data.map((tbl: TableItem) => tbl.table_name);

        const combinedTables: TableItem[] = [
          ...data,
          ...filteredAllTables
            .filter((tbl: any) => !existingTableNames.includes(tbl.table_name))
            .map((tbl: any, idx: number) => ({
              id: `new-${idx}`,
              table_name: tbl.table_name,
              description: "",
              enabled: false,
              priority: (data?.length || 0) + idx + 1,
              ignored: false,
            })),
        ];

        setTables(combinedTables);
      } catch (err: any) {
        setError(err.message || "Fejl ved hentning af tabeller");
      } finally {
        setLoading(false);
      }
    }
    fetchTables();
  }, []);

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over) return; // Hvis man slipper udenfor
    if (active.id !== over.id) {
      setTables((items) => {
        // Find item og sektion (ignoreret eller ej)
        const activeItem = items.find((i) => i.id === active.id);
        const overItem = items.find((i) => i.id === over.id);
        if (!activeItem || !overItem) return items;

        // Sørg for at kun sortere inden for samme sektion (ignoreret eller ej)
        if (activeItem.ignored !== overItem.ignored) return items;

        // Filtrer tabeller inden for samme sektion
        const sectionItems = items.filter((i) => i.ignored === activeItem.ignored);

        // Indekser for drag/drop inden for sektion
        const oldIndex = sectionItems.findIndex((i) => i.id === active.id);
        const newIndex = sectionItems.findIndex((i) => i.id === over.id);

        // Reorder sektionen
        const newSection = arrayMove(sectionItems, oldIndex, newIndex).map(
          (item, index) => ({
            ...item,
            priority: index + 1,
          })
        );

        // Erstat gamle sektion i hele arrayet
        const others = items.filter((i) => i.ignored !== activeItem.ignored);

        // Sorter andre sektioner efter priority, så vi har samlet array
        const combined = [...newSection, ...others].sort(
          (a, b) => a.priority - b.priority
        );

        return combined;
      });
    }
  };

  const toggleEnabled = (id: string) => {
    setTables((items) =>
      items.map((item) =>
        item.id === id ? { ...item, enabled: !item.enabled } : item
      )
    );
  };

  const toggleIgnored = (id: string) => {
    setTables((items) =>
      items.map((item) =>
        item.id === id ? { ...item, ignored: !item.ignored } : item
      )
    );
  };

  const updateDescription = (id: string, value: string) => {
    setTables((items) =>
      items.map((item) => (item.id === id ? { ...item, description: value } : item))
    );
  };

  const updateTableName = (id: string, value: string) => {
    setTables((items) =>
      items.map((item) => (item.id === id ? { ...item, table_name: value } : item))
    );
  };

  const saveTables = async () => {
    setSaving(true);
    setError(null);

    try {
      const toSave = tables.filter(
        (t) => t.description.trim() !== "" || t.enabled === true || t.ignored === true
      );

      const { error } = await supabase.from("recommendation_sources").upsert(
        toSave.map(({ id, ...rest }) => rest),
        { onConflict: "table_name" }
      );

      if (error) throw error;
      alert("Tabeller gemt");
    } catch (err: any) {
      setError(err.message || "Fejl ved gem");
    } finally {
      setSaving(false);
    }
  };

  // Del tabeller i ignoreret og ikke ignoreret
  const notIgnoredTables = tables.filter((t) => !t.ignored);
  const ignoredTables = tables.filter((t) => t.ignored);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Anbefalingstabeller</h1>
      {loading ? (
        <p>Henter tabeller...</p>
      ) : error ? (
        <p className="text-red-600 mb-4">{error}</p>
      ) : (
        <>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <h2 className="mb-2 font-semibold">Tabeller</h2>
            <SortableContext
              items={notIgnoredTables.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="mb-8">
                {notIgnoredTables.map((table) => (
                  <SortableItem
                    key={table.id}
                    id={table.id}
                    label={
                      <div className="bg-violet-100 p-4 rounded-lg flex flex-col sm:flex-row gap-4 sm:items-center">
                        <input
                          type="text"
                          className="border border-violet-300 rounded px-3 py-2 w-full sm:w-48"
                          value={table.table_name}
                          onChange={(e) => updateTableName(table.id, e.target.value)}
                          placeholder="Tabelnavn"
                          disabled={table.ignored}
                        />
                        <label className="flex items-center gap-2 cursor-pointer select-none whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={table.enabled}
                            onChange={() => toggleEnabled(table.id)}
                            disabled={table.ignored}
                            className="w-5 h-5"
                          />
                          <span>Aktiv</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer select-none whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={table.ignored}
                            onChange={() => toggleIgnored(table.id)}
                            className="w-5 h-5"
                          />
                          <span>Ignorer</span>
                        </label>
                        <textarea
                          className="border border-violet-300 rounded px-3 py-2 flex-grow min-w-[250px] resize-y"
                          value={table.description}
                          onChange={(e) => updateDescription(table.id, e.target.value)}
                          placeholder="Beskrivelse til GPT"
                          rows={3}
                          disabled={table.ignored}
                        />
                      </div>
                    }
                  />
                ))}
              </ul>
            </SortableContext>

            {ignoredTables.length > 0 && (
              <>
                <h2 className="mb-2 font-semibold text-red-600">Ignorerede tabeller</h2>
                <SortableContext
                  items={ignoredTables.map((t) => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <ul>
                    {ignoredTables.map((table) => (
                      <SortableItem
                        key={table.id}
                        id={table.id}
                        label={
                          <div className="bg-violet-100 p-4 rounded-lg flex flex-col sm:flex-row gap-4 sm:items-center opacity-50">
                            <input
                              type="text"
                              className="border border-violet-300 rounded px-3 py-2 w-full sm:w-48"
                              value={table.table_name}
                              onChange={(e) => updateTableName(table.id, e.target.value)}
                              placeholder="Tabelnavn"
                              disabled={table.ignored}
                            />
                            <label className="flex items-center gap-2 cursor-pointer select-none whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={table.enabled}
                                onChange={() => toggleEnabled(table.id)}
                                disabled={table.ignored}
                                className="w-5 h-5"
                              />
                              <span>Aktiv</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer select-none whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={table.ignored}
                                onChange={() => toggleIgnored(table.id)}
                                className="w-5 h-5"
                              />
                              <span>Ignorer</span>
                            </label>
                            <textarea
                              className="border border-violet-300 rounded px-3 py-2 flex-grow min-w-[250px] resize-y"
                              value={table.description}
                              onChange={(e) => updateDescription(table.id, e.target.value)}
                              placeholder="Beskrivelse til GPT"
                              rows={3}
                              disabled={table.ignored}
                            />
                          </div>
                        }
                      />
                    ))}
                  </ul>
                </SortableContext>
              </>
            )}
          </DndContext>

          <button
            onClick={saveTables}
            disabled={saving}
            className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "Gemmer..." : "Gem ændringer"}
          </button>
        </>
      )}
    </div>
  );
}
