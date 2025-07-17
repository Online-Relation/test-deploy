// /components/ui/globalmodal/ModalCard.tsx
"use client";
import { useState } from "react";
import GlobalModal from "./GlobalModal";
import Badge from "./CategoryBadge";
import UserAvatarName from "./UserAvatarName";
import CommentSection from "./CommentSection";
import { ModalObject, updateModalObject } from "@/lib/modalObjects";
import { Category, GalleryImage } from "./types";

type Props = {
  modal: ModalObject & {
    categories?: Category[];
    gallery_images?: GalleryImage[];
    description?: string;
  };
  onUpdateModal?: (modal: ModalObject) => void;
};

export default function ModalCard({ modal, onUpdateModal }: Props) {
  const [open, setOpen] = useState(false);
  const [modalState, setModalState] = useState(modal);

  async function handleModalSave(data: {
    title?: string;
    imageUrl?: string;
    categories?: Category[];
    galleryImages?: GalleryImage[];
    description?: string;
    type?: string;
  }) {
    console.log("ModalCard > handleModalSave kaldt med data:", data);

    const categoriesWithType =
      (data.categories ?? modalState.categories ?? []).map(cat => ({
        ...cat,
        type: cat.type || "global",
      }));

    const updateData = {
      title: data.title ?? modalState.title ?? "",
      description: data.description ?? modalState.description ?? "",
      image_url: data.imageUrl ?? modalState.image_url ?? "",
      categories: categoriesWithType,
      gallery_images: data.galleryImages ?? modalState.gallery_images ?? [],
      type: data.type ?? modalState.type ?? "",
    };

    console.log("ModalCard > updateData der sendes til DB:", updateData);

    const updated = await updateModalObject(modal.id, updateData);
    if (updated) {
      setModalState(updated);
      if (onUpdateModal) onUpdateModal(updated);
      setOpen(false); // Luk modal KUN her - altså kun på gem
      console.log("ModalCard > Modal lukker nu efter save");
    } else {
      alert("Kunne ikke opdatere modal.");
    }
  }

  return (
    <>
      <div
        className="bg-white shadow-xl rounded-2xl overflow-hidden cursor-pointer hover:scale-105 transition-transform duration-200 max-w-xs w-full"
        onClick={() => setOpen(true)}
      >
        {modalState.image_url && (
          <img src={modalState.image_url} alt="Banner" className="w-full h-40 object-cover" />
        )}
        <div className="p-5 flex flex-col gap-2">
          <UserAvatarName userId={modalState.created_by} createdAt={modalState.created_at} />
          <h2 className="font-bold text-lg text-gray-800">{modalState.title}</h2>
          <div className="flex gap-2 flex-wrap mb-2">
            {(modalState.categories || []).map((cat) => (
              <Badge color={cat.color} key={cat.id}>
                {cat.label}
              </Badge>
            ))}
          </div>
          <div
            className="prose prose-sm text-gray-700 mb-2"
            dangerouslySetInnerHTML={{ __html: modalState.description || "" }}
          />
        </div>
      </div>

      <GlobalModal
        open={open}
        onClose={() => setOpen(false)}
        title={modalState.title}
        imageUrl={modalState.image_url || undefined}
        categories={modalState.categories || []}
        galleryImages={modalState.gallery_images || []}
        description={modalState.description || ""}
        typeId={modalState.type}
        canUploadGallery={true}
        onSave={handleModalSave}
      >
        <UserAvatarName userId={modalState.created_by} createdAt={modalState.created_at} className="mt-4" />
        <CommentSection modalId={modalState.id} />
      </GlobalModal>
    </>
  );
}
