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
      <div className="max-w-screen-lg mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="text-2xl font-bold mb-4 text-center sm:text-left">
          Bucketlist for Par
        </h1>
        <div className="flex flex-col sm:flex-row justify-center sm:justify-start gap-4 mb-6">
          <button
            onClick={() => setView('timeline')}
            className={`w-full sm:w-auto px-4 py-2 rounded ${
              view === 'timeline' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            Timeline
          </button>
          <button
            onClick={() => setView('board')}
            className={`w-full sm:w-auto px-4 py-2 rounded ${
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
