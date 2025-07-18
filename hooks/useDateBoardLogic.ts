// /hooks/useDateBoardLogic.ts
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useUserContext } from "@/context/UserContext";

export interface CategoryEntry {
  id: string;
  name: string;
}

function toCamelCase(date: any) {
  return {
    ...date,
    imageUrl: date.image_url,
    extraImages: date.extra_images,
    galleryImages: date.gallery_images ?? [],
    plannedDate: date.planned_date,
    fulfilledDate: date.fulfilled_date,
    createdDate: date.created_date,
  };
}

function toSnakeCase(date: any) {
  return {
    title: date.title,
    description: date.description,
    category: date.category,
    image_url: date.imageUrl,
    extra_images: date.extraImages,
    gallery_images: date.galleryImages ?? [],
    planned_date: date.plannedDate,
    fulfilled_date: date.fulfilledDate,
    created_date: date.createdDate,
    status: date.status,
    // Tilføj flere hvis nødvendigt – ALDRIG camelCase!
  };
}

export default function useDateBoardLogic() {
  const [dates, setDates] = useState<any[]>([]);
  const [profileMap, setProfileMap] = useState<Record<string, string>>({});
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDateData, setNewDateData] = useState<any>({
    status: 'idea',
    imageUrl: '',
    extraImages: [],
    galleryImages: [], // ALTID et array!
  });

  const { user } = useUserContext();

  useEffect(() => {
    fetchDates();
  }, []);

  async function fetchDates() {
    const { data, error } = await supabase
      .from('modal_objects')
      .select('*')
      .order('created_date', { ascending: false });

    if (!error && data) {
      const normalized = data.map(toCamelCase);
      setDates(normalized);
    }
  }

  async function handleCreateNewDate(date: any) {
    const insertData = toSnakeCase(date);

    // Log altid her for at være 100% sikker på payload!
    console.log("INSERT OBJ:", {
      ...insertData,
      created_by: user?.id,
      type: "date-idea",
    });

    const { data, error } = await supabase
      .from('modal_objects')
      .insert([
        {
          ...insertData,
          created_by: user?.id,
          type: "date-idea",
        }
      ])
      .select();

    if (error) {
      console.error("[handleCreateNewDate] Fejl:", error.message, error.details);
    }

    if (!error && data) {
      const normalized = data.map(toCamelCase);
      setDates((prev) => [normalized[0], ...prev]);
      setShowAddModal(false);
    }
  }

  async function handleDeleteDate(id: string) {
    const { error } = await supabase.from('modal_objects').delete().eq('id', id);
    if (!error) setDates((prev) => prev.filter((d) => d.id !== id));
  }

  async function handleDragEnd(event: any) {
    const { active, over } = event;
    if (!over || !active) return;
    const id = active.id;
    const newStatus = over.id;
    setDates((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: newStatus } : d))
    );
    await supabase.from('modal_objects').update({ status: newStatus }).eq('id', id);
  }

  return {
    dates,
    profileMap,
    filterCategory,
    showAddModal,
    newDateData,
    setFilterCategory,
    setShowAddModal,
    setNewDateData,
    handleCreateNewDate,
    handleDeleteDate,
    handleDragEnd,
  };
}
