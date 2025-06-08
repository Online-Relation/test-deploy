// /app/bucketlist-couple/page.tsx
'use client';

import React, { useState } from 'react';
import { BucketProvider } from '@/context/BucketContext';
import BucketTimeline from '@/components/BucketTimeline';
import BucketBoard from '@/components/BucketBoard';

export default function BucketlistCouplePage() {
  const [view, setView] = useState<'timeline' | 'board'>('timeline');

  return (
    <BucketProvider>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Bucketlist for Par</h1>
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setView('timeline')}
            className={`px-4 py-2 rounded ${
              view === 'timeline' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            Timeline
          </button>
          <button
            onClick={() => setView('board')}
            className={`px-4 py-2 rounded ${
              view === 'board' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            Board
          </button>
        </div>
        {view === 'timeline' ? <BucketTimeline /> : <BucketBoard />}
      </div>
    </BucketProvider>
  );
}
