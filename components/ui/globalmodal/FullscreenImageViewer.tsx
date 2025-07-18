// /components/ui/globalmodal/FullscreenImageViewer.tsx

"use client";
import React from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

type FullscreenImageViewerProps = {
  images: string[];            // array af billede-URLs
  currentIndex: number;        // hvilket billede vises nu?
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  alt?: string;
};

const FullscreenImageViewer: React.FC<FullscreenImageViewerProps> = ({
  images,
  currentIndex,
  onClose,
  onPrev,
  onNext,
  alt,
}) => {
  if (!images.length) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black bg-opacity-95 flex items-center justify-center select-none"
      style={{ cursor: "zoom-out" }}
      onClick={onClose}
    >
      {/* Venstre pil */}
      {images.length > 1 && (
        <button
          onClick={e => { e.stopPropagation(); onPrev(); }}
          className="absolute left-5 top-1/2 -translate-y-1/2 bg-black/60 text-white rounded-full p-2 hover:bg-black z-50"
          aria-label="Forrige billede"
          style={{ fontSize: 32 }}
        >
          <ChevronLeft size={40} />
        </button>
      )}
      {/* Luk */}
      <button
        onClick={e => { e.stopPropagation(); onClose(); }}
        className="absolute top-8 right-10 text-white bg-black/70 rounded-full p-2 hover:bg-black z-50"
        aria-label="Luk"
        style={{ fontSize: 32 }}
      >
        <X size={36} />
      </button>
      {/* Højre pil */}
      {images.length > 1 && (
        <button
          onClick={e => { e.stopPropagation(); onNext(); }}
          className="absolute right-5 top-1/2 -translate-y-1/2 bg-black/60 text-white rounded-full p-2 hover:bg-black z-50"
          aria-label="Næste billede"
          style={{ fontSize: 32 }}
        >
          <ChevronRight size={40} />
        </button>
      )}

      <img
        src={images[currentIndex]}
        alt={alt || ""}
        className="max-w-full max-h-full rounded-xl shadow-lg"
        style={{
          boxShadow: "0 6px 40px rgba(0,0,0,0.35)",
          objectFit: "contain",
        }}
        onClick={e => e.stopPropagation()}
        draggable={false}
      />

      {/* Små cirkler til billede-indikator */}
      {images.length > 1 && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-2">
          {images.map((img, idx) => (
            <span
              key={idx}
              className={`block w-3 h-3 rounded-full ${idx === currentIndex ? 'bg-white' : 'bg-white/40'}`}
              style={{ transition: "background 0.2s" }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FullscreenImageViewer;
