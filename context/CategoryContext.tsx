// src/context/CategoryContext.tsx
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface CategoryContextType {
  fantasyCategories: string[];
  dateCategories: string[];
  setFantasyCategories: (categories: string[]) => void;
  setDateCategories: (categories: string[]) => void;
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
  const [fantasyCategories, setFantasyCategories] = useState<string[]>([]);
  const [dateCategories, setDateCategories] = useState<string[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data: fantasyData } = await supabase.from('fantasy_categories').select('*');
      if (fantasyData) setFantasyCategories(fantasyData.map((row) => row.name));

      const { data: dateData } = await supabase.from('date_categories').select('*');
      if (dateData) setDateCategories(dateData.map((row) => row.name));
    };
    fetchCategories();
  }, []);

  return (
    <CategoryContext.Provider
      value={{ fantasyCategories, dateCategories, setFantasyCategories, setDateCategories }}>
      {children}
    </CategoryContext.Provider>
  );
}