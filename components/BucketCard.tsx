// /components/BucketCard.tsx
'use client';

import React from 'react';

interface BucketCardProps {
  title: string;
  category?: string;
  imageUrl?: string;
  description?: string;
  onClick: () => void;
}

export default function BucketCard({
  title,
  category,
  imageUrl,
  description,
  onClick,
}: BucketCardProps) {
  // Use fallback if category is empty or undefined
  const displayCategory = category && category.trim() !== '' ? category : 'Uden kategori';

  return (
    <div
      onClick={onClick}
      className="cursor-pointer bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition relative"
    >
      {/* Category badge overlay */}
      <span className="absolute top-2 left-2 inline-block text-xs font-semibold bg-purple-100 text-purple-800 rounded-full px-2 py-0.5 z-10">
        {displayCategory}
      </span>
      {imageUrl && (
        <div className="h-40 w-full overflow-hidden">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-4 pt-8">
        <h3 className="text-lg font-bold truncate">{title}</h3>
        {description && (
          <p className="mt-2 text-sm text-gray-600 line-clamp-3">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
