'use client';

import React from 'react';
import { Sizes } from '@/types/profile';

interface Props {
  sizes: Sizes;
  setSizes: React.Dispatch<React.SetStateAction<Sizes>>;
  colorOrder: string[];
  moveColor: (index: number, direction: 'up' | 'down') => void;
  handleSaveSizes: () => void;
}

const getColorLabel = (color: string) =>
  color === 'red' ? 'Rød – handlekraftig' :
  color === 'yellow' ? 'Gul – kreativ' :
  color === 'green' ? 'Grøn – omsorgsfuld' :
  'Blå – analytisk';

export function PersonalitySection({ sizes, setSizes, colorOrder, moveColor, handleSaveSizes }: Props) {
  return (
    <>
      <h2 className="text-xl font-semibold">Personlighed</h2>
      <p className="text-sm text-gray-500 mb-4">Angiv rækkefølgen af dine farver (1 = mest dig)</p>
      <ul className="space-y-2">
        {colorOrder.map((color, index) => (
          <li key={color} className="flex items-center justify-between bg-violet-100 px-4 py-2 rounded-xl shadow-sm">
            <span className="text-sm">{getColorLabel(color)}</span>
            <div className="flex gap-2">
              <button onClick={() => moveColor(index, 'up')} disabled={index === 0} className="text-sm px-2 py-1 bg-gray-200 rounded hover:bg-gray-300">↑</button>
              <button onClick={() => moveColor(index, 'down')} disabled={index === colorOrder.length - 1} className="text-sm px-2 py-1 bg-gray-200 rounded hover:bg-gray-300">↓</button>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-6 space-y-4">
        <h3 className="text-lg font-semibold">Beskrivelse af hver farve</h3>
        <p className="text-sm text-gray-500">Forklar hvordan hver farve passer på dig</p>
        {['red', 'yellow', 'green', 'blue'].map((color) => {
          const key = `${color}_description` as keyof Sizes;
          return (
            <div key={color}>
              <label className="block text-sm font-medium mb-1">{getColorLabel(color)}</label>
              <textarea
                className="w-full border rounded px-3 py-2"
                rows={2}
                placeholder={`Hvordan viser ${color} sig i dig?`}
                value={sizes[key] || ''}
                onChange={(e) =>
                  setSizes((prev) => ({
                    ...prev,
                    [key]: e.target.value,
                  }))
                }
              />
            </div>
          );
        })}
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-semibold">Om mig</h3>
        <textarea
          className="w-full border rounded px-3 py-2"
          rows={4}
          placeholder="Fortæl lidt om hvem du er..."
          value={sizes.personality_description || ''}
          onChange={(e) => setSizes((prev) => ({ ...prev, personality_description: e.target.value }))}
        />
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-semibold">5 nøgleord om mig</h3>
        {Array.from({ length: 5 }).map((_, i) => {
          const key = `keyword_${i + 1}` as keyof Sizes;
          return (
            <input
              key={key}
              type="text"
              value={sizes[key] || ''}
              onChange={(e) =>
                setSizes((prev) => ({
                  ...prev,
                  [key]: e.target.value,
                }))
              }
              className="w-full border rounded px-3 py-2 mt-1 mb-2"
              placeholder={`Nøgleord ${i + 1}`}
            />
          );
        })}
      </div>

      <button
        onClick={handleSaveSizes}
        className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 mt-6"
      >
        Gem personlighed
      </button>
    </>
  );
}
