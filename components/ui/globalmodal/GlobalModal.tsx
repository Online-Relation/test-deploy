// /components/ui/globalmodal/GlobalModal.tsx
"use client";
import { ReactNode, useState } from "react";
import { X } from "lucide-react";
import Badge from "@/components/ui/globalmodal/CategoryBadge";
import ImageGallery from "../globalmodal/ImageGallery";
import GlobalModalEditForm from "../globalmodal/GlobalModalEditForm";
import { Category, GalleryImage } from "@/components/ui/globalmodal/types";

type GlobalModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  imageUrl?: string;
  children: ReactNode;
  categories?: Category[];
  footer?: ReactNode;
  galleryImages?: GalleryImage[];
  canUploadGallery?: boolean;
  onSave?: (data: {
    title?: string;
    imageUrl?: string;
    galleryImages?: GalleryImage[];
    categories?: Category[];
    description?: string;
    type?: string;
  }) => void;
  description?: string;
  setDescription?: (desc: string) => void;
  typeId?: string;
};

export default function GlobalModal({
  open,
  onClose,
  title,
  imageUrl,
  children,
  categories = [],
  footer,
  galleryImages = [],
  canUploadGallery = false,
  onSave,
  description,
  setDescription,
  typeId,
}: GlobalModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const typeLabel = typeId ? typeId.charAt(0).toUpperCase() + typeId.slice(1) : "";

  if (!open) return null;

  function handleSave(updatedData: {
    title?: string;
    imageUrl?: string;
    galleryImages?: GalleryImage[];
    categories?: Category[];
    description?: string;
    type?: string;
  }) {
    console.log("GlobalModal > handleSave kaldt med data:", updatedData);
    if (onSave) onSave(updatedData);
    setIsEditing(false); // Luk modal KUN her - kun ved Gem
  }

  function handleCancel() {
    console.log("GlobalModal > handleCancel (annuller redigering)");
    setIsEditing(false);
  }

  const initialType = typeId ? { id: typeId, label: typeLabel } : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-white/20 p-4">
      <div
        className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden relative flex flex-col"
        style={{ maxHeight: "90vh" }}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 z-20"
          aria-label="Close"
          type="button"
          style={{
            background: "white",
            borderRadius: "50%",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <X size={28} />
        </button>

        <div
          className="px-8 pt-6 pb-4 flex flex-col text-left overflow-y-auto"
          style={{ flexGrow: 1, minHeight: 0 }}
        >
          {isEditing ? (
            <GlobalModalEditForm
              initialTitle={title}
              initialImageUrl={imageUrl}
              initialGalleryImages={galleryImages}
              initialCategories={categories}
              initialDescription={description ?? ""}
              initialType={initialType}
              onCancel={handleCancel}
              onSave={handleSave}
              setDescription={setDescription}
              canUploadGallery={canUploadGallery}
            />
          ) : (
            <>
              

              {galleryImages.length > 0 ? (
                <div className="mb-4 rounded-2xl overflow-hidden w-full max-w-full" style={{ height: "14rem" }}>
                  <ImageGallery
                    images={galleryImages}
                    canUpload={false}
                    onImagesChange={() => {}}
                  />
                </div>
              ) : imageUrl ? (
                <div className="mb-4 w-full max-w-full">
                  <img
                    src={imageUrl}
                    alt="Modal image"
                    className="w-full h-56 object-cover rounded-2xl max-w-full"
                  />
                </div>
              ) : (
                <div className="mb-4 text-gray-500">No image available</div>
              )}

              {galleryImages.length > 0 && (
                <div className="mb-6 w-full max-w-full">
                  <ImageGallery
                    images={galleryImages}
                    canUpload={false}
                    onImagesChange={() => {}}
                  />
                </div>
              )}

              {title && <h2 className="text-2xl font-bold mb-2">{title}</h2>}

              {description && (
                <div className="prose prose-sm text-gray-700 mb-3" dangerouslySetInnerHTML={{ __html: description }} />
              )}

              {children}

              <div className="border-b border-gray-300 w-full my-4" />

              {categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {categories.map((cat) => {
                    const validColors = ["orange", "blue", "green", "purple", "gray"] as const;
                    let color = validColors.includes(cat.color as any) ? cat.color : "gray";
                    return (
                      <Badge color={color} key={cat.id}>
                        {cat.label}
                      </Badge>
                    );
                  })}
                </div>
              )}
              {typeLabel && (
  <span className="inline-block mb-3 bg-gray-100 text-gray-800 text-xs font-semibold px-3 py-1 rounded-full">
    Type: {typeLabel}
  </span>
)}
            </>
          )}
        </div>

        {!isEditing && (
          <div className="border-t px-8 py-5 flex justify-between flex-shrink-0">
            <button
              className="btn btn-primary"
              onClick={() => {
                console.log("GlobalModal > Edit knap klikket");
                setIsEditing(true);
              }}
            >
              Edit
            </button>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
