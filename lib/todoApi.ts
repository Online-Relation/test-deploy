// /lib/todoApi.ts

import { supabase } from "./supabaseClient";

// Typing for din to-do (samme som SQL)
export interface ToDo {
  id: string;
  user_id: string;
  text: string;
  done: boolean;
  category: string;
  priority: string;
  deadline?: string | null;
  created_at: string;
  updated_at: string;
  // VIGTIGT: tilføj disse:
  repeat_type?: "never" | "daily" | "weekly" | "monthly";
  repeat_until?: string | null;
}


// Hent alle to-dos (kun for én bruger)
export async function fetchTodos(user_id: string): Promise<ToDo[]> {
  const { data, error } = await supabase
    .from('private_to_do')
    .select('*')
    .eq('user_id', user_id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

// Tilføj ny todo
export async function addTodo(todo: Omit<ToDo, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('private_to_do')
    .insert([todo])
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Opdater todo (fx done, tekst, deadline)
export async function updateTodo(id: string, updates: Partial<ToDo>) {
  const { data, error } = await supabase
    .from('private_to_do')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Slet todo
export async function deleteTodo(id: string) {
  const { error } = await supabase
    .from('private_to_do')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
}
