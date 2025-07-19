"use client";

import React from "react";
import { supabase } from "@/lib/supabaseClient";
import MonthlyGallerySection from "@/components/memories/MonthlyGallerySection";

// ----- TYPEDEFS (flyt evt. til types/models hvis du vil) -----
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

// ----- HJÆLPERFUNKTION -----
export function getImageUrl(img: DashboardImage) {
  if (!img.image_url) return "";
  if (img.image_url.startsWith("http")) return img.image_url;
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(img.image_url);
  return data.publicUrl;
}

// ----- GROUP BY MONTH -----
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

// ----- HOVEDKOMPONENT -----
const MemoriesGallery = ({ images, onMemoryClick }: MemoriesGalleryProps) => {
  const groups = groupImagesByMonth(images);

  // Sortér måned-nøgler (YYYY-MM) nyeste først
  const sortedMonthKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));

  return (
    <div>
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
