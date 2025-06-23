// /components/profile/PreferencesSection.tsx

import { FC } from 'react';
import { Sizes } from '@/types/profile';


interface PreferencesSectionProps {
  sizes: Sizes;
  setSizes: React.Dispatch<React.SetStateAction<Sizes>>;
  handleSaveSizes: () => void;
}

export const PreferencesSection: FC<PreferencesSectionProps> = ({
  sizes,
  setSizes,
  handleSaveSizes,
}) => {
  return (
    <>
      <h2 className="text-xl font-semibold">Kærlighed</h2>
      <p className="text-sm text-gray-500 mb-4">Dine kærlighedssprog og hvad du vil overraskes med</p>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Kærlighedssprog</h3>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i}>
            <label className="block text-sm font-medium mb-1">Prioritet {i + 1}</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={sizes[`love_language_${i + 1}` as keyof Sizes] || ''}
              onChange={(e) =>
                setSizes((prev) => ({
                  ...prev,
                  [`love_language_${i + 1}`]: e.target.value,
                }))
              }
            >
              <option value="">Vælg kærlighedssprog</option>
              <option value="Anerkende ord">Anerkende ord</option>
              <option value="Fysisk berøring">Fysisk berøring</option>
              <option value="Tjenester">Tjenester</option>
              <option value="Gaver">Gaver</option>
              <option value="Tid sammen">Tid sammen</option>
            </select>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-semibold">Overrask mig med…</h3>
        <textarea
          className="w-full border rounded px-3 py-2"
          rows={3}
          placeholder="Små eller store ting du gerne vil overraskes med"
          value={sizes.surprise_ideas || ''}
          onChange={(e) =>
            setSizes((prev) => ({
              ...prev,
              surprise_ideas: e.target.value,
            }))
          }
        />
      </div>

      <button
        onClick={handleSaveSizes}
        className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 mt-6"
      >
        Gem kærlighedsprofil
      </button>
    </>
  );
};
