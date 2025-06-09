
// /components/BucketCard.tsx
'use client';

import React from 'react';

interface BucketCardProps {
  title: string;
  category: string;
  imageUrl?: string;
  onClick: () => void;
}

export default function BucketCard({ title, category, imageUrl, onClick }: BucketCardProps) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition"
    >
      {imageUrl && (
        <div className="h-40 w-full">
          <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-4">
        <span className="inline-block text-xs font-semibold bg-purple-100 text-purple-800 rounded-full px-2 py-0.5 mb-2">
          {category}
        </span>
        <h3 className="text-lg font-bold truncate">{title}</h3>
      </div>
    </div>
  );
}
