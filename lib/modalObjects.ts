// lib/api/modalObjects.ts (eller filnavnet du bruger)
import { supabase } from "@/lib/supabaseClient";
import { Category } from "@/components/ui/globalmodal/types";

export type ModalObject = {
  id: string;
  type: string;
  reference_id?: string;
  title?: string;
  image_url?: string;
  created_by: string;
  created_at: string;
  categories?: Category[];        // skal være jsonb i Supabase
  gallery_images?: { id: string; url: string; alt?: string }[];
  description?: string;
  url?: string;           // <-- NYT
  mission?: string;       // <-- NYT
};

function prepModalData(obj: Partial<ModalObject>) {
  return {
    ...obj,
    categories: obj.categories && obj.categories.length > 0 ? obj.categories : null,
    gallery_images: obj.gallery_images && obj.gallery_images.length > 0 ? obj.gallery_images : null,
    description: obj.description || null,
    image_url: obj.image_url || null,
    title: obj.title || null,
    reference_id: obj.reference_id || null,
    url: obj.url || null,               // <-- NYT
    mission: obj.mission || null,       // <-- NYT
  };
}

export async function fetchModalObject(id: string): Promise<ModalObject | null> {
  const { data, error } = await supabase
    .from("modal_objects")
    .select("*")
    .eq("id", id)
    .single();
  if (error) {
    console.error("fetchModalObject error:", error);
    return null;
  }
  return data as ModalObject;
}

export async function createModalObject(obj: Omit<ModalObject, "id" | "created_at">): Promise<ModalObject | null> {
  const toSave = prepModalData(obj);
  const { data, error } = await supabase
    .from("modal_objects")
    .insert(toSave)
    .select()
    .single();
  if (error) {
    console.error("createModalObject error:", error);
    return null;
  }
  return data as ModalObject;
}

export async function updateModalObject(
  id: string,
  updates: Partial<Omit<ModalObject, "id" | "created_at" | "created_by">>
): Promise<ModalObject | null> {
  const toSave = prepModalData(updates);
  const { data, error } = await supabase
    .from("modal_objects")
    .update(toSave)
    .eq("id", id)
    .select()
    .single();
  if (error) {
    console.error("updateModalObject error:", error);
    return null;
  }
  return data as ModalObject;
}

export async function fetchAllModalObjects(type?: string): Promise<ModalObject[]> {
  let query = supabase.from("modal_objects").select("*").order("created_at", { ascending: false });
  if (type) query = query.eq("type", type);
  const { data, error } = await query;
  if (error) {
    console.error("fetchAllModalObjects error:", error);
    return [];
  }
  return data as ModalObject[];
}
