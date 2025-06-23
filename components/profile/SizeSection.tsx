// /components/profile/SizeSection.tsx
import React from 'react';
import { Sizes } from '@/types/profile';

interface SizeSectionProps {
  sizes: Sizes;
  setSizes: React.Dispatch<React.SetStateAction<Sizes>>;
  handleSaveSizes: () => void;
}

export const SizeSection = ({ sizes, setSizes, handleSaveSizes }: SizeSectionProps) => {
  const fields = [
    'bh', 'trusser', 'sko', 'jeans', 'kjoler', 'nederdele',
    'tshirts', 'toppe', 'buksedragt'
  ];

  return (
    <>
      <h2 className="text-xl font-semibold">Mine tøjstørrelser</h2>
      {fields.map((field) => (
        <div key={field}>
          <label className="block text-sm font-medium capitalize mb-1">{field}</label>
          <input
            type="text"
            value={sizes[field as keyof Sizes]}
            onChange={(e) =>
              setSizes((prev) => ({
                ...prev,
                [field]: e.target.value,
              }))
            }
            className="w-full border rounded px-3 py-2"
          />
        </div>
      ))}
      <button
        onClick={handleSaveSizes}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
      >
        Gem størrelser
      </button>
    </>
  );
};
