// /components/profile/WishSection.tsx
import React from 'react';

interface Wish {
  id?: string;
  description: string;
}

interface Props {
  wishes: Wish[];
  savingWishes: boolean;
  addWishField: () => void;
  updateWish: (idx: number, desc: string) => void;
  removeWish: (idx: number) => void;
  handleSaveWishes: () => void;
}

export function WishSection({
  wishes,
  savingWishes,
  addWishField,
  updateWish,
  removeWish,
  handleSaveWishes,
}: Props) {
  return (
    <>
      <h2 className="text-xl font-semibold">Min ønskeliste</h2>
      {wishes.map((w, idx) => (
        <div key={idx} className="flex gap-2">
          <input
            type="text"
            placeholder="Beskriv ønske"
            value={w.description}
            onChange={e => updateWish(idx, e.target.value)}
            className="flex-grow border rounded px-3 py-2"
          />
          <button onClick={() => removeWish(idx)} className="text-red-600">Slet</button>
        </div>
      ))}
      <button onClick={addWishField} className="w-full bg-gray-100 text-gray-800 py-2 rounded hover:bg-gray-200">
        Tilføj ønske
      </button>
      <button
        onClick={handleSaveWishes}
        disabled={savingWishes}
        className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
      >
        {savingWishes ? 'Gemmer…' : 'Gem ønskeliste'}
      </button>
    </>
  );
}
