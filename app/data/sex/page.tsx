// /app/data/sex/page.tsx

'use client';

import React from 'react';

export default function SexDataPage() {
  return (
    <div className="max-w-md mx-auto mt-8">
      <div className="rounded-2xl shadow-lg bg-white dark:bg-gray-900 p-6 flex flex-col items-center">
        <h1 className="text-2xl font-bold mb-4 text-center">Sex Data</h1>
        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-xl p-4 text-gray-700 dark:text-gray-200">
          <p className="text-base text-center">
            Her kommer visualisering og statistik for sex-data mellem Mads og Stine.<br />
            (Denne side er kun en test-skabelon.)
          </p>
        </div>
      </div>
    </div>
  );
}
