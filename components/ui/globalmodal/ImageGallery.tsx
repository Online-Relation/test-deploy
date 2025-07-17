// /components/ui/globalmodal/ImageGallery.tsx
"use client";
import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Upload } from "lucide-react";
import clsx from "clsx";
import { uploadImageToSupabase } from "@/lib/uploadImageToSupabase";
import { useUserContext } from "@/context/UserContext";

type GalleryImage = {
  id: string;
  url: string;
  alt?: string;
  uploadedBy?: string;
  uploadedAt?: string;
  avatarUrl?: string;
};

type ImageGalleryProps = {
  images: GalleryImage[];
  onImagesChange: (images: GalleryImage[]) => void;
  canUpload?: boolean;
};

export default function ImageGallery({
  images,
  onImagesChange,
  canUpload = false,
}: ImageGalleryProps) {
  const [current, setCurrent] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [uploading, setUploading] = useState(false);
  const { user } = useUserContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [transitioning, setTransitioning] = useState(false);

  const handleNext = () => {
    if (current < images.length - 1) {
      setTransitioning(true);
      setTimeout(() => {
        setCurrent(current + 1);
        setTransitioning(false);
      }, 140);
    }
  };

  const handlePrev = () => {
    if (current > 0) {
      setTransitioning(true);
      setTimeout(() => {
        setCurrent(current - 1);
        setTransitioning(false);
      }, 140);
    }
  };

  const handleThumbClick = (i: number) => {
    setCurrent(i);
  };

  const handleDeleteImage = (id: string) => {
    const updatedImages = images.filter(img => img.id !== id);
    onImagesChange(updatedImages);
    setCurrent(prev => (prev > 0 ? prev - 1 : 0));
  };

  useEffect(() => {
    if (scrollRef.current) {
      const thumb = scrollRef.current.querySelectorAll(".gallery-thumb")[current] as HTMLElement;
      if (thumb && scrollRef.current) {
        thumb.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    }
  }, [current, images.length]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadImageToSupabase(file, user.id);
      const newImage: GalleryImage = {
        id: String(Date.now()),
        url,
        alt: file.name,
        uploadedBy: user.display_name || user.email || "Bruger",
        uploadedAt: new Date().toISOString(),
      };
      const newImages = [...images, newImage];
      console.log("ImageGallery > handleFileChange > onImagesChange", newImages);
      onImagesChange(newImages);
      setCurrent(newImages.length - 1); // Skift til det nye billede
    } catch (error) {
      alert("Upload fejlede");
      console.error(error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-4">
        <div className="text-gray-400">Ingen billeder endnu</div>
        {canUpload && (
          <>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <button type="button" className="btn btn-primary" onClick={handleUploadClick} disabled={uploading}>
              <Upload className="w-5 h-5 mr-2" /> {uploading ? "Uploader..." : "Upload billede"}
            </button>
          </>
        )}
      </div>
    );
  }

  const currentImg = images[current];

  return (
    <div className="w-full flex flex-col items-center relative">
      <div className="relative w-full flex items-center justify-center" style={{ minHeight: 240 }}>
        <button
          type="button"
          className={clsx(
            "absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/80 rounded-full p-2 shadow transition hover:scale-110",
            { "opacity-0 pointer-events-none": current === 0 }
          )}
          onClick={handlePrev}
          aria-label="Forrige billede"
        >
          <ChevronLeft />
        </button>

        <div
          className={clsx(
            "mx-auto rounded-xl overflow-hidden shadow-lg transition-all duration-150",
            transitioning && "scale-95 opacity-60"
          )}
          style={{ width: "100%", maxWidth: 420, minHeight: 220, maxHeight: 320, background: "#f8fafc" }}
        >
          <img
            src={currentImg.url}
            alt={currentImg.alt || ""}
            className="w-full h-[220px] object-cover bg-white transition"
            draggable={false}
          />
        </div>

        <button
          type="button"
          className={clsx(
            "absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/80 rounded-full p-2 shadow transition hover:scale-110",
            { "opacity-0 pointer-events-none": current === images.length - 1 }
          )}
          onClick={handleNext}
          aria-label="Næste billede"
        >
          <ChevronRight />
        </button>
      </div>

      {/* Slet billede knap under hovedbilledet hvis redigering */}
      {canUpload && (
        <button
          type="button"
          className="mt-2 text-xs text-red-500 hover:text-red-700"
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteImage(currentImg.id);
          }}
        >
          Slet billede
        </button>
      )}

      <div
        className="w-full flex items-center gap-2 overflow-x-auto mt-2 pb-1 px-1"
        ref={scrollRef}
        style={{ maxWidth: 480 }}
      >
        {images.map((img, i) => (
          <button
            type="button"
            key={img.id}
            className={clsx(
              "gallery-thumb rounded-lg border-2 transition shadow-sm",
              i === current
                ? "border-primary ring-2 ring-primary"
                : "border-white hover:border-gray-300"
            )}
            style={{ minWidth: 48, width: 48, height: 48, overflow: "hidden", background: "#fff" }}
            onClick={(e) => {
              e.stopPropagation();
              handleThumbClick(i);
            }}
            aria-label={`Se billede ${i + 1}`}
          >
            <img
              src={img.url}
              alt={img.alt || ""}
              className="w-full h-full object-cover"
              draggable={false}
            />
          </button>
        ))}

        {canUpload && (
          <>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              className="gallery-thumb ml-2 rounded-lg border-2 border-dashed border-primary/70 bg-primary/10 flex items-center justify-center transition hover:bg-primary/20"
              style={{ minWidth: 48, width: 48, height: 48 }}
              onClick={handleUploadClick}
              disabled={uploading}
              aria-label="Upload billede"
            >
              <Upload className="w-6 h-6 text-primary" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
