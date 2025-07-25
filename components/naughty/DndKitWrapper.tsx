// components/naughty/DndKitWrapper.tsx

"use client";

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
import { useState } from "react";
import { SortableItem } from "@/components/SortableItem";

interface Option {
  id: string;
  text: string;
  created_by: string;
  is_addon: boolean;
}

interface Props {
  options: Option[];
  addons: Option[];
  selections: Record<string, "yes" | "no" | null>;
  setSelections: React.Dispatch<React.SetStateAction<Record<string, "yes" | "no" | null>>>;
  setOptions: (value: Option[]) => void;
  setAddons: (value: Option[]) => void;
  isEditor: boolean;
  editMode: boolean;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  editText: string;
  setEditText: (text: string) => void;
}

export default function DndKitWrapper({
  options,
  addons,
  selections,
  setSelections,
  setOptions,
  setAddons,
  isEditor,
  editMode,
  editingId,
  setEditingId,
  editText,
  setEditText,
}: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleSelect = (id: string, choice: "yes" | "no") => {
    setSelections((prev) => ({ ...prev, [id]: choice }));
  };

  const handleDragEnd = (event: any, listType: "option" | "addon") => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const items = listType === "option" ? [...options] : [...addons];
    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    const sorted = arrayMove(items, oldIndex, newIndex);

    if (listType === "option") setOptions(sorted);
    else setAddons(sorted);
  };

  return (
    <>
      <h2 className="text-xl font-semibold">Ydelser</h2>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, "option")}> 
        <SortableContext items={options.map((o) => o.id)} strategy={verticalListSortingStrategy}>
          {options.map((opt) => (
            <SortableItem
              key={opt.id}
              id={opt.id}
              label={
                <div className="flex flex-col w-full">
                  <span className="text-sm font-medium">{opt.text}</span>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleSelect(opt.id, "yes")}
                      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                        selections[opt.id] === "yes"
                          ? "bg-green-500 text-white shadow-md"
                          : "bg-white text-green-600 border border-green-500 hover:bg-green-100"
                      }`}
                    >
                      Ja
                    </button>
                    <button
                      onClick={() => handleSelect(opt.id, "no")}
                      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                        selections[opt.id] === "no"
                          ? "bg-red-500 text-white shadow-md"
                          : "bg-white text-red-600 border border-red-500 hover:bg-red-100"
                      }`}
                    >
                      Nej
                    </button>
                  </div>
                </div>
              }
              onEdit={isEditor ? () => setEditingId(opt.id) : undefined}
              onDelete={undefined} // Tilføj slet-funktion hvis ønsket
            />
          ))}
        </SortableContext>
      </DndContext>

      <h2 className="text-xl font-semibold text-purple-700 mt-6">Tillægsydelser</h2>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, "addon")}> 
        <SortableContext items={addons.map((a) => a.id)} strategy={verticalListSortingStrategy}>
          {addons.map((opt) => (
            <SortableItem
              key={opt.id}
              id={opt.id}
              label={
                <div className="flex flex-col w-full">
                  <span className="text-sm font-medium">{opt.text}</span>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleSelect(opt.id, "yes")}
                      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                        selections[opt.id] === "yes"
                          ? "bg-green-500 text-white shadow-md"
                          : "bg-white text-green-600 border border-green-500 hover:bg-green-100"
                      }`}
                    >
                      Ja
                    </button>
                    <button
                      onClick={() => handleSelect(opt.id, "no")}
                      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                        selections[opt.id] === "no"
                          ? "bg-red-500 text-white shadow-md"
                          : "bg-white text-red-600 border border-red-500 hover:bg-red-100"
                      }`}
                    >
                      Nej
                    </button>
                  </div>
                </div>
              }
              onEdit={isEditor ? () => setEditingId(opt.id) : undefined}
              onDelete={undefined} // Tilføj slet-funktion hvis ønsket
            />
          ))}
        </SortableContext>
      </DndContext>
    </>
  );
}
