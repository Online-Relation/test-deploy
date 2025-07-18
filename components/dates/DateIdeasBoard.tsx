// /app/date-ideas/DateIdeasBoard.tsx
"use client";
import { useEffect, useState } from "react";
import KanbanBoard from "@/components/common/KanbanBoard";
import ModalCard from "@/components/ui/globalmodal/ModalCard";
import GlobalModal from "@/components/ui/globalmodal/GlobalModal";
import { supabase } from "@/lib/supabaseClient";
import { ModalObject } from "@/lib/modalObjects";

type DateIdea = ModalObject & {
  status: "idea" | "planned" | "done";
  gallery_images?: any[];
  categories?: any[];
  url?: string | null;
  mission?: string | null;
};

const columns = [
  { key: "idea", label: "Idéer" },
  { key: "planned", label: "Planlagt" },
  { key: "done", label: "Fuldført" },
];

// Helper – camelCase til snake_case KUN de felter, der findes i modal_objects!
function mapDataToDbFormat(data: any) {
  return {
    title: data.title,
    description: data.description,
    image_url: data.imageUrl || "",
    gallery_images: data.galleryImages || [],
    categories: data.categories || [],
    url: data.url || null,
    mission: data.mission || null,
    planned_date: data.planned_date || null,
    status: data.status,
    type: data.type,
    // INTET camelCase medsendes!
  };
}

export default function DateIdeasBoard() {
  const [ideas, setIdeas] = useState<DateIdea[]>([]);
  const [loading, setLoading] = useState(false);
  const [createCol, setCreateCol] = useState<null | string>(null);

  async function fetchIdeas() {
    setLoading(true);
    console.log("[DateIdeasBoard] Henter idéer...");
    const { data, error } = await supabase
      .from("modal_objects")
      .select("*")
      .eq("type", "date-idea")
      .order("created_at", { ascending: false });
    if (error) {
      alert("Fejl ved hentning af idéer: " + error.message);
    } else {
      console.log("[DateIdeasBoard] Idéer hentet:", data);
      setIdeas(data || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchIdeas();
  }, []);

  async function handleCreateModalSave(data: {
    title?: string;
    description?: string;
    imageUrl?: string;
    galleryImages?: any[];
    categories?: any[];
    url?: string | null;
    mission?: string | null;
    planned_date?: string | null;
    type?: string;
  }) {
    const status = createCol || "idea";
    const insertData = mapDataToDbFormat({
      ...data,
      type: "date-idea",
      status,
    });

    console.log("[DateIdeasBoard] Opretter ny idé, insertData:", insertData);

    const { data: inserted, error } = await supabase
      .from("modal_objects")
      .insert([insertData])
      .select()
      .single();

    if (error) {
      alert("Fejl ved oprettelse: " + error.message);
    } else if (inserted) {
      console.log("[DateIdeasBoard] Ny idé oprettet:", inserted);
      setIdeas((prev) => [inserted, ...prev]);
      setCreateCol(null);
    }
  }

  function handleUpdateModal(updated: DateIdea) {
    setIdeas((prev) =>
      prev.map((idea) => (idea.id === updated.id ? { ...idea, ...updated } : idea))
    );
  }

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
          <ModalCard modal={idea} onUpdateModal={handleUpdateModal} />
        )}
      />

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
