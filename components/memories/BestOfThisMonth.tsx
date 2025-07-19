// components/memories/BestOfThisMonth.tsx

import React from "react";
import MemoriesGallery, { DashboardImage } from "./MemoriesGallery";

interface BestOfThisMonthProps {
  images: DashboardImage[];
  onMemoryClick?: (img: DashboardImage, allImages: DashboardImage[]) => void;
}

function isThisMonth(dateString?: string) {
  if (!dateString) return false;
  const d = new Date(dateString);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth()
  );
}

const BestOfThisMonth: React.FC<BestOfThisMonthProps> = ({ images, onMemoryClick }) => {
  // Filtrér billeder til denne måned (taget_at -> ellers created_at)
  const imagesThisMonth = images.filter(img =>
    isThisMonth(img.taken_at || img.created_at)
  );
  if (imagesThisMonth.length === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold text-center mb-4 text-purple-700">
        De bedste øjeblikke fra denne måned
      </h2>
      <MemoriesGallery images={imagesThisMonth} onMemoryClick={onMemoryClick} />
    </section>
  );
};

export default BestOfThisMonth;
