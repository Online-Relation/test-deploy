// /components/ui/globalmodal/GlobalModalEditForm.tsx
"use client";
import React, { useState, useEffect } from "react";
import ImageGallery from "./ImageGallery";
import SaveButton from "@/components/ui/globalmodal/SaveButton";
import { Category, GalleryImage } from "./types";
import { uploadImageToSupabase } from "@/lib/uploadImageToSupabase";
import { useUserContext } from "@/context/UserContext";
import RichTextEditor from "@/components/ui/RichTextEditor";
import CategorySelect from "@/components/ui/globalmodal/CategorySelect";
import TypeSelect from "@/components/ui/globalmodal/TypeSelect";

type GlobalModalEditFormProps = {
  initialTitle?: string;
  initialImageUrl?: string;
  initialCategories?: Category[];
  initialGalleryImages?: GalleryImage[];
  initialDescription?: string;
  initialType?: { id: string; label: string } | null;
  canUploadGallery?: boolean;
  onSave: (data: {
    title: string;
    imageUrl: string;
    categories: Category[];
    galleryImages: GalleryImage[];
    description: string;
    type: string;
    planned_date?: string | null; // <-- NYT FELT!
  }) => void;
  onCancel: () => void;
  setDescription?: (desc: string) => void;
  categoryType?: string;
  initialPlannedDate?: string; // <-- NYT PROP
};

export default function GlobalModalEditForm({
  initialTitle = "",
  initialImageUrl = "",
  initialCategories = [],
  initialGalleryImages = [],
  initialDescription = "",
  initialType = null,
  canUploadGallery = false,
  onSave,
  onCancel,
  setDescription,
  categoryType = "all",
  initialPlannedDate = "",
}: GlobalModalEditFormProps) {
  const { user } = useUserContext();
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [title, setTitle] = useState(initialTitle);
  const [imageUrl, setImageUrl] = useState(initialImageUrl);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>(initialGalleryImages);
  const [isSaving, setIsSaving] = useState(false);
  const [description, _setDescription] = useState(initialDescription);
  const [type, setType] = useState<{ id: string; label: string } | null>(initialType);
  const [typeError, setTypeError] = useState<string | null>(null);

  const [plannedDate, setPlannedDate] = useState(initialPlannedDate || ""); // <-- NY STATE

  // DEBUG LOG
  useEffect(() => {
    console.log("EditForm > state", { title, imageUrl, galleryImages, description, type, categories, plannedDate });
  }, [title, imageUrl, galleryImages, description, type, categories, plannedDate]);

  useEffect(() => {
    if (setDescription) setDescription(description);
  }, [description, setDescription]);

  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(initialImageUrl || null);

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
        console.log("Banner valgt (konverteret fra HEIC)", jpgFile);
      } catch (err) {
        alert("Kunne ikke konvertere HEIC-billede. Prøv et andet format.");
        setBannerFile(null);
        setBannerPreview(null);
      }
    } else {
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
      console.log("Banner valgt", file);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!type) {
      setTypeError("Du skal vælge eller oprette en type.");
      return;
    }
    setTypeError(null);
    setIsSaving(true);

    let uploadedUrl = imageUrl;
    if (bannerFile && user?.id) {
      try {
        uploadedUrl = await uploadImageToSupabase(bannerFile, user.id, "global-images");
        console.log("Banner uploaded til Supabase", uploadedUrl);
      } catch (err) {
        alert("Kunne ikke uploade billede. Prøv igen.");
        setIsSaving(false);
        return;
      }
    }

    const savePayload = {
      title,
      imageUrl: uploadedUrl,
      categories,
      galleryImages,
      description,
      type: type.id,
      planned_date: type.id === "date-idea" && plannedDate ? plannedDate : null, // <-- GEMMER KUN FOR DATE-IDEA
    };
    console.log("EditForm > handleSubmit > onSave kald med payload:", savePayload);

    onSave(savePayload);
    setIsSaving(false);
  }

  function handleGalleryChange(newImages: GalleryImage[]) {
    console.log("EditForm > handleGalleryChange kaldt med", newImages);
    setGalleryImages(newImages);
    // VIGTIGT: Ingen onSave her, modal skal ikke lukkes ved galleri upload
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
      <label className="flex flex-col">
        <span className="font-semibold mb-1">Titel</span>
        <input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            console.log("EditForm > Titel ændret", e.target.value);
          }}
          className="border rounded px-3 py-2"
        />
      </label>

      <label className="flex flex-col">
        <span className="font-semibold mb-1">Type</span>
        <TypeSelect
          value={type}
          onChange={(t) => {
            setType(t);
            console.log("EditForm > Type ændret", t);
          }}
        />
        {typeError && <span className="text-red-500 text-xs mt-1">{typeError}</span>}
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
        <input type="file" accept="image/*,.heic" onChange={handleBannerChange} className="mb-2" />
        <span className="text-xs text-gray-500">Du kan uploade jpg, png, webp eller heic fra iPhone.</span>
      </label>

      {/* PLANLAGT DATO KUN FOR DATE-IDEA */}
      {type?.id === "date-idea" && (
        <label className="flex flex-col">
          <span className="font-semibold mb-1">Planlagt dato</span>
          <input
            type="date"
            value={plannedDate}
            onChange={e => setPlannedDate(e.target.value)}
            className="border rounded px-3 py-2"
          />
        </label>
      )}

      <div>
        <span className="font-semibold mb-2 block">Galleri</span>
        <ImageGallery
          images={galleryImages}
          canUpload={canUploadGallery}
          onImagesChange={handleGalleryChange}
        />
      </div>

      <div>
        <span className="font-semibold mb-1 block">Beskrivelse</span>
        <div className="border rounded p-2 min-h-[120px] bg-gray-50">
          <RichTextEditor
            value={description}
            onChange={(val) => {
              _setDescription(val);
              console.log("EditForm > Beskrivelse ændret", val);
            }}
          />
        </div>
      </div>

      <div>
        <span className="font-semibold mb-1 block">Kategorier</span>
        <CategorySelect
          value={categories}
          onChange={(c) => {
            setCategories(c);
            console.log("EditForm > Kategorier ændret", c);
          }}
          categoryType={type?.id || "global"}
        />
      </div>

      <div className="flex justify-end gap-4 pt-4 border-t">
        <button
          type="button"
          onClick={() => {
            onCancel();
            console.log("EditForm > Annuller klik");
          }}
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
