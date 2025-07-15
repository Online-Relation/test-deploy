// /components/ui/GlobalModal.tsx
"use client";
import { ReactNode, useState } from "react";
import { X } from "lucide-react";
import Badge from "@/components/ui/CategoryBadge";
import ImageGallery from "../globalmodal/ImageGallery";
import GlobalModalEditForm from "../globalmodal/GlobalModalEditForm";
import SaveButton from "@/components/ui/globalmodal/SaveButton";

type GlobalModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  imageUrl?: string;
  children: ReactNode;
  categories?: string[];
  footer?: ReactNode;
  galleryImages?: Array<{
    id: string;
    url: string;
    alt?: string;
  }>;
  canUploadGallery?: boolean;
  onUploadGalleryClick?: (newImages: Array<{ id: string; url: string; alt?: string }>) => void;
  onSave?: (data: {
    title?: string;
    imageUrl?: string;
    galleryImages?: Array<{ id: string; url: string; alt?: string }>;
    categories?: string[];
    description?: string; // NYT
  }) => void;
  description?: string;      // NYT
  setDescription?: (desc: string) => void; // NYT
};

export default function GlobalModal({
  open,
  onClose,
  title,
  imageUrl,
  children,
  categories,
  footer,
  galleryImages = [],
  canUploadGallery = false,
  onUploadGalleryClick,
  onSave,
  description,
  setDescription,
}: GlobalModalProps) {
  const [isEditing, setIsEditing] = useState(false);

  if (!open) return null;

  function handleSave(updatedData: {
    title?: string;
    imageUrl?: string;
    galleryImages?: Array<{ id: string; url: string; alt?: string }>;
    categories?: string[];
    description?: string;
  }) {
    setIsEditing(false);
    if (onSave) onSave(updatedData);
  }

  function handleCancel() {
    setIsEditing(false);
  }

  const onGalleryChange = onUploadGalleryClick ?? (() => {});

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-white/20 p-4">
      <div
        className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden relative flex flex-col"
        style={{ maxHeight: "90vh" }}
      >
        {/* Close button */}
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

        {/* Modal Content */}
        <div
          className="px-8 pt-6 pb-4 flex flex-col text-left overflow-y-auto"
          style={{ flexGrow: 1, minHeight: 0 }}
        >
          {isEditing ? (
            <GlobalModalEditForm
              initialTitle={title}
              initialImageUrl={imageUrl}
              initialGalleryImages={galleryImages}
              initialCategories={categories ?? []}
              initialDescription={description ?? ""}       // NYT
              onCancel={handleCancel}
              onSave={handleSave}
              onGalleryImagesChange={onGalleryChange}
              setDescription={setDescription}             // NYT
            />
          ) : (
            <>
              {/* Gallery or fallback image */}
              {galleryImages.length > 0 ? (
                <div className="mb-4 rounded-2xl overflow-hidden w-full max-w-full" style={{ height: "14rem" }}>
                  <ImageGallery
                    images={galleryImages}
                    canUpload={canUploadGallery}
                    onImagesChange={onGalleryChange}
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

              {/* Extra gallery under the banner */}
              {galleryImages.length > 0 && (
                <div className="mb-6 w-full max-w-full">
                  <ImageGallery
                    images={galleryImages}
                    canUpload={canUploadGallery}
                    onImagesChange={onGalleryChange}
                  />
                </div>
              )}

              {/* Title */}
              {title && <h2 className="text-2xl font-bold mb-2">{title}</h2>}

              {/* Content (RichText) */}
              {description && (
                <div className="prose prose-sm text-gray-700 mb-3" dangerouslySetInnerHTML={{ __html: description }} />
              )}

              {children}

              {/* Divider */}
              <div className="border-b border-gray-300 w-full my-4" />

              {/* Categories */}
              {categories && categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {categories.map((cat) => (
                    <Badge key={cat}>{cat}</Badge>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer in view-mode, NOT in edit mode */}
        {!isEditing && (
          <div className="border-t px-8 py-5 flex justify-between flex-shrink-0">
            <button
              className="btn btn-primary"
              onClick={() => setIsEditing(true)}
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
