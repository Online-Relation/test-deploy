// /lib/dashboardImages.ts
import { supabase } from "@/lib/supabaseClient";

// Opdater dashboard-billede
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

// Slet dashboard-billede
export async function deleteDashboardImage(id: string) {
  const { error } = await supabase
    .from("dashboard_images")
    .delete()
    .eq("id", id);
  if (error) {
    console.error("deleteDashboardImage error:", error);
    throw error;
  }
  return true;
}
