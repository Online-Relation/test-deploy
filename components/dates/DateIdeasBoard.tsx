// /components/dates/DateIdeasBoard.tsx
"use client";
import { useEffect, useState } from "react";
import KanbanBoard from "@/components/common/KanbanBoard";
import ModalCard from "@/components/ui/globalmodal/ModalCard";
import GlobalModal from "@/components/ui/globalmodal/GlobalModal";
import { supabase } from "@/lib/supabaseClient";

type DateIdea = {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  gallery_images?: any[];
  categories?: any[];
  type: string;
  status: "idea" | "planned" | "done";
  created_by?: string;
  created_at?: string;
};

const columns = [
  { key: "idea", label: "Idéer" },
  { key: "planned", label: "Planlagt" },
  { key: "done", label: "Fuldført" },
];

export default function DateIdeasBoard() {
  const [ideas, setIdeas] = useState<DateIdea[]>([]);
  const [loading, setLoading] = useState(false);
  const [createCol, setCreateCol] = useState<null | string>(null);

  async function fetchIdeas() {
    setLoading(true);
    const { data, error } = await supabase
      .from("modal_objects")
      .select("*")
      .eq("type", "date-idea")
      .order("created_at", { ascending: false });
    if (error) {
      alert("Fejl ved hentning af idéer: " + error.message);
    } else {
      setIdeas(data || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchIdeas();
  }, []);

  async function handleCreateModalSave(data: any) {
    const status = createCol || "idea";
    const insertData = {
      title: data.title || "",
      description: data.description || "",
      image_url: data.imageUrl || "",
      gallery_images: data.galleryImages || [],
      categories: data.categories || [],
      type: "date-idea",
      status,
    };
    const { data: inserted, error } = await supabase
      .from("modal_objects")
      .insert([insertData])
      .select()
      .single();
    if (error) {
      alert("Fejl ved oprettelse: " + error.message);
    } else if (inserted) {
      setIdeas((prev) => [inserted, ...prev]);
      setCreateCol(null);
    }
  }

  function handleUpdateModal(updated: any) {
    setIdeas((prev) =>
      prev.map((idea) =>
        idea.id === updated.id
          ? {
              ...idea,
              ...updated,
              type: updated.type ?? idea.type ?? "date-idea",
              status: updated.status ?? idea.status ?? "idea",
              categories: updated.categories ?? idea.categories ?? [],
              gallery_images: updated.gallery_images ?? idea.gallery_images ?? [],
              description: updated.description ?? idea.description ?? "",
              title: updated.title ?? idea.title ?? "",
              image_url: updated.image_url ?? idea.image_url ?? "",
              created_by: updated.created_by ?? idea.created_by ?? "",
              created_at: updated.created_at ?? idea.created_at ?? "",
            }
          : idea
      )
    );
  }

  // Her bruger vi KanbanBoard til drag/drop
  async function handleUpdateStatus(id: string, newStatus: string) {
    const { error } = await supabase
      .from("modal_objects")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      alert("Fejl ved flytning: " + error.message);
      return;
    }
    setIdeas((prev) =>
      prev.map((idea) =>
        idea.id === id ? { ...idea, status: newStatus as DateIdea["status"] } : idea
      )
    );
  }

  return (
    <>
      <KanbanBoard
        columns={columns}
        cards={ideas}
        onUpdateStatus={handleUpdateStatus}
        onCreateCard={setCreateCol}
        renderCard={(idea) => (
          <ModalCard
            modal={{
              ...idea,
              type: idea.type ?? "date-idea",
              categories: idea.categories ?? [],
              gallery_images: idea.gallery_images ?? [],
              description: idea.description ?? "",
              title: idea.title ?? "",
              image_url: idea.image_url ?? "",
              created_by: idea.created_by ?? "",
              created_at: idea.created_at ?? "",
            }}
            onUpdateModal={handleUpdateModal}
          />
        )}
      />

      {/* Modal til opret */}
      <GlobalModal
        open={!!createCol}
        onClose={() => setCreateCol(null)}
        title=""
        imageUrl=""
        categories={[]}
        galleryImages={[]}
        description=""
        typeId="date-idea"
        canUploadGallery={true}
        onSave={handleCreateModalSave}
      >
        <></>
      </GlobalModal>
    </>
  );
}
