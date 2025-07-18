// components/ui/globalmodal/GlobalModal.tsx
"use client";
import { ReactNode, useState, useEffect } from "react";
import { X } from "lucide-react";
import Badge from "@/components/ui/globalmodal/CategoryBadge";
import ImageGallery from "../globalmodal/ImageGallery";
import GlobalModalEditForm from "../globalmodal/GlobalModalEditForm";
import FullscreenImageViewer from "@/components/ui/globalmodal/FullscreenImageViewer";
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
    planned_date?: string | null;
    url?: string | null;
    mission?: string | null;
  }) => void;
  description?: string;
  setDescription?: (desc: string) => void;
  typeId?: string;
  modalId?: string;
  initialPlannedDate?: string;
  initialCategories?: any[];
  onDelete?: () => void;
  initialUrl?: string;
  initialMission?: string;
  date?: any;
  newDate?: any;
  setNewDate?: React.Dispatch<any>;
  readOnly?: boolean;
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
  modalId,
  initialPlannedDate = "",
  onDelete,
  initialUrl = "",
  initialMission = "",
  date,
  newDate,
  setNewDate,
  readOnly = false,
}: GlobalModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const typeLabel = typeId ? typeId.charAt(0).toUpperCase() + typeId.slice(1) : "";

  useEffect(() => {
    if (open) setIsEditing(false);
  }, [open, modalId, typeId]);

  if (!open) return null;

  function handleSave(updatedData: {
    title?: string;
    imageUrl?: string;
    galleryImages?: GalleryImage[];
    categories?: Category[];
    description?: string;
    type?: string;
    planned_date?: string | null;
    url?: string | null;
    mission?: string | null;
  }) {
    if (onSave) onSave(updatedData);
    setIsEditing(false);
  }

  function handleCancel() {
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
          {isEditing && !readOnly ? (
            <>
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
                initialPlannedDate={initialPlannedDate || ""}
                modalId={modalId}
                onDelete={onDelete}
                initialUrl={initialUrl}
                initialMission={initialMission}
              />
              {modalId && (
                <div className="text-xs text-gray-500 text-right mt-4 select-all">
                  Modal ID: {modalId}
                </div>
              )}
            </>
          ) : (
            <>
              {imageUrl && (
                <>
                  <div className="mb-4 w-full flex justify-center items-center max-w-full bg-gray-100 rounded-2xl overflow-hidden">
                    <img
                      src={imageUrl}
                      alt="Banner"
                      className="max-w-full max-h-[380px] object-contain cursor-zoom-in"
                      style={{ display: "block" }}
                      onClick={() => setShowFullscreen(true)}
                    />
                  </div>
                  {showFullscreen && (
                    <FullscreenImageViewer
                      images={[imageUrl]}
                      currentIndex={0}
                      onClose={() => setShowFullscreen(false)}
                      onPrev={() => {}}
                      onNext={() => {}}
                      alt={title}
                    />
                  )}
                </>
              )}

              {title && <h2 className="text-2xl font-bold mb-2">{title}</h2>}

              {description && (
                <div
                  className="prose prose-sm text-gray-700 mb-3"
                  dangerouslySetInnerHTML={{ __html: description }}
                />
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

        {!isEditing && !readOnly && (
          <div className="border-t px-8 py-5 flex justify-between flex-shrink-0">
            <button
              className="btn btn-primary"
              onClick={() => {
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
