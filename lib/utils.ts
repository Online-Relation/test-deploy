import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { supabase } from './supabaseClient'


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Tilføj XP-log i databasen
export const addXpLog = async ({
  user_id,
  role,
  change,
  description
}: {
  user_id: string
  role: string
  change: number
  description: string
}) => {
  await supabase.from('xp_log').insert({
    user_id,
    role,
    change,
    description
  });
};
