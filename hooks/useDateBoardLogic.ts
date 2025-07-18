'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface CategoryEntry {
  id: string;
  name: string;
}

function toCamelCase(date: any) {
  return {
    ...date,
    imageUrl: date.image_url,
    extraImages: date.extra_images,
    plannedDate: date.planned_date,
    fulfilledDate: date.fulfilled_date,
    createdDate: date.created_date,
    // andre konverteringer hvis nødvendigt
  };
}

function toSnakeCase(date: any) {
  return {
    ...date,
    image_url: date.imageUrl,
    extra_images: date.extraImages,
    planned_date: date.plannedDate,
    fulfilled_date: date.fulfilledDate,
    created_date: date.createdDate,
    // andre konverteringer hvis nødvendigt
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
    // initialiser med camelCase
  });

  useEffect(() => {
    fetchDates();
    // Hvis du senere skal bruge profileMap, kan du fetche brugere her
  }, []);

  async function fetchDates() {
    const { data, error } = await supabase
      .from('dates')
      .select('*')
      .order('created_date', { ascending: false });
    if (!error && data) {
      // Konverter alle data til camelCase
      const normalized = data.map(toCamelCase);
      setDates(normalized);
    }
  }

  async function handleCreateNewDate(date: any) {
    // Konverter data til snake_case før opslag
    const insertData = toSnakeCase(date);
    const { data, error } = await supabase
      .from('dates')
      .insert([insertData])
      .select();
    if (!error && data) {
      const normalized = data.map(toCamelCase);
      setDates((prev) => [normalized[0], ...prev]);
      setShowAddModal(false);
    }
  }

  async function handleDeleteDate(id: string) {
    const { error } = await supabase.from('dates').delete().eq('id', id);
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
    await supabase.from('dates').update({ status: newStatus }).eq('id', id);
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
