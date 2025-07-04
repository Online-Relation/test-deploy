// /components/BucketFilter.tsx
'use client';

import React from 'react';

// Definer de gyldige perioder som union-typer
export type PeriodKey = '1m' | '3m' | '1y' | '3y';

interface BucketFilterProps {
  current: PeriodKey;
  onChange: (period: PeriodKey) => void;
}

const periods: { key: PeriodKey; label: string }[] = [
  { key: '1m', label: '1 måned' },
  { key: '3m', label: '3 måneder' },
  { key: '1y', label: '1 år' },
  { key: '3y', label: '3 år' },
];

export default function BucketFilter({ current, onChange }: BucketFilterProps) {
  return (
    <div className="flex gap-2 mb-4 justify-center sm:justify-start">
      {periods.map(p => (
        <button
          key={p.key}
          onClick={() => onChange(p.key)}
          className={`px-3 py-1 rounded-full transition ${
            current === p.key
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
