// components/memories/MonthlyGallerySection.tsx

import React from "react";
import { DashboardImage } from "./MemoriesGallery"; // juster evt. path!
import { getImageUrl } from "./MemoriesGallery";    // juster evt. path!
import { TagBadge } from "@/components/ui/TagBadge";
import CategoryBadge from "@/components/ui/CategoryBadge"; // Hvis du stadig bruger den til enkelte billeder

type Props = {
  year: number;
  month: number;
  images: DashboardImage[];
  onMemoryClick?: (img: DashboardImage, allImages: DashboardImage[]) => void;
};

const monthNames = [
  "Januar", "Februar", "Marts", "April", "Maj", "Juni",
  "Juli", "August", "September", "Oktober", "November", "December"
];

const MonthlyGallerySection = ({ year, month, images, onMemoryClick }: Props) => (
  <section className="mb-10">
    <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
      {monthNames[month - 1]} {year}
      <TagBadge label={`${images.length} minder`} />
    </h2>
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {images.map((img) => (
        <div
          key={img.id}
          className="relative aspect-square overflow-hidden cursor-pointer group rounded-xl shadow-lg transition-transform duration-200 hover:scale-105 hover:shadow-2xl"
          onClick={() => onMemoryClick?.(img, images)}
        >
          {/* Emoji-badge på selve billedet */}
          {img.categories && img.categories[0]?.emoji && (
            <div className="absolute top-2 left-2 text-xl bg-white/80 backdrop-blur-sm rounded-full px-2 shadow z-10">
              {img.categories[0].emoji}
            </div>
          )}
          <img
            src={getImageUrl(img)}
            alt={img.title || "Minde"}
            className="w-full h-full object-cover rounded-xl"
          />
          {img.title && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-black/30 text-white px-4 py-1 rounded-full text-sm font-semibold backdrop-blur-md shadow-lg z-10">
              {img.title}
            </div>
          )}
          <div className="absolute bottom-2 right-2 bg-white/80 backdrop-blur-md text-xs px-3 py-1 rounded-full shadow font-medium">
            {(() => {
              const dateStr = img.taken_at || img.created_at;
              return dateStr
                ? new Date(dateStr).toLocaleDateString("da-DK", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "Ukendt dato";
            })()}
          </div>
        </div>
      ))}
    </div>
  </section>
);

export default MonthlyGallerySection;
