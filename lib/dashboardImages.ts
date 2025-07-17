// /lib/dashboardImages.ts
import { supabase } from "@/lib/supabaseClient";

export async function updateDashboardImage(
  id: string,
  updates: Partial<{ title: string; description: string; type: string; categories: any[] }>
) {
  console.log("updateDashboardImage payload:", updates); // <-- DEBUG
  const { data, error } = await supabase
    .from("dashboard_images")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) {
    console.error("updateDashboardImage error:", error);
    return null;
  }
  return data;
}
