// /lib/comments.ts
import { supabase } from "@/lib/supabaseClient";

export type Comment = {
  id: string;
  modal_id: string;
  text: string;
  user_id: string;
  author: string; // RET: hedder 'author'
  created_at: string;
};

export async function fetchComments(modalId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .eq("modal_id", modalId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data as Comment[];
}

export async function addComment(
  modalId: string,
  text: string,
  userId: string
): Promise<Comment> {
  // Hent display_name fra profiles
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("display_name, email")
    .eq("id", userId)
    .single();

  if (profileError) throw new Error(profileError.message);

  const author = profile?.display_name || profile?.email || "Ukendt bruger";

  const { data, error } = await supabase
    .from("comments")
    .insert([
      {
        modal_id: modalId,
        text,
        user_id: userId,
        author, // RET
      },
    ])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Comment;
}
