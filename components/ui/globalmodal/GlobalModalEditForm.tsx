// components/ui/globalmodal/GlobalModalEditForm.tsx
"use client";

import React, { useState, useEffect } from "react";
import Badge from "@/components/ui/CategoryBadge";
import ImageGallery from "./ImageGallery";
import SaveButton from "@/components/ui/globalmodal/SaveButton";
import { GalleryImage } from "./types";
import heic2any from "heic2any";
import { uploadImageToSupabase } from "@/lib/uploadImageToSupabase";
import { useUserContext } from "@/context/UserContext";
import RichTextEditor from "@/components/ui/RichTextEditor"; // IMPORT

type GlobalModalEditFormProps = {
  initialTitle?: string;
  initialImageUrl?: string;
  initialCategories?: string[];
  initialGalleryImages?: GalleryImage[];
  initialDescription?: string; // NYT
  canUploadGallery?: boolean;
  onSave: (data: {
    title: string;
    imageUrl: string;
    categories: string[];
    galleryImages: GalleryImage[];
    description: string;      // NYT
  }) => void;
  onCancel: () => void;
  onGalleryImagesChange: (newImages: GalleryImage[]) => void;
  setDescription?: (desc: string) => void; // NYT
};

export default function GlobalModalEditForm({
  initialTitle = "",
  initialImageUrl = "",
  initialCategories = [],
  initialGalleryImages = [],
  initialDescription = "",
  canUploadGallery = false,
  onSave,
  onCancel,
  onGalleryImagesChange,
  setDescription,
}: GlobalModalEditFormProps) {
  const { user, loading } = useUserContext();
  const [title, setTitle] = useState(initialTitle);
  const [imageUrl, setImageUrl] = useState(initialImageUrl);
  const [categories, setCategories] = useState(initialCategories);
  const [galleryImages, setGalleryImages] = useState(initialGalleryImages);
  const [newCategory, setNewCategory] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [description, _setDescription] = useState(initialDescription);

  // Synk med parent hvis løftet state gives
  useEffect(() => {
    if (setDescription) setDescription(description);
  }, [description, setDescription]);

  useEffect(() => {
    onGalleryImagesChange(galleryImages);
  }, [galleryImages, onGalleryImagesChange]);

  const handleAddCategory = () => {
    const trimmed = newCategory.trim();
    if (trimmed && !categories.includes(trimmed)) {
      setCategories([...categories, trimmed]);
      setNewCategory("");
    }
  };

  const handleRemoveCategory = (cat: string) => {
    setCategories(categories.filter((c) => c !== cat));
  };

  // Banner billede upload & HEIC-konvertering
  async function handleBannerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === "image/heic" || file.name.endsWith(".heic")) {
      try {
        const heic2any = (await import("heic2any")).default;
        const jpgBlob = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.95 });
        const jpgFile = new File([jpgBlob as BlobPart], file.name.replace(/\.heic$/i, ".jpg"), {
          type: "image/jpeg",
        });
        setBannerFile(jpgFile);
        setBannerPreview(URL.createObjectURL(jpgFile));
      } catch (err) {
        alert("Kunne ikke konvertere HEIC-billede. Prøv et andet format.");
        setBannerFile(null);
        setBannerPreview(null);
      }
    } else {
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  }

  // Banner-billede upload states
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(initialImageUrl || null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);

    let uploadedUrl = imageUrl;

    if (bannerFile && user?.id) {
      try {
        uploadedUrl = await uploadImageToSupabase(bannerFile, user.id, "global-images");
      } catch (err) {
        alert("Kunne ikke uploade billede. Prøv igen.");
        setIsSaving(false);
        return;
      }
    }

    onSave({
      title,
      imageUrl: uploadedUrl,
      categories,
      galleryImages,
      description,   // NYT
    });
    setIsSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
      <label className="flex flex-col">
        <span className="font-semibold mb-1">Titel</span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border rounded px-3 py-2"
        />
      </label>

      <label className="flex flex-col">
        <span className="font-semibold mb-1">Banner billede</span>
        {bannerPreview ? (
          <img
            src={bannerPreview}
            alt="Banner preview"
            className="w-full h-40 object-cover rounded-xl mb-2"
          />
        ) : null}
        <input
          type="file"
          accept="image/*,.heic"
          onChange={handleBannerChange}
          className="mb-2"
        />
        <span className="text-xs text-gray-500">Du kan uploade jpg, png, webp eller heic fra iPhone.</span>
      </label>

      <div>
        <span className="font-semibold mb-1 block">Kategorier</span>
        <div className="flex flex-wrap gap-2 mb-2">
          {categories.map((cat) => (
            <Badge key={cat}>
              {cat}{" "}
              <button
                type="button"
                onClick={() => handleRemoveCategory(cat)}
                className="ml-1 text-red-600 font-bold"
                aria-label={`Fjern kategori ${cat}`}
              >
                &times;
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Tilføj kategori"
            className="border rounded px-3 py-2 flex-grow"
          />
          <button
            type="button"
            onClick={handleAddCategory}
            className="btn btn-primary"
          >
            Tilføj
          </button>
        </div>
      </div>

      <div>
        <span className="font-semibold mb-2 block">Galleri</span>
        <ImageGallery
          images={galleryImages}
          canUpload={canUploadGallery}
          onImagesChange={setGalleryImages}
        />
      </div>

      {/* RichText editor */}
      <div>
        <span className="font-semibold mb-1 block">Beskrivelse</span>
        <div className="border rounded p-2 min-h-[120px] bg-gray-50">
          <RichTextEditor value={description} onChange={_setDescription} />
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-secondary"
        >
          Annuller
        </button>
        <SaveButton type="submit" loading={isSaving}>
          Gem
        </SaveButton>
      </div>
    </form>
  );
}
