import React from "react";
import { DashboardImage } from "./MemoriesGallery"; // eller hvor du har typen
import { getImageUrl } from "./MemoriesGallery";    // eller fra utils!
import { TagBadge } from "@/components/ui/TagBadge";
import CategoryBadge from "@/components/ui/CategoryBadge";


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

// Hjælpefunktion: find mest populære kategori
function getMostPopularCategory(images: DashboardImage[]) {
  const counts: Record<string, { count: number; category: any }> = {};
  images.forEach(img => {
    if (img.categories && img.categories.length > 0) {
      const cat = img.categories[0]; // evt. loop over alle hvis du vil!
      if (!cat) return;
      if (!counts[cat.id]) counts[cat.id] = { count: 0, category: cat };
      counts[cat.id].count++;
    }
  });
  // Find kategori med flest billeder
  const sorted = Object.values(counts).sort((a, b) => b.count - a.count);
  return sorted.length > 0 ? sorted[0].category : null;
}

const MonthlyGallerySection = ({ year, month, images, onMemoryClick }: Props) => {
  const mostPopularCategory = getMostPopularCategory(images);

  return (
    <section className="mb-10">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
  {monthNames[month - 1]} {year}
  <TagBadge label={`${images.length} minder`} />
 {mostPopularCategory && (
  <span className="ml-2">
    <CategoryBadge color="orange">
      {mostPopularCategory.emoji ? mostPopularCategory.emoji + " " : ""}
      {mostPopularCategory.label}
    </CategoryBadge>
  </span>
)}


</h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {images.map((img) => (
          <div
            key={img.id}
            className="relative aspect-square overflow-hidden cursor-pointer group rounded-xl shadow-lg transition-transform duration-200 hover:scale-105 hover:shadow-2xl"
            onClick={() => onMemoryClick?.(img, images)}
          >
            {/* Emoji-badge */}
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
};

export default MonthlyGallerySection;
