// /components/widgets/GenerateRecommendationButton.tsx

'use client';

import { useState } from 'react';

export default function GenerateRecommendationButton({
  userId,
  forPartner = 'stine',
}: {
  userId: string;
  forPartner?: 'mads' | 'stine';
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/generate-recommendation', {
        method: 'POST',
        body: JSON.stringify({ user_id: userId, for_partner: forPartner }),
        headers: { 'Content-Type': 'application/json' },
      });

      const json = await res.json();
      setResult(json.text || 'Ingen tekst genereret');
    } catch (err) {
      setResult('❌ Fejl ved kald');
    }
    setLoading(false);
  };

  return (
    <div className="border rounded p-4 bg-gray-900 text-white max-w-xl space-y-3">
      <h2 className="text-lg font-semibold">🔁 Generer anbefaling manuelt</h2>
      <button
        onClick={handleClick}
        disabled={loading}
        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
      >
        {loading ? 'Genererer...' : 'Generér anbefaling'}
      </button>
      {result && (
        <div className="mt-2 text-sm whitespace-pre-wrap border-t pt-2 text-gray-300">
          {result}
        </div>
      )}
    </div>
  );
}
