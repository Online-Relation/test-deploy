// /components/ui/globalmodal/ModalOpener.tsx
"use client";

import { useState, useEffect } from "react";
import GlobalModal from "./GlobalModal";
import { fetchModalObject, ModalObject, updateModalObject } from "@/lib/modalObjects";
import { Category, GalleryImage } from "./types";

type Props = {
  modalId: string; // UUID fra modal_objects
  children?: React.ReactNode; // Fx en knap, billede, etc.
};

export default function ModalOpener({ modalId, children }: Props) {
  const [open, setOpen] = useState(false);
  const [modalObj, setModalObj] = useState<ModalObject | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [description, setDescription] = useState<string>("");

  // Load modal data ved åbning
  useEffect(() => {
    if (open) {
      fetchModalObject(modalId).then((obj) => {
        setModalObj(obj);
        setCategories(obj?.categories ?? []);
        setGalleryImages(obj?.gallery_images ?? []);
        setDescription(obj?.description ?? "");
      });
    }
  }, [open, modalId]);

  // Callback ved gem — opdaterer både Supabase og lokal state
  async function handleSave(data: {
    title?: string;
    imageUrl?: string;
    categories?: Category[];
    galleryImages?: GalleryImage[];
    description?: string;
    type?: string;
  }) {
    if (!modalObj) return;

    const updatedData = {
      title: data.title ?? modalObj.title ?? "",
      image_url: data.imageUrl ?? modalObj.image_url ?? "",
      categories: data.categories ?? modalObj.categories ?? [],
      gallery_images: data.galleryImages ?? modalObj.gallery_images ?? [],
      description: data.description ?? modalObj.description ?? "",
      type: data.type ?? modalObj.type ?? "",
    };

    const updatedModal = await updateModalObject(modalObj.id, updatedData);
    if (updatedModal) {
      setModalObj(updatedModal);
      setCategories(updatedModal.categories ?? []);
      setGalleryImages(updatedModal.gallery_images ?? []);
      setDescription(updatedModal.description ?? "");
      // Lad modalen være åben — luk kun ved manuel lukning
    } else {
      alert("Kunne ikke opdatere modal.");
    }
  }

  if (!modalObj) {
    return (
      <button onClick={() => setOpen(true)}>
        {children ?? "Åbn modal"}
      </button>
    );
  }

  return (
    <>
      <button onClick={() => setOpen(true)}>
        {children ?? "Åbn modal"}
      </button>
      <GlobalModal
        open={open}
        onClose={() => setOpen(false)}
        title={modalObj.title}
        imageUrl={modalObj.image_url}
        categories={categories}
        galleryImages={galleryImages}
        description={description}
        canUploadGallery={true}
        onSave={handleSave}
        setDescription={setDescription}
        typeId={modalObj.type}
      >
        {/* Du kan putte ekstra children her hvis ønsket */}
        <div />
      </GlobalModal>
    </>
  );
}
