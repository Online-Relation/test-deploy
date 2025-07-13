'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';

// Kategori-type: { id, name }
export interface CategoryEntry {
  id: string;
  name: string;
}

interface CategoryContextType {
  fantasyCategories: CategoryEntry[];
  dateCategories: CategoryEntry[];
  setFantasyCategories: (categories: CategoryEntry[]) => void;
  setDateCategories: (categories: CategoryEntry[]) => void;
  refreshCategories: () => Promise<void>;
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

export function useCategory() {
  const context = useContext(CategoryContext);
  if (!context) {
    throw new Error('useCategory must be used within a CategoryProvider');
  }
  return context;
}

export function CategoryProvider({ children }: { children: ReactNode }) {
  const [fantasyCategories, setFantasyCategories] = useState<CategoryEntry[]>([]);
  const [dateCategories, setDateCategories] = useState<CategoryEntry[]>([]);

  // Fetch begge kategorityper
  const fetchCategories = async () => {
    const { data: fantasyData } = await supabase.from('fantasy_categories').select('*');
    if (fantasyData) setFantasyCategories(fantasyData.map((row) => ({ id: row.id, name: row.name })));

    const { data: dateData } = await supabase.from('date_categories').select('*');
    if (dateData) setDateCategories(dateData.map((row) => ({ id: row.id, name: row.name })));
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <CategoryContext.Provider
      value={{
        fantasyCategories,
        dateCategories,
        setFantasyCategories,
        setDateCategories,
        refreshCategories: fetchCategories,
      }}
    >
      {children}
    </CategoryContext.Provider>
  );
}
