// /components/profile/ProfileTabs.tsx
import React from 'react';

type TabKey = 'sizes' | 'wishes' | 'preferences' | 'energy' | 'meals' | 'personality' | 'relationship';

interface Props {
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
}

const tabs: { key: TabKey; label: string }[] = [
  { key: 'sizes', label: 'Tøjstørrelser' },
  { key: 'wishes', label: 'Ønskeliste' },
  { key: 'preferences', label: 'Kærlighed' },
  { key: 'energy', label: 'Energi' },
  { key: 'meals', label: 'Drinks og Mad' },
  { key: 'personality', label: 'Personlighed' },
  { key: 'relationship', label: 'Parforhold' },
];

export function ProfileTabs({ activeTab, setActiveTab }: Props) {
  const tabClass = (value: TabKey) =>
    `px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
      activeTab === value ? 'bg-primary text-white shadow' : 'bg-muted text-muted-foreground hover:bg-muted/70'
    }`;

  return (
    <div className="flex justify-center gap-2 flex-wrap">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => setActiveTab(tab.key)}
          className={tabClass(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
