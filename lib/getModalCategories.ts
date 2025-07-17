// /lib/getModalCategories.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export type ModalCategory = {
  id: string;
  label: string;
  color: string;
  type: string;
  icon?: string;
};

export async function getModalCategories(type: string): Promise<ModalCategory[]> {
  let { data, error } = await supabase
    .from('modal_categories')
    .select('*')
    .or(`type.eq.${type},type.eq.all`)
    .order('label', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }
  return data as ModalCategory[];
}
