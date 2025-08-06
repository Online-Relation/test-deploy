// /components/profile/ProfileTabs.tsx
'use client';

import React from 'react';

type TabKey =
  | 'sizes'
  | 'wishes'
  | 'preferences'
  | 'energy'
  | 'personality'
  | 'relationship';

interface Props {
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
}

export function ProfileTabs({ activeTab, setActiveTab }: Props) {
  const tabs: { key: TabKey; label: string }[] = [
    { key: 'sizes', label: 'Størrelser' },
    { key: 'wishes', label: 'Ønskeliste' },
    { key: 'preferences', label: 'Præferencer' },
    { key: 'energy', label: 'Energi & Dopamin' },
    { key: 'personality', label: 'Personlighed' },
    { key: 'relationship', label: 'Parforhold' },
  ];

  return (
    <div className="flex flex-wrap justify-center gap-2 mb-4">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => setActiveTab(tab.key)}
          className={`px-3 py-1 rounded-full text-sm border shadow-sm transition-all ${
            activeTab === tab.key
              ? 'bg-pink-600 text-white'
              : 'bg-white text-gray-700'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
