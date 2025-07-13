// hooks/useDateBoardLogic.ts
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface CategoryEntry {
  id: string;
  name: string;
}

export default function useDateBoardLogic() {
  const [dates, setDates] = useState<any[]>([]);
  const [profileMap, setProfileMap] = useState<Record<string, string>>({});
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDateData, setNewDateData] = useState<any>({
    status: 'idea',
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
    if (!error && data) setDates(data);
  }

  async function handleCreateNewDate(date: any) {
    const { data, error } = await supabase
      .from('dates')
      .insert([{ ...date }])
      .select();
    if (!error && data) {
      setDates((prev) => [data[0], ...prev]);
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
