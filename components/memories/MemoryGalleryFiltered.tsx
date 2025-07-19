// components/memories/MemoryGalleryFiltered.tsx

import React from "react";
import MemoriesGallery, { DashboardImage } from "./MemoriesGallery";

interface Props {
  images: DashboardImage[];
  activeCategory: string;
  activeLocation: string;
  search: string;
  onMemoryClick?: (img: DashboardImage, allImages: DashboardImage[]) => void;
}

const MemoryGalleryFiltered: React.FC<Props> = ({
  images,
  onMemoryClick,
}) => {
  // Debug log for at vise hvad der faktisk kommer ind
  console.log("[MemoryGalleryFiltered] images:", images);

  // Vis ALT uden filter
  return (
    <MemoriesGallery images={images} onMemoryClick={onMemoryClick} />
  );
};

export default MemoryGalleryFiltered;
