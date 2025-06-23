// /components/profile/MealsSection.tsx
import React from 'react';
import { Sizes } from '@/types/profile';

interface Props {
  sizes: Sizes;
  setSizes: React.Dispatch<React.SetStateAction<Sizes>>;
  handleSaveSizes: () => void;
}

export function MealsSection({ sizes, setSizes, handleSaveSizes }: Props) {
  return (
    <>
      <h2 className="text-xl font-semibold">Drinks og Mad</h2>
      <p className="text-sm text-gray-500 mb-4">Udfyld dine yndlingsretter, kager og drinks</p>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Yndlingsretter</h3>
          {Array.from({ length: 5 }).map((_, i) => (
            <input
              key={`meal_${i + 1}`}
              type="text"
              value={(sizes as any)[`meal_${i + 1}`] || ''}
              onChange={(e) => setSizes((prev) => ({ ...prev, [`meal_${i + 1}`]: e.target.value }))}
              className="w-full border rounded px-3 py-2 mt-1 mb-2"
              placeholder={`Ret ${i + 1}`}
            />
          ))}
        </div>

        <div>
          <h3 className="text-lg font-semibold">Yndlingskager</h3>
          {Array.from({ length: 5 }).map((_, i) => (
            <input
              key={`cake_${i + 1}`}
              type="text"
              value={(sizes as any)[`cake_${i + 1}`] || ''}
              onChange={(e) => setSizes((prev) => ({ ...prev, [`cake_${i + 1}`]: e.target.value }))}
              className="w-full border rounded px-3 py-2 mt-1 mb-2"
              placeholder={`Kage ${i + 1}`}
            />
          ))}
        </div>

        <div>
          <h3 className="text-lg font-semibold">Yndlingsdrinks</h3>
          {Array.from({ length: 5 }).map((_, i) => (
            <input
              key={`drink_${i + 1}`}
              type="text"
              value={(sizes as any)[`drink_${i + 1}`] || ''}
              onChange={(e) => setSizes((prev) => ({ ...prev, [`drink_${i + 1}`]: e.target.value }))}
              className="w-full border rounded px-3 py-2 mt-1 mb-2"
              placeholder={`Drink ${i + 1}`}
            />
          ))}
        </div>
      </div>

      <button
        onClick={handleSaveSizes}
        className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 mt-6"
      >
        Gem mad og drinks
      </button>
    </>
  );
}
