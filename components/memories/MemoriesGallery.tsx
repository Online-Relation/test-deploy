"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import MonthlyGallerySection from "@/components/memories/MonthlyGallerySection";
import CategoryBadge from "@/components/ui/CategoryBadge";
import { TagBadge } from "@/components/ui/TagBadge";

const BUCKET_NAME = "global-images";

interface Category {
  id: string;
  label: string;
  color?: string;
  emoji?: string;
}
export interface DashboardImage {
  id: string;
  image_url: string;
  original_image_url?: string;
  taken_at?: string;
  title?: string;
  latitude?: number;
  longitude?: number;
  created_at?: string;
  categories?: Category[];
  user_id?: string;
}

type MemoriesGalleryProps = {
  images: DashboardImage[];
  onMemoryClick?: (img: DashboardImage, allImages: DashboardImage[]) => void;
};

export function getImageUrl(img: DashboardImage) {
  if (!img.image_url) return "";
  if (img.image_url.startsWith("http")) return img.image_url;
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(img.image_url);
  return data.publicUrl;
}

// Saml ALLE kategorier på tværs af alle billeder (med global counter)
function getGlobalCategoryCounts(images: DashboardImage[]) {
  const counts: Record<string, { count: number; category: any }> = {};
  images.forEach(img => {
    if (img.categories && img.categories.length > 0) {
      img.categories.forEach(cat => {
        if (!cat) return;
        if (!counts[cat.id]) counts[cat.id] = { count: 0, category: cat };
        counts[cat.id].count++;
      });
    }
  });
  // Returnér array så det er lettere at mappe over i JSX
  return Object.values(counts);
}

// ---- MemoriesGallery-komponent ----
const MemoriesGallery = ({ images, onMemoryClick }: MemoriesGalleryProps) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const globalCategoryCounts = getGlobalCategoryCounts(images);

  // Kategorier: badges øverst (globale, med global count)
  const renderCategoryBadges = () => (
    <div className="flex flex-wrap gap-2 mb-6 justify-center">
      {globalCategoryCounts.map(({ category, count }) => (
        <button
          key={category.id}
          className="focus:outline-none"
          onClick={() => setSelectedCategoryId(category.id)}
          type="button"
        >
          <CategoryBadge color="orange">
            {category.emoji ? category.emoji + " " : ""}
            {category.label}
            <span className="ml-1 text-xs font-semibold">({count})</span>
          </CategoryBadge>
        </button>
      ))}
      {selectedCategoryId && (
        <button
          onClick={() => setSelectedCategoryId(null)}
          className="ml-4 text-sm px-4 py-1 bg-gray-200 rounded-full font-semibold hover:bg-gray-300 transition"
          type="button"
        >
          Nulstil filter
        </button>
      )}
    </div>
  );

  // Filtrér billeder hvis kategori valgt
  const filteredImages = selectedCategoryId
    ? images.filter(img =>
        img.categories?.some(cat => cat.id === selectedCategoryId)
      )
    : images;

  // Hvis kategori er valgt: vis ALLE billeder i grid
  if (selectedCategoryId) {
    // Find badge info til header (emoji/label)
    const cat = globalCategoryCounts.find(c => c.category.id === selectedCategoryId)?.category;
    return (
      <div>
        {renderCategoryBadges()}
        <div className="mb-6 flex items-center justify-center gap-3">
          <CategoryBadge color="orange">
            {cat?.emoji ? cat.emoji + " " : ""}
            {cat?.label}
          </CategoryBadge>
          <TagBadge label={`${filteredImages.length} minder`} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {filteredImages.map((img) => (
            <div
              key={img.id}
              className="relative aspect-square overflow-hidden cursor-pointer group rounded-xl shadow-lg transition-transform duration-200 hover:scale-105 hover:shadow-2xl"
              onClick={() => onMemoryClick?.(img, filteredImages)}
            >
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
      </div>
    );
  }

  // Ellers: vis kategori-badges og grupperet per måned som nu
  // ...måned-badges har stadig kun count for dén måned!
  // (Men det er OK – badges øverst er altid tværgående)

  // ---- MONTHLY GALLERY GROUPING ----
  function groupImagesByMonth(images: DashboardImage[]) {
    const groups: Record<string, DashboardImage[]> = {};
    images.forEach(img => {
      const dateStr = img.taken_at || img.created_at;
      if (!dateStr) return;
      const date = new Date(dateStr);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1)
        .toString()
        .padStart(2, "0")}`;
      if (!groups[monthKey]) groups[monthKey] = [];
      groups[monthKey].push(img);
    });
    return groups;
  }

  const groups = groupImagesByMonth(images);
  const sortedMonthKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));

  return (
    <div>
      {renderCategoryBadges()}
      {sortedMonthKeys.map((key) => {
        const [year, month] = key.split("-").map(Number);
        return (
          <MonthlyGallerySection
            key={key}
            year={year}
            month={month}
            images={groups[key]}
            onMemoryClick={onMemoryClick}
          />
        );
      })}
    </div>
  );
};

export default MemoriesGallery;
